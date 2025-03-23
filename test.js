require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on('message', (msg) => {
  console.log('Пришло сообщение:', msg.text);
  bot.sendMessage(msg.chat.id, `Ты написал: ${msg.text}`);
});
