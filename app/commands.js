const actions = require('./database/actions.js');

exports.lastCharges = function(res)  {
   actions.getLastCharges(function(result){
       console.log("COMMANDS ", result);
       res(result);
    });
}