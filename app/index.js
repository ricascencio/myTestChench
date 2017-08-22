import Telegraf, { Extra, Markup } from 'telegraf';
import config from 'config';

/** telegram app **/
const token = process.env.token || config.get('token');
const URL = process.env.URL || config.get('URL');
const PORT = process.env.PORT || 5000;
const isDevelopment = process.env.NODE_ENV === 'development';

const app = new Telegraf(token);

app.telegram.setWebhook(`${URL}/bot${token}`);
app.startWebhook(`/bot${token}`, null, PORT);