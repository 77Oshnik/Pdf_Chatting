// Script to list and create Pinecone indexes
require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

async function setupPinecone() {
  try {
    console.log('🔧 Connecting to Pinecone...');
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_KEY });
    
    console.log('\n📋 Listing existing indexes...');
    const indexes = await pinecone.listIndexes();
    
    if (indexes.indexes && indexes.indexes.length > 0) {
      console.log('✅ Found indexes:');
      indexes.indexes.forEach(index => {
        console.log(`   - ${index.name} (dimension: ${index.dimension}, metric: ${index.metric})`);
      });
    } else {
      console.log('❌ No indexes found.');
    }
    
    const indexName = process.env.PINECONE_INDEX || 'pdf-chat';
    console.log(`\n🔍 Checking if index "${indexName}" exists...`);
    
    const indexExists = indexes.indexes?.some(index => index.name === indexName);
    
    if (!indexExists) {
      console.log(`\n⚠️  Index "${indexName}" does not exist.`);
      console.log('📝 Creating index...');
      console.log('   Note: Google Gemini embeddings have dimension 768');
      
      await pinecone.createIndex({
        name: indexName,
        dimension: 768, // Google Gemini embedding-001 dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      
      console.log(`✅ Index "${indexName}" created successfully!`);
      console.log('⏳ Waiting for index to be ready...');
      
      // Wait for index to be ready
      let ready = false;
      while (!ready) {
        const description = await pinecone.describeIndex(indexName);
        ready = description.status?.ready;
        if (!ready) {
          console.log('   Still initializing...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log('✅ Index is ready!');
    } else {
      console.log(`✅ Index "${indexName}" already exists.`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

setupPinecone();
