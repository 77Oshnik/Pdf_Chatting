async function getEmbeddings(texts) {
  console.log(`\n🧠 Starting embedding generation...`);
  console.log(`📊 Number of text chunks to embed: ${texts.length}`);
  
  // Dynamically import to keep CJS compatibility
  const { GoogleGenerativeAIEmbeddings } = await import("@langchain/google-genai");

  console.log("🔧 Initializing Gemini embedding client...");
  const embeddingClient = new GoogleGenerativeAIEmbeddings({ 
    apiKey: process.env.GEMINI_API_KEY,
    model: "text-embedding-004" // This model supports different dimensions
  });
  
  console.log("🔄 Generating embeddings with Gemini...");
  const embeddings = await embeddingClient.embedDocuments(texts);
  
  console.log(`✅ Embeddings generated successfully! Vector dimension: ${embeddings[0]?.length || 0}\n`);
  
  // Return objects pairing each text with its embedding vector
  return embeddings.map((embedding, i) => ({
    text: texts[i],
    embedding,
  }));
}

// Backward compatibility alias if other code expects createEmbeddings
const createEmbeddings = getEmbeddings;

module.exports = { getEmbeddings, createEmbeddings };
