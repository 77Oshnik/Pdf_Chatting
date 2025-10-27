'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, MessageSquare, FileText, Send, Loader2, Check, X, Eye, ChevronLeft } from 'lucide-react';

interface UploadedFile {
  fileId: string;
  fileName: string;
  chunks: number;
  uploadedAt: Date;
  filePath?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  timestamp: Date;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadStage, setUploadStage] = useState<string>('');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus('idle');
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadStage('Uploading file...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Simulate progress for upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      setUploadStage('Processing PDF...');
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        // Create object URL for PDF preview
        const pdfUrl = URL.createObjectURL(selectedFile);
        
        const uploadedFile: UploadedFile = {
          fileId: data.data.fileId,
          fileName: data.data.fileName,
          chunks: data.data.chunks,
          uploadedAt: new Date(),
          filePath: pdfUrl,
        };
        setUploadedFiles([uploadedFile, ...uploadedFiles]);
        setSelectedFileId(data.data.fileId);
        setPdfViewerUrl(pdfUrl);
        setShowPdfViewer(true);
        setUploadStatus('success');
        setSelectedFile(null);
        
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Reset progress after delay
        setTimeout(() => {
          setUploadProgress(0);
          setUploadStage('');
        }, 2000);
      } else {
        setUploadStatus('error');
        setUploadStage('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadStage('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle query
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage: Message = { role: 'user', content: query, timestamp: new Date() };
    setMessages([...messages, userMessage]);
    setQuery('');
    setIsQuerying(true);

    try {
      const response = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          fileId: selectedFileId || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your query.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Query error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I could not connect to the server.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsQuerying(false);
    }
  };

  // View PDF
  const handleViewPdf = (file: UploadedFile) => {
    if (file.filePath) {
      setPdfViewerUrl(file.filePath);
      setShowPdfViewer(true);
      setSelectedFileId(file.fileId);
    }
  };

  return (
    <div className="flex h-screen bg-linear-to-br from-slate-50 to-slate-100">{showPdfViewer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPdfViewer(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-slate-800">PDF Viewer</h3>
              </div>
              <button
                onClick={() => setShowPdfViewer(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfViewerUrl}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}
      {/* Left Panel - Upload */}
      <div className="w-1/2 border-r border-slate-200 bg-white flex flex-col">
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">Upload PDF</h1>
                <p className="text-sm text-slate-500">
                  {isUploading ? 'Processing document...' : 'Upload documents for AI analysis'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Area */}
          <div className="mb-8">
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                isUploading
                  ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
                    <p className="mb-2 text-sm text-slate-600 font-semibold">{uploadStage}</p>
                    <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{uploadProgress}% complete</p>
                  </>
                ) : (
                  <>
                    <FileText className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="mb-2 text-sm text-slate-600">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">PDF files only (Max 10MB)</p>
                  </>
                )}
              </div>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>

            {selectedFile && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">Upload successful!</span>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <X className="w-5 h-5" />
                <span className="text-sm font-medium">Upload failed. Please try again.</span>
              </div>
            )}
          </div>

          {/* Uploaded Files List */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Uploaded Documents</h2>
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.fileId}
                    onClick={() => setSelectedFileId(file.fileId)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedFileId === file.fileId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <FileText
                          className={`w-5 h-5 mt-0.5 ${
                            selectedFileId === file.fileId ? 'text-blue-600' : 'text-slate-400'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 text-sm">{file.fileName}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {file.chunks} chunks • {file.uploadedAt.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.filePath && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPdf(file);
                            }}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View PDF"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                        {selectedFileId === file.fileId && (
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="w-1/2 flex flex-col bg-white">
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">AI Chat</h1>
                <p className="text-sm text-slate-500">
                  {selectedFileId
                    ? `Chatting with: ${uploadedFiles.find((f) => f.fileId === selectedFileId)?.fileName || 'Selected file'}`
                    : 'Ask questions about all documents'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-sm font-medium">Start a conversation</p>
              <p className="text-xs mt-2 text-center max-w-sm">
                {uploadedFiles.length === 0
                  ? 'Upload a PDF document first, then ask questions about its content'
                  : 'Ask questions about your uploaded documents'}
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-300/50">
                        <p className="text-xs opacity-75 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''} • Score: {msg.sources[0]?.score?.toFixed(2)}
                        </p>
                      </div>
                    )}
                    <p className="text-xs opacity-60 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
          {isQuerying && (
            <div className="flex justify-start animate-in fade-in duration-200">
              <div className="bg-slate-100 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  <span className="text-sm text-slate-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 p-6 bg-white">
          <form onSubmit={handleQuery} className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                uploadedFiles.length === 0
                  ? 'Upload a PDF first to start chatting...'
                  : 'Ask a question about your documents...'
              }
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 transition-all"
              disabled={isQuerying || uploadedFiles.length === 0}
              autoFocus
            />
            <button
              type="submit"
              disabled={isQuerying || !query.trim() || uploadedFiles.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
              title={uploadedFiles.length === 0 ? 'Upload a PDF first' : 'Send message (Enter)'}
            >
              {isQuerying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          {selectedFileId && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Querying: {uploadedFiles.find((f) => f.fileId === selectedFileId)?.fileName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
