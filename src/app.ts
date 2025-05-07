import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { startBot  } from "../config/users-bot"
import path from 'path';
import { client } from '../config/weaviate';
import uploadFileRouter from './routes/uploadFile';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth';

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}


const app = express();
const port = process.env.PORT || 3000;

// pages 
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.get("/gallary", (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'gallary.html'))
});

// Routes 
app.use("/files/upload" , uploadFileRouter);
app.use("/login" , authRouter);

// Use 
app.use(helmet()); // Security headers
app.use(cors()); // CORS configuration
app.use(express.json()); // Parse JSON bodies

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);





app.use(bodyParser.json());

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

app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Weaviate URL: ${process.env.WEAVIATE_URL || 'weaviate:8080'}`);
  startBot();
});