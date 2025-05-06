import express from 'express';
import weaivateClient from 'weaviate-ts-client';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { startBot  } from "../config/users-bot"
// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;



// Setup Weaviate client
const client = weaivateClient.client({
  scheme: 'http',
  host: process.env.WEAVIATE_URL || 'weaviate:8080',
});

// Middleware
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});



// Example endpoint for Weaviate status
app.get('/api/status', async (req, res) => {
  try {
    const meta = await client.misc.metaGetter().do();
    res.json({ 
      status: 'connected',
      version: meta.version,
      modules: meta.modules 
    });
  } catch (error : any ) {
    console.error('Error connecting to Weaviate:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to connect to Weaviate',
      error: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Weaviate URL: ${process.env.WEAVIATE_URL || 'weaviate:8080'}`);
  startBot();
});