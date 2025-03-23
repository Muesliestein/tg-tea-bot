require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { findTeaByName, findTeaByType } = require('./database');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Приветственное сообщение
const welcomeMessage = `
Привет! 👋 Я — чайный бот, который расскажет тебе всё о любом чае.

Вот что ты можешь сделать:
1. Введи название чая для поиска (например, "Да Хун Пао").
2. Введи тип чая для поиска (например, "зеленый"), и я покажу список чаёв.
3. Используй команду /search для поиска по категориям.
`;

// Типы чая для меню
const teaTypes = ['Зеленый', 'Черный', 'Улун', 'Белый', 'Пуэр', 'Желтый'];

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, welcomeMessage);
});

// Поиск по названию или типу
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Игнорируем команды
  if (text.startsWith('/')) return;

  // Поиск по названию
  findTeaByName(text, (err, row) => {
    if (err) {
      console.error('Ошибка при поиске чая:', err);
      bot.sendMessage(chatId, 'Произошла ошибка при поиске информации.');
      return;
    }

    if (row) {
      sendTeaInfo(chatId, row);
    } else {
      // Если чай не найден, пробуем поиск по типу
      findTeaByType(text, (err, rows) => {
        if (err) {
          console.error('Ошибка при поиске чая:', err);
          bot.sendMessage(chatId, 'Произошла ошибка при поиске информации.');
          return;
        }

        if (rows.length > 0) {
          sendTeaList(chatId, rows);
        } else {
          bot.sendMessage(chatId, 'Чай не найден в базе данных. Попробуйте ввести другой запрос или используйте команду /search.');
        }
      });
    }
  });
});

// Команда /search
bot.onText(/\/search/, (msg) => {
  const chatId = msg.chat.id;
  const searchMenu = {
    reply_markup: {
      inline_keyboard: teaTypes.map((type) => [{ text: type, callback_data: `type_${type}` }])
    }
  };
  bot.sendMessage(chatId, 'Выберите тип чая:', searchMenu);
});

// Обработка нажатий на кнопки
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('type_')) {
    // Если выбран тип чая
    const type = data.replace('type_', '');
    findTeaByType(type, (err, rows) => {
      if (err) {
        console.error('Ошибка при поиске чая:', err);
        bot.sendMessage(chatId, 'Произошла ошибка при поиске информации.');
        return;
      }

      if (rows.length > 0) {
        sendTeaList(chatId, rows);
      } else {
        bot.sendMessage(chatId, 'Чай не найден в базе данных. Попробуйте ввести другой запрос или используйте команду /search.');
      }
    });
  } else if (data.startsWith('tea_')) {
    // Если выбрано название чая
    const teaName = data.split('_')[1];
    findTeaByName(teaName, (err, row) => {
      if (err) {
        console.error('Ошибка при поиске чая:', err);
        bot.sendMessage(chatId, 'Произошла ошибка при поиске информации.');
        return;
      }

      if (row) {
        sendTeaInfo(chatId, row);
      } else {
        bot.sendMessage(chatId, 'Чай не найден в базе данных.');
      }
    });
  }
});

// Функция для отправки информации о чае
const sendTeaInfo = (chatId, tea) => {
  const { название, тип, регион, метод_обработки, культивар, история, польза, заваривание, аромат, цена } = tea;
  const answer = `
<b>Название:</b> ${название}  
<b>Тип:</b> ${тип}  
<b>Регион:</b> ${регион}  
<b>Метод обработки:</b> ${метод_обработки}  
<b>Культивар:</b> ${культивар}  

<b>История:</b> ${история}  

<b>Польза:</b>  
- ${польза.split(', ').join('\n- ')}  

<b>Заваривание:</b>  
- Температура воды: ${заваривание.split(', ')[0]}  
- Время заваривания: ${заваривание.split(', ')[1]}  

<b>Аромат:</b> ${аромат}  

<b>Цена:</b> ${цена}
  `;
  bot.sendMessage(chatId, answer, { parse_mode: 'HTML' });
};

// Функция для отправки списка чаёв
const sendTeaList = (chatId, teas) => {
  const teaButtons = teas.map((tea) => [{ text: tea.название, callback_data: `tea_${tea.название}` }]);
  const teaMenu = {
    reply_markup: {
      inline_keyboard: teaButtons
    }
  };
  bot.sendMessage(chatId, 'Выберите чай:', teaMenu);
};

console.log('Бот запущен...');