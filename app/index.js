var bitso = require("./bitso");

var book = 'ethereum';
bitso.getTradeInfo(book, function(price){
            console.log('price.last ' + price.last);
            console.log('price.vwap ' + price.vwap);
        });