import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { queryImage } from '../config/weaviate.js'; 
dotenv.config();

interface FilePathResponse {
  ok: boolean;
  result: {
    file_path: string;
  };
  description?: string;
}



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
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in the environment variables');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

/**
 * Downloads an image from Telegram servers using file ID
 * @param fileId The ID of the file to download
 * @returns A Buffer containing the image data
 */
async function downloadImage(fileId: string): Promise<Buffer> {
  try {
    const filePathResponse = await axios.get<FilePathResponse>(
      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
    );
    
    if (!filePathResponse.data.ok) {
      throw new Error(`Failed to get file path: ${filePathResponse.data.description}`);
    }
    
    const filePath = filePathResponse.data.result.file_path;
    console.log({ res: filePathResponse.data });
    
    // Download the file using the file path
    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });

    return Buffer.from(fileResponse.data);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

/**
 * Process image to prepare it for embedding
 * @param imageBuffer Buffer containing the image data
 * @returns Processed image buffer


/**
 * Start the Telegram bot and listen for messages
 */


function startBot(): void {
  console.log('Starting Telegram bot...');
  
  bot.on('message', async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    await bot.sendPhoto(chatId ,await  readImageFromRoot(), { caption: 'Please send face-only photo' });

    
    if (msg.photo) {
      try {
        await bot.sendMessage(chatId ,"Please wait while I process your image...");
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        const imageBuffer = await downloadImage(fileId);
        const similarImage = await queryImage(imageBuffer);

        await bot.sendMessage(chatId, "Cheking image quality ");
        // const isFaceDetected = await detectFace(imageBuffer);
        await bot.sendMessage(chatId, "Querying similar images...");
        await bot.sendPhoto(chatId,  Buffer.from(deepDebugImage(similarImage), 'base64'));
        // const queryRes  = await queryImage(imageBuffer);
      } catch (error) {
        console.error('Error processing image:', error);
        await bot.sendMessage(chatId, "Sorry, I couldn't process your image. Please try again later.");
      }
    } else {
      await bot.sendMessage(chatId, "I do not accept text messages. If you want to check similarity, please send me an image.");
    }
  });
}

bot.on('polling_error', (error: Error) => {
  console.error('Polling error:', error);
});


function deepDebugImage(similarImage : any ) {
  console.log('\n===== DEEP IMAGE DEBUG =====');
  console.log(`Type of similarImage: ${typeof similarImage}`);
  
  // Check if it's null or undefined
  if (similarImage === null) {
    console.log('Image is null');
    return null;
  }
  
  if (similarImage === undefined) {
    console.log('Image is undefined');
    return null;
  }
  
  // If it's an object, examine its properties
  if (typeof similarImage === 'object') {
    console.log('Object keys:', Object.keys(similarImage));
    
    // Check if it's already a Buffer
    if (Buffer.isBuffer(similarImage)) {
      console.log('Image is already a Buffer');
      return similarImage;
    }
    
    // Check for common properties that might contain the image data
    if (similarImage.image && typeof similarImage.image === 'string') {
      console.log('Found image property (string)');
      try {
        return Buffer.from(similarImage.image, 'base64');
      } catch (e) {
        console.log('Error converting image property to Buffer:', e);
      }
    }
    
    if (similarImage.data && typeof similarImage.data === 'string') {
      console.log('Found data property (string)');
      try {
        return Buffer.from(similarImage.data, 'base64');
      } catch (e) {
        console.log('Error converting data property to Buffer:', e);
      }
    }
    
    // If it has a toString method, try using that
    if (typeof similarImage.toString === 'function' && 
        similarImage.toString !== Object.prototype.toString) {
      console.log('Object has custom toString method, trying it');
      const str = similarImage.toString();
      if (typeof str === 'string' && str.length > 100) { // Assuming base64 strings are long
        try {
          return Buffer.from(str, 'base64');
        } catch (e) {
          console.log('Error converting toString result to Buffer:', e);
        }
      }
    }
  }
  
  // If it's a string, try to convert it directly
  if (typeof similarImage === 'string') {
    console.log('Image is a string of length:', similarImage.length);
    // Show a preview of the string (first 20 chars)
    if (similarImage.length > 0) {
      console.log('String preview:', similarImage.substring(0, 20) + '...');
    }
    
    // Check if it's a base64 string with a data URL prefix
    if (similarImage.startsWith('data:')) {
      console.log('String appears to be a data URL');
      const base64Data = similarImage.split(',')[1];
      try {
        return Buffer.from(base64Data, 'base64');
      } catch (e) {
        console.log('Error converting data URL to Buffer:', e);
      }
    }
    
    // Try to convert it as a pure base64 string
    try {
      return Buffer.from(similarImage, 'base64');
    } catch (e) {
      console.log('Error converting string to Buffer:', e);
    }
  }
  
  console.log('Could not convert to Buffer - unknown format');
  console.log('===== END DEBUG =====\n');
  return null;
}


export { startBot, bot, downloadImage };