import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import { uploadFile } from '../config/weaviate.js';

dotenv.config();


// Get token from environment variables
const token = process.env.TELEGRAM_BOT__ADMIN_TOKEN!;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in the environment variables');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });



export async function startBot(chatId: string, message: string) {
  try {
    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}