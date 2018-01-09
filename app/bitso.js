const bodyParser = require('body-parser');
const config = require('config');
const map = new Map();    
    map.set('bitcoin', 'btc_mxn');
    map.set('ethereum', 'eth_mxn');
    map.set('ripple', 'xrp_mxn');
    map.set('litecoin', 'ltc_mxn');

exports.getBalance = function (){
    var key = process.env.BITSO_API_KEY || config.get('BITSO_API_KEY');
    var secret = process.env.BITSO_API_SECRET || config.get('BITSO_API_SECRET');
    var nonce = new Date().getTime();
    var http_method="GET";
    var json_payload=""
    var request_path="/v3/balance/"
    var http = require('https');
    
    // Create the signature
    var Data = nonce+http_method+request_path+json_payload;
    var crypto = require('crypto');
    var signature = crypto.createHmac('sha256', secret).update(Data).digest('hex');
    
    // Build the auth header
    var auth_header = "Bitso "+key+":" +nonce+":"+signature;
    
    var options = {
      host: 'api.bitso.com',
      port: 443,
      path: '/v3/balance/',
      method: 'GET',
      headers: {
            'Authorization': auth_header
        }
    };
    try{
        var req = http.request(options, function(res) {
            res.on('data', function (chunk) {
                var result = JSON.parse(chunk);
                console.log(""+chunk);
            });
        });  
    }catch(err){
        console.log(err);
    }
    req.end();
}

exports.getTradeInfo = function(book, callb){
    var http = require('https');
    var options = {
      host: 'api.bitso.com',
      port: 443,
      path: '/v3/ticker/?book=' + map.get(book),
      method: 'GET'
    };
    try{
        var price;
        var callback = function(res){
            res.on('data', function (chunk) {
                //if(err) console.log(err);
                var result = JSON.parse(chunk);
                price = {
                    last: result.payload.last,
                    vwap: result.payload.vwap
                };
            });
            res.on('end', function(){
                callb(price);
            });
        }
        http.request(options, callback).end();
    }catch(err){
        console.log(err);
    }
    
}

