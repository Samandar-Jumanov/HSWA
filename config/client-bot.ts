import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { languages  } from "../utils/langauges.js"
dotenv.config();

const token = process.env.TELEGRAM_BOT_ADMIN_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_ADMIN_TOKEN is not defined in the environment variables');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const ADS_FILE = path.join(process.cwd(), 'ads.json');
const USERS_FILE = path.join(process.cwd(), 'users.json');



function loadData(file, defaultValue = {}) {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error loading data from ${file}:`, error);
    return defaultValue;
  }
}

function saveData(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving data to ${file}:`, error);
  }
}

// Load existing data
const userAds = loadData(ADS_FILE);
const userSettings = loadData(USERS_FILE);

export async function startClientBot() {
  const userStates = {};
  
  // Get text based on user language
  function getText(userId, key) {
    const lang = (userSettings[userId] && userSettings[userId].language) || 'en';
    return languages[lang][key] || languages['en'][key];
  }
  
  // Create main menu keyboard
  function getMainMenuKeyboard(userId) {
    return {
      reply_markup: {
        keyboard: [
          [getText(userId, 'postAd')],
          [getText(userId, 'viewAds')],
          [getText(userId, 'help'), getText(userId, 'language')]
        ],
        resize_keyboard: true
      }
    };
  }

  // Handle /start command
  bot.onText(/\/start/, async (msg :any ) => {
    const chatId = msg.chat.id;
    const userId = msg?.from.id.toString();
    
    // Initialize user settings if not exists
    if (!userSettings[userId]) {
      userSettings[userId] = { language: 'en' };
      saveData(USERS_FILE, userSettings);
    }
    
    await bot.sendMessage(
      chatId,
      getText(userId, 'welcome'),
      getMainMenuKeyboard(userId)
    );
  });

  // Handle language change
  bot.onText(/🌐.+language|🌐.+тил|🌐.+язык/i, async (msg : any ) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    const languageOptions = {
      reply_markup: {
        keyboard: [
          [languages.en.flag, languages.uz.flag, languages.ru.flag],
          [getText(userId, 'cancel')]
        ],
        resize_keyboard: true
      }
    };
    
    await bot.sendMessage(
      chatId,
      getText(userId, 'chooseLanguage'),
      languageOptions
    );
  });

  // Handle language selection
  bot.onText(/🇬🇧 English|🇺🇿 O'zbekcha|🇷🇺 Русский/, async (msg : any ) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const messageText = msg.text;
    
    let selectedLang = 'en';
    if (messageText === languages.uz.flag) {
      selectedLang = 'uz';
    } else if (messageText === languages.ru.flag) {
      selectedLang = 'ru';
    }
    
    // Update user settings
    userSettings[userId] = { ...userSettings[userId], language: selectedLang };
    saveData(USERS_FILE, userSettings);
    
    await bot.sendMessage(
      chatId,
      getText(userId, 'languageChanged'),
      getMainMenuKeyboard(userId)
    );
  });

  // Handle the "Post a new ad" button (in multiple languages)
  bot.on("message", async (msg : any ) => {
    if (!msg.text) return;
    
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const messageText = msg.text;
    
    // Check if message is "Post a new ad" in any language
    if (messageText === languages.en.postAd || 
        messageText === languages.uz.postAd || 
        messageText === languages.ru.postAd) {
      
      // Set user state to "waiting_for_ad"
      userStates[userId] = 'waiting_for_ad';
      
      await bot.sendMessage(
        chatId,
        getText(userId, 'enterAd'),
        {
          reply_markup: {
            keyboard: [[getText(userId, 'cancel')]],
            resize_keyboard: true
          }
        }
      );
    }
  });

  bot.on("message", async (msg : any ) => {
    if (!msg.text) return;
    
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const messageText = msg.text;
    
    // Check if message is "View my ads" in any language
    if (messageText === languages.en.viewAds || 
        messageText === languages.uz.viewAds || 
        messageText === languages.ru.viewAds) {
      
      const ads = userAds[userId] || [];
      
      if (ads.length === 0) {
        await bot.sendMessage(
          chatId,
          getText(userId, 'noAds'),
          getMainMenuKeyboard(userId)
        );
        return;
      }
      
      // Display all ads with options to delete
      for (let i = 0; i < ads.length; i++) {
        await bot.sendMessage(
          chatId,
          `${getText(userId, 'adPosted')}${i+1}:\n\n${ads[i].content}\n\n${getText(userId, 'postedOn')}${ads[i].date}`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: getText(userId, 'deleteButton'), callback_data: `delete_ad_${i}` }]
              ]
            }
          }
        );
      }
      
      // Return to main menu
      await bot.sendMessage(
        chatId,
        getText(userId, 'allAds'),
        getMainMenuKeyboard(userId)
      );
    }
  });

  // Handle "Help" button (in multiple languages)
  bot.on("message", async (msg : any ) => {
    if (!msg.text) return;
    
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const messageText = msg.text;
    
    // Check if message is "Help" in any language
    if (messageText === languages.en.help || 
        messageText === languages.uz.help || 
        messageText === languages.ru.help) {
      
      await bot.sendMessage(
        chatId,
        getText(userId, 'helpMessage'),
        {
          parse_mode: "Markdown",
          reply_markup: getMainMenuKeyboard(userId).reply_markup
        }
      );
    }
  });

  // Handle "Cancel" button (in multiple languages)
  bot.on("message", async (msg : any ) => {
    if (!msg.text) return;
    
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const messageText = msg.text;
    
    // Check if message is "Cancel" in any language
    if (messageText === languages.en.cancel || 
        messageText === languages.uz.cancel || 
        messageText === languages.ru.cancel) {
      
      // Clear user state
      delete userStates[userId];
      
      await bot.sendMessage(
        chatId,
        getText(userId, 'operationCancelled'),
        getMainMenuKeyboard(userId)
      );
    }
  });

  // Handle callback queries (for deleting ads)
  bot.on('callback_query', async (query : any ) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id.toString();
    const data = query.data;
    
    if (data.startsWith('delete_ad_')) {
      const adIndex = parseInt(data.split('_')[2]);
      
      if (!userAds[userId] || adIndex >= userAds[userId].length) {
        await bot.answerCallbackQuery(query.id, { text: getText(userId, 'adNotFound') });
        return;
      }
      
      // Remove the ad
      userAds[userId].splice(adIndex, 1);
      saveData(ADS_FILE, userAds);
      
      await bot.answerCallbackQuery(query.id, { text: getText(userId, 'adDeleted') });
      await bot.deleteMessage(chatId, query.message.message_id);
      
      await bot.sendMessage(
        chatId,
        getText(userId, 'adDeletedNext'),
        getMainMenuKeyboard(userId)
      );
    }
  });

  // Handle regular messages
  bot.on("message", async (msg : any ) => {
    if (!msg.text) return;
    
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const messageText = msg.text;
    
    // Skip commands and known button texts
    if (messageText.startsWith('/') || 
        Object.values(languages).some(lang => 
          messageText === lang.postAd || 
          messageText === lang.viewAds || 
          messageText === lang.help ||
          messageText === lang.cancel ||
          messageText === lang.language ||
          messageText === lang.flag
        )) {
      return;
    }
    
    // Handle user states
    if (userStates[userId] === 'waiting_for_ad') {
      // Save the ad
      if (!userAds[userId]) {
        userAds[userId] = [];
      }
      
      userAds[userId].push({
        content: messageText,
        date: new Date().toLocaleString(),
        status: 'pending' // pending, approved, rejected
      });
      
      saveData(ADS_FILE, userAds);
      
      // Clear user state
      delete userStates[userId];
      
      await bot.sendMessage(
        chatId,
        getText(userId, 'adSubmitted'),
        getMainMenuKeyboard(userId)
      );
      return;
    }
    
    // Default response for unhandled messages
    await bot.sendMessage(
      chatId,
      getText(userId, 'notUnderstood'),
      getMainMenuKeyboard(userId)
    );
  });

  console.log('Bot started successfully!');
}

