const mongoose = require('mongoose');
 mongoose.Promise = global.Promise;
const config = require('config');
const FuelCharge = require('../model/fuelCharge.js');

let db = null;

const connect = () => {
  if (!db) {
    const dbURL = process.env.DB_URL || config.get('DB_URL');
    mongoose.connect(dbURL, {useMongoClient:true});
    db = mongoose.connection;
    console.log('dbURL', dbURL);
    console.log('DB', db);
  }
};

exports.addFuelCharge = function(charge)  {
  connect();
  FuelCharge.find({"car": charge.car}, function (err, fuelCharge){
      if (err) return console.error("ERR",err);
      var diffDays = 0;
      if(fuelCharge[0]){
        var timeDiff = Math.abs(charge.date.getTime() - fuelCharge[0].date.getTime());
        diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }
      const newRow = new FuelCharge({
          date: charge.date,
          kms: charge.kms,
          liters: charge.liters,
          efficency: charge.efficency,
          car: charge.car,
          days: diffDays
      });
      newRow.save();
  }).sort({date:-1}).limit(1);
};

exports.getLastCharges = function(callback) {
   connect();
  FuelCharge.find({}, function(err, charges){
    if(err) console.log(err);
    callback(charges);
  }).sort({date:-1}).limit(2);
};
