import express from 'express';
import bodyParser from 'body-parser';
import { startBot } from '../config/users-bot.js';


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.listen(3000, () => {
  startBot(); // Start the Telegram bot
  console.log('Server is running on port 3000');
});
