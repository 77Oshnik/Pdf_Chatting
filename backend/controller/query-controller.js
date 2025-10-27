const dotenv = require('dotenv');
const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

// ✅ Initialize Pinecone
console.log('🔹 Initializing Pinecone...');
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_KEY,
});

const index = pinecone.Index(process.env.PINECONE_INDEX);
console.log(`✅ Pinecone index initialized: ${process.env.PINECONE_INDEX}`);

// ✅ Initialize Gemini + Embedding Models
console.log('🔹 Initializing Gemini Embeddings and Model...');
const embedding = new GoogleGenerativeAIEmbeddings({
  model: 'text-embedding-004',
  apiKey: process.env.GEMINI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
console.log('✅ Gemini model initialized successfully');

const queryPDF = async (req, res) => {
  try {
    const { query, fileId } = req.body;
    console.log('\n🟢 Received query request:');
    console.log('➡️ Query:', query);
    console.log('🆔 File ID:', fileId || 'All files (no filter)');

    if (!query) {
      console.warn('⚠️ Query missing in request body');
      return res.status(400).json({ error: 'Query is required' });
    }

    // Step 1️⃣: Create query embedding
    console.log('🔹 Generating embedding for query...');
    const queryEmbedding = await embedding.embedQuery(query);
    console.log('✅ Query embedding generated successfully (length):', queryEmbedding.length);

    // Step 2️⃣: Query Pinecone with optional fileId filter
    console.log('🔹 Querying Pinecone index for similar chunks...');
    const queryOptions = {
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    };
    
    // Add filter if fileId is provided
    if (fileId) {
      queryOptions.filter = { fileId: { $eq: fileId } };
      console.log('🔍 Filtering by fileId:', fileId);
    }
    
    const results = await index.query(queryOptions);

    console.log(`✅ Pinecone returned ${results.matches?.length || 0} matches`);

    // Log the matched metadata texts for clarity
    if (results.matches?.length > 0) {
      results.matches.forEach((m, i) => {
        console.log(`📄 Match ${i + 1}:`);
        console.log('   File:', m.metadata?.fileName || 'Unknown');
        console.log('   Score:', m.score?.toFixed(4));
        console.log('   Text snippet:', m.metadata?.text?.substring(0, 80), '...');
      });
    }

    // Step 3️⃣: Build context
    const context = results.matches
      ?.map((match) => match.metadata.text)
      .join('\n') || 'No relevant content found.';

    console.log('🧠 Context built for Gemini model (length):', context.length);

    // Step 4️⃣: Generate answer using Gemini
    console.log('🔹 Sending prompt to Gemini...');
    const prompt = `
You are an intelligent assistant that answers user questions based on context from documents.

Context:
${context}

Question:
${query}

Answer in clear, concise language:
`;

    const response = await model.generateContent(prompt);
    const answer = response.response.text();

    console.log('✅ Gemini response generated successfully');
    console.log('🗣️ Answer preview:', answer.substring(0, 150), '...');

    // Step 5️⃣: Send final response
    res.json({
      success: true,
      answer,
      sources: results.matches,
    });

  } catch (error) {
    console.error('\n❌ Error in queryPDF:', error);
    res.status(500).json({
      error: 'Failed to process query',
      details: error.message,
    });
  }
};

module.exports = { queryPDF };
 