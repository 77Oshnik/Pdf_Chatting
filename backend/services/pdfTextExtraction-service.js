const fs = require('fs');
const { PDFParse } = require('pdf-parse');

exports.extractTextFromPDF = async (filepath) => {
  try {
    console.log(`\n📄 Starting PDF text extraction...`);
    console.log(`📂 File path: ${filepath}`);
    
    const fileBuffer = fs.readFileSync(filepath);
    console.log(`📊 File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

    // create parser instance
    console.log("🔧 Creating PDF parser instance...");
    const parser = new PDFParse({ data: fileBuffer });

    // get text
    console.log("📖 Extracting text from PDF...");
    const result = await parser.getText();
    console.log(`✅ Text extracted successfully! Length: ${result.text.length} characters`);

    // clean up
    await parser.destroy();
    fs.unlinkSync(filepath);
    console.log("🗑️  Temporary file cleaned up\n");

    return result.text;
  } catch (error) {
    console.error("❌ Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
};
