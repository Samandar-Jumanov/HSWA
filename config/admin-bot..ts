import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import { uploadFile, getAllImages } from '../config/weaviate.js';
import { downloadImage } from '../utils/downloadTgImage.js';

dotenv.config();

// Get token from environment variables
const token = process.env.TELEGRAM_BOT_ADMIN_TOKEN!;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in the environment variables');
  process.exit(1);
}

// Define authorized admin users (Telegram user IDs)
const AUTHORIZED_ADMIN = process.env.AUTHORIZED_ADMIN!


const adminBot = new TelegramBot(token, { polling: true });

/**
 * Check if a user is authorized to use admin commands
 * @param userId The Telegram user ID to check
 * @returns Boolean indicating if user is authorized
 */
function isAuthorizedAdmin(userId: number): boolean {
  return AUTHORIZED_ADMIN === String(userId) 
}


function startAdminBot(): void {
  console.log('Starting Admin Telegram bot...');
  
  adminBot.on('message', async (msg: TelegramBot.Message) => {
    console.log('Received message:', msg.from?.id);
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    
    if (!userId || !isAuthorizedAdmin(userId)) {
      await adminBot.sendMessage(chatId, "Unauthorized access. This bot is for admins only.");
      console.log(`Unauthorized access attempt by user ${userId || 'unknown'}`);
      return;
    }
    
    // Process photos
    if (msg.photo) {
      try {
        await adminBot.sendMessage(chatId, "Please wait while I process your image...");
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        const imageBuffer = await downloadImage(fileId, token);
        const uploadedImage = await uploadFile(imageBuffer, 'panda.jpg');
        
        if (!uploadedImage) {
          await adminBot.sendMessage(chatId, "Sorry, I couldn't upload your image. Please try again later.");
          return;
        }
        
        await adminBot.sendMessage(chatId, "Image uploaded successfully! Now querying the database...");
      } catch (error) {
        console.error('Error processing image:', error);
        await adminBot.sendMessage(chatId, "Sorry, I couldn't process your image. Please try again later.");
      }
    } 
    // Process text commands
    else if (msg.text) {
      // Handle admin text commands
      if (msg.text === '/start') {
        await adminBot.sendMessage(chatId, "Welcome, admin! You are authorized to use this bot.");
      } else if (msg.text === '/help') {
        await adminBot.sendMessage(chatId, 
          "Admin Bot Commands:\n" +
          "- Send a photo to upload it to the database\n" +
          "- /images - Get all images from the database\n" +
          "- /status - Check system status\n" +
          "- /help - Show this help message"
        );
      } else if (msg.text === '/status') {
        await adminBot.sendMessage(chatId, "System is operational. Database connection active.");
      } else if (msg.text === '/images') {
        await handleGetAllImages(chatId);
      }
    }
  });
}

/**
 * Handle the /images command to retrieve all images from Weaviate
 * @param chatId Telegram chat ID to send the response to
 */
async function handleGetAllImages(chatId: number): Promise<void> {
    try {
      await adminBot.sendMessage(chatId, "Fetching all images from the database...");
      
      const images = await getAllImages();
      
      if (!images || images.length === 0) {
        await adminBot.sendMessage(chatId, "No images found in the database.");
        return;
      }
      
      // First send summary message
      await adminBot.sendMessage(
        chatId, 
        `Found ${images.length} images in the database. Sending them to you...`
      );
      
      // Send each image to the admin
      const MAX_IMAGES = 10; // Limit to prevent flooding the chat
      const imagesToSend = images.slice(0, MAX_IMAGES);
      
      for (const img of imagesToSend) {
        try {
          // Extract image data (assuming it's stored in base64 format in img.image)
          if (!img.image) {
            await adminBot.sendMessage(chatId, `Image ${img.id} (${img.filename || 'unnamed'}) has no image data.`);
            continue;
          }
          
          // Convert base64 to buffer if necessary
          let imageBuffer;
          if (typeof img.image === 'string' && img.image.startsWith('data:image')) {
            // Handle base64 data URI
            const base64Data = img.image.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else if (Buffer.isBuffer(img.image)) {
            // Already a buffer
            imageBuffer = img.image;
          } else if (typeof img.image === 'string') {
            // Plain base64 string
            imageBuffer = Buffer.from(img.image, 'base64');
          } else {
            await adminBot.sendMessage(chatId, `Image ${img.id} data format not recognized.`);
            continue;
          }
          
          // Send the image with caption
          await adminBot.sendPhoto(chatId, imageBuffer, {
            caption: `ID: ${img.id}, Filename: ${img.filename || 'N/A'}`
          });
        } catch (imgError : any ) {
          console.error(`Error sending image ${img.id}:`, imgError);
          await adminBot.sendMessage(chatId, `Failed to send image ${img.id}: ${imgError.message}`);
        }
      }
      
      // If there are more images than the limit
      if (images.length > MAX_IMAGES) {
        await adminBot.sendMessage(
          chatId,
          `Showing ${MAX_IMAGES} of ${images.length} images. Use a more specific query to see others.`
        );
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      await adminBot.sendMessage(chatId, "Error fetching images from the database. Please try again later.");
    }
  }
  

adminBot.on('polling_error', (error: Error) => {
  console.error('Polling error:', error);
});

export { startAdminBot, adminBot };