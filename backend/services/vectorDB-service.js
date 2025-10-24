const { Pinecone } = require("@pinecone-database/pinecone");

// Lazily initialize client only when needed to avoid crashing on startup
let pineconeClient = null;
const getPinecone = () => {
  if (!pineconeClient) {
    console.log("🔧 Initializing Pinecone client...");
    const apiKey = process.env.PINECONE_KEY;
    if (!apiKey) {
      throw new Error(
        "Pinecone is not configured. Set PINECONE_KEY in your .env file."
      );
    }
    pineconeClient = new Pinecone({ apiKey });
    console.log("✅ Pinecone client initialized successfully");
  }
  return pineconeClient;
};

const getIndex = () => {
  const indexName = process.env.PINECONE_INDEX || "pdf-index";
  console.log(`📊 Getting Pinecone index: ${indexName}`);
  return getPinecone().Index(indexName);
};

exports.storeVectors = async (vectorizedChunks = []) => {
  console.log(`\n🚀 Starting vector storage process...`);
  console.log(`📦 Total vectors to store: ${vectorizedChunks.length}`);
  
  if (!Array.isArray(vectorizedChunks)) {
    throw new TypeError("vectorizedChunks must be an array");
  }

  const index = getIndex();
  
  console.log("🔄 Preparing vectors for upsert...");
  const vectors = vectorizedChunks.map((chunk, i) => ({
    id: `chunk-${Date.now()}-${i}`,
    values: chunk.embedding,
    metadata: { text: chunk.text },
  }));
  
  console.log(`📤 Upserting ${vectors.length} vectors to Pinecone...`);
  await index.upsert(vectors);
  
  console.log("✅ Vectors stored successfully in Pinecone!\n");
};
