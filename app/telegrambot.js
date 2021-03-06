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
const uuid = require('node-uuid');
const request = require('request');
const actions = require('./database/actions.js');
const bitso = require("./bitso");

var self;

module.exports = class TelegramBot {

    get apiaiService() {
        return this._apiaiService;
    }

    set apiaiService(value) {
        this._apiaiService = value;
    }

    get botConfig() {
        return this._botConfig;
    }

    set botConfig(value) {
        this._botConfig = value;
    }

    get sessionIds() {
        return this._sessionIds;
    }

    set sessionIds(value) {
        this._sessionIds = value;
    }

    constructor(botConfig, baseUrl) {
        this._botConfig = botConfig;
        var apiaiOptions = {
            language: botConfig.apiaiLang,
            requestSource: "telegram"
        };
        this._apiaiService = apiai(botConfig.apiaiAccessToken, apiaiOptions);
        this._sessionIds = new Map();

        this._webhookUrl = baseUrl + '/webhook';
        console.log('Starting bot on ' + this._webhookUrl);

        this._telegramApiUrl = 'https://api.telegram.org/bot' + botConfig.telegramToken;
        self = this;
    }

    start(responseCallback, errCallback){
        // https://core.telegram.org/bots/api#setwebhook
        request.post(this._telegramApiUrl + '/setWebhook', {
            json: {
                url: this._webhookUrl
            }
        }, function (error, response, body) {

            if (error) {
                console.error('Error while /setWebhook', error);
                if (errCallback){
                    errCallback(error);
                }
                return;
            }

            if (response.statusCode != 200) {
                console.error('Error status code while /setWebhook', body);
                if (errCallback) {
                    errCallback('Error status code while setWebhook ' + body);
                }
                return;
            }

            console.log('Method /setWebhook completed', body);
            if (responseCallback) {
                responseCallback('Method /setWebhook completed ' + body)
            }
        });
    }

processMessage(req, res) {
        if (this._botConfig.devConfig) {
            console.log("body", req.body);
        }

        let updateObject = req.body;

        if (updateObject && updateObject.result.action) {
            var chatId = req.body.originalRequest.data.message.chat.id;
            let messageText = '';

            if(updateObject.result.action === "calcularConsumo"){
                messageText = this.calculateEfficiency(updateObject);
                console.log(messageText);
                self.sendProcessedMessage(self, req, res, chatId, messageText);
            }else if(updateObject.result.action === "getLastCharges"){
                actions.getLastCharges(function(charges) {
                    console.log('The promise was fulfilled with charges!');
                    messageText = charges[0].car + ": " + charges[0].efficency + " km/l. " + charges[0].liters + " litros en " + charges[0].days + " dias. " + charges[1].car + ": " + charges[1].efficency + " km/l. " + charges[1].liters + " litros en " + charges[1].days + " dias ";
                    console.log(messageText);
                    self.sendProcessedMessage(self, req, res, chatId, messageText);
                }, function(err) {
                    console.error('The promise was rejected', err, err.stack);
                });
            }else if(updateObject.result.action === "getPrice"){
                var book = updateObject.result.parameters.book;
                bitso.getTradeInfo(book, function(price) {
                    console.log('The promise was fulfilled with price!');
                    messageText = '*' + price.book + '* \n last: ' + price.last + '\n vwap: ' + price.vwap;
                    self.sendProcessedMessage(self, req, res, chatId, messageText);
                }, function(err) {
                    console.error('The promise was rejected', err, err.stack);
                });
            }
        } else {
            console.log('Empty message (updateObject && updateObject.message)');
            return TelegramBot.createResponse(res, 200, 'Empty message');
        }
    }

    sendProcessedMessage(self, req, res, chatId, messageText){
        if (chatId && messageText) {
            if (!self._sessionIds.has(chatId)) {
                self._sessionIds.set(chatId, uuid.v1());
            }

            let apiaiRequest = self._apiaiService.textRequest(messageText, {
                    sessionId: self._sessionIds.get(chatId)
                });

            apiaiRequest.on('response', (response) => {
                if (TelegramBot.isDefined(response.result)) {
                    let responseText = messageText;//response.result.fulfillment.speech;
                    let responseData = response.result.fulfillment.data;

                    if (TelegramBot.isDefined(responseData) && TelegramBot.isDefined(responseData.telegram)) {
                        console.log('Response as formatted message');

                        let telegramMessage = responseData.telegram;
                        telegramMessage.chat_id = chatId;

                        self.reply(telegramMessage);
                        TelegramBot.createResponse(res, 200, 'Message processed');

                    } else if (TelegramBot.isDefined(responseText)) {
                        console.log('Response as text message');
                        self.reply({
                            chat_id: chatId,
                            text: responseText
                        });
                        TelegramBot.createResponse(res, 200, 'Message processed');

                    } else {
                        console.log('Received empty speech');
                        TelegramBot.createResponse(res, 200, 'Received empty speech');
                    }
                } else {
                    console.log('Received empty result');
                    TelegramBot.createResponse(res, 200, 'Received empty result');
                }
            });

            apiaiRequest.on('error', (error) => {
                console.error('Error while call to api.ai', error);
                TelegramBot.createResponse(res, 200, 'Error while call to api.ai');
            });
            apiaiRequest.end();
        }
        else {
            console.log('Empty message  (chatId && messageText)');
            return TelegramBot.createResponse(res, 200, 'Empty message');
        }
    }

    //calculate fuel efficiency
    calculateEfficiency(updateObject){
        var km = updateObject.result.parameters.kilometros;
        var lts = updateObject.result.parameters.litros;
        var car = updateObject.result.parameters.coche;

        var efficiency = (km/lts).toFixed(2);

        //search and insert charges only for my cars
        if(car === 'polo' || car === 'versa'){

            var charge = {
                    date: new Date(),
                    kms: km,
                    liters: lts,
                    efficency: efficiency,
                    car: car,
                    days: 0
            };

            actions.addFuelCharge(charge, function(result){
                console.log(result);
            });
        }

        return 'En ' + km + ' kms tuviste un rendimiento de ' + efficiency;
    }


    reply(msg) {
        // https://core.telegram.org/bots/api#sendmessage
        request.post(this._telegramApiUrl + '/sendMessage', {
            json: msg
        }, function (error, response, body) {
            if (error) {
                console.error('Error while /sendMessage', error);
                return;
            }

            if (response.statusCode != 200) {
                console.error('Error status code while /sendMessage', body);
                return;
            }

            console.log('Method /sendMessage succeeded');
        });
    }

    static createResponse(resp, code, message) {
        return resp.status(code).json({
            status: {
                code: code,
                message: message
            }
        });
    }

    static isDefined(obj) {
        if (typeof obj == 'undefined') {
            return false;
        }

        if (!obj) {
            return false;
        }

        return obj != null;
    }
};
