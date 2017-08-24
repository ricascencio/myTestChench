var Telegraf = require("telegraf"),
    config = require("config");

/** telegram app **/
console.log(config);
const token = config.get('token');
const URL = config.get('URL');
const PORT = process.env.PORT || 5000;
//const isDevelopment = process.env.NODE_ENV === 'development';

console.log(URL);

const app = new Telegraf(token);

app.command('fuel', ctx => {
    console.log("fuelChenchito");
    ctx.reply("fuelChenchito");
  });
  
app.hears('probando', ctx => {
    console.log('**BODY**' + ctx.message);
});

//app.startPolling();

app.telegram.setWebhook(`${URL}/bot${token}`);
app.startWebhook(`/bot${token}`, null, PORT);