import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // ✅ For __dirname in ESM
import { startBot } from '../config/tg-bot.js';
import {  uploadFile } from '../config/weaviate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.listen(3000, () => {
  // createSchema(); // Create schema in Weaviate on server start
  startBot(); // Start the Telegram bot
  console.log('Server is running on port 3000');
});
