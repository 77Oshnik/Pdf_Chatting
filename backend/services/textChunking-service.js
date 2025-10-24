// services/textChunking-service.js
async function chunkText(text) {
  console.log(`\n✂️  Starting text chunking process...`);
  console.log(`📏 Input text length: ${text.length} characters`);
  
  const { RecursiveCharacterTextSplitter } = await import("@langchain/textsplitters");

  console.log("⚙️  Configuring text splitter (chunkSize: 1000, overlap: 200)...");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  console.log("🔄 Creating document chunks...");
  const chunks = await splitter.createDocuments([text]);
  const chunkTexts = chunks.map(c => c.pageContent);
  
  console.log(`✅ Text chunked successfully! Total chunks: ${chunkTexts.length}\n`);
  return chunkTexts;
}

module.exports = { chunkText };
