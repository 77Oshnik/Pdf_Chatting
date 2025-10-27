// src/controllers/uploadController.js
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const { extractTextFromPDF } = require("../services/pdfTextExtraction-service");
const { chunkText } = require("../services/textChunking-service");
const { getEmbeddings } = require("../services/embedding-service");
const { storeVectors } = require("../services/vectorDB-service");
const { successResponse, errorResponse } = require("../utlis/api-response");

exports.uploadPDF = async (req, res) => {
	try {
		console.log("\n" + "=".repeat(60));
		console.log("🚀 NEW PDF UPLOAD REQUEST RECEIVED");
		console.log("=".repeat(60));
		
		// Step 1: Validate request
		console.log("\n📋 Step 1: Validating request...");
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log("❌ Validation failed:", errors.array());
			return errorResponse(res, 400, "Validation failed", errors.array());
		}
		console.log("✅ Validation passed");

		// Step 2: Ensure file exists
		console.log("\n📋 Step 2: Checking file upload...");
		if (!req.file) {
			console.log("❌ No file uploaded");
			return errorResponse(res, 400, "No file uploaded");
		}
		console.log(`✅ File received: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

		// Generate unique file ID
		const fileId = crypto.randomUUID();
		const fileName = req.file.originalname;
		console.log(`🆔 Generated File ID: ${fileId}`);

		// Step 3: Extract text
		console.log("\n📋 Step 3: Extracting text from PDF...");
		const filePath = req.file.path;
		const text = await extractTextFromPDF(filePath);

		// Step 4: Split text into chunks
		console.log("\n📋 Step 4: Splitting text into chunks...");
		const chunks = await chunkText(text);

		// Step 5: Generate embeddings for each chunk
		console.log("\n📋 Step 5: Generating embeddings...");
		const vectorizedChunks = await getEmbeddings(chunks);

		// Step 6: Store vectors in Pinecone
		console.log("\n📋 Step 6: Storing vectors in Pinecone...");
		await storeVectors(vectorizedChunks, fileId, fileName);

		// Step 7: Send response
		console.log("\n" + "=".repeat(60));
		console.log("✅ PDF PROCESSING COMPLETED SUCCESSFULLY!");
		console.log("=".repeat(60));
		console.log(`📊 Summary:`);
		console.log(`   - File: ${req.file.originalname}`);
		console.log(`   - Text length: ${text.length} characters`);
		console.log(`   - Chunks created: ${chunks.length}`);
		console.log(`   - Vectors stored: ${vectorizedChunks.length}`);
		console.log("=".repeat(60) + "\n");
		
		return successResponse(
			res,
			{
				fileId: fileId,
				fileName: fileName,
				chunks: chunks.length,
				textLength: text.length,
				preview: text.slice(0, 500),
			},
			"PDF processed, embedded, and stored successfully"
		);

	} catch (error) {
		console.error("\n" + "=".repeat(60));
		console.error("❌ uploadPDF error:", error);
		console.error("=".repeat(60) + "\n");
		return errorResponse(res, 500, "Failed to process PDF");
	}
};
