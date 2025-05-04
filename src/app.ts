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

async function promiseUploadFiles() {
  const imageNames = [
    'cat.jpg',
    'cow.jpg',
    'rabbit.jpg',
    'dog.jpg',
    'monkey.jpg',
    'tiger.jpg',
    'snake.jpg',
    'wolf.jpg',
  ];

  const imagesDir = path.join(__dirname, '../images');

  for (const imageName of imageNames) {
    const imagePath = path.join(imagesDir, imageName);

    try {
      const fileBuffer = fs.readFileSync(imagePath);
      await uploadFile(fileBuffer , imageName);
    } catch (err : any ) {
      console.error(`Failed to upload ${imageName}:`, err.message);
    }
  }
}

app.listen(3000, () => {
  // createSchema(); // Create schema in Weaviate on server start
  startBot(); // Start the Telegram bot
  promiseUploadFiles(); // Upload predefined animal images on server start
  console.log('Server is running on port 3000');
});
