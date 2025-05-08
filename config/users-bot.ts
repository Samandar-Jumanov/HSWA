import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { queryImage } from '../config/weaviate.js'; 
import { joinImages } from "../utils/join-images.js"
import { getBullyResponse } from '../config/openAI.js';
import { downloadImage } from '../utils/downloadTgImage.js';

dotenv.config();


export async function readImageFromRoot(filename: string = 'face.jpg'): Promise<Buffer> {
  const filePath = path.resolve(process.cwd(), filename);
  
  try {

    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error(`Error reading file ${filename} from root:`, error);
    throw error;
  }
}


// Get token from environment variables
const token = process.env.TELEGRAM_BOT_USER_TOKEN!;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in the environment variables');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });



function startBot(): void {
  console.log('Starting Telegram bot...');
  
  bot.on('message', async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;

    
    if (msg.photo) {
    await bot.sendPhoto(chatId ,await  readImageFromRoot(), { caption: 'Please send face-only photo' });
      try {
        await bot.sendMessage(chatId ,"Please wait while I process your image...");
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        const imageBuffer = await downloadImage(fileId , token );
      
        const similarImage = await queryImage(imageBuffer)
        console.log('Image downloaded queried !');

        const joinedImage = await joinImages(imageBuffer,Buffer.from(similarImage.image, 'base64')); 
        console.log('Image joined !');
        await bot.sendMessage(chatId, "Querying similar images...");
        await bot.sendPhoto(chatId,  joinedImage);
      } catch (error) {
        console.error('Error processing image:', error);
        await bot.sendMessage(chatId, "Sorry, I couldn't process your image. Please try again later.");
      }
    } else { 
      await bot.sendMessage(chatId, await getBullyResponse(msg.text!));
    }
    
  });
  
}

bot.on('polling_error', (error: Error) => {
  console.error('Polling error:', error);
});





export { startBot, bot, downloadImage };