import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import { uploadFile } from '../config/weaviate.js';
import { downloadImage } from './users-bot.js';
import axios from 'axios';
dotenv.config();


const token = process.env.TELEGRAM_BOT_ADMIN_TOKEN!;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in the environment variables');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

export async function startAdminBot() {
  try {
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 'Welcome to the admin bot!');
    });

    bot.on("message", async (msg : TelegramBot.Message) => {  
         
         if(msg.photo){
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const imageBuffer = await downloadImage(fileId); 
            const fileName = `image_${Date.now()}.jpg`; 
    
            const filePathRes = await axios.get(
                `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
            );
          
            if (!filePathRes.data.ok) throw new Error('Failed to get file path');
            const uploadResult = await uploadFile(imageBuffer, fileName); 
            if (uploadResult) {
                bot.sendMessage(msg.chat.id, "Image uploaded successfully!");
            } else {
                bot.sendMessage(msg.chat.id, "Failed to upload image.");
            }
         }

    });
   

  } catch (error) {
    console.error('Error sending message:', error);
  }
}