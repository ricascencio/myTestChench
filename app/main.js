/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
'use strict';

const apiai = require('apiai');
const express = require('express');
const bodyParser = require('body-parser');
const config = require('config');
const actions = require('./database/actions.js');

const TelegramBot = require('./telegrambot');
const TelegramBotConfig = require('./telegrambotconfig');

const REST_PORT = (process.env.PORT || 5000);
const DEV_CONFIG = process.env.DEV_CONFIG || config.get('DEV_CONFIG');

const APIAI_ACCESS_TOKEN = process.env.APIAI_ACCESS_TOKEN || config.get('APIAI_ACCESS_TOKEN');
const APIAI_LANG = process.env.APIAI_LANG || config.get('APIAI_LANG');
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || config.get('TELEGRAM_TOKEN');
const baseUrl = process.env.URL || config.get('URL');


// console timestamps
require('console-stamp')(console, 'yyyy.mm.dd HH:MM:ss.l');

const botConfig = new TelegramBotConfig(
    APIAI_ACCESS_TOKEN,
    APIAI_LANG,
    TELEGRAM_TOKEN);

botConfig.devConfig = DEV_CONFIG;

const bot = new TelegramBot(botConfig, baseUrl);
// bot.start(() => {
//         console.log("Bot started");
//     },
//     (errStatus) => {
//         console.error('It seems the TELEGRAM_TOKEN is wrong! Please fix it.')
//     });


const app = express();
app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
    console.log('POST webhook');

    try {
        bot.processMessage(req, res);
    } catch (err) {
        return res.status(400).send('Error while processing ' + err.message);
    }
});

app.listen(REST_PORT, function () {
    console.log('Rest service ready on port ' + REST_PORT);
});