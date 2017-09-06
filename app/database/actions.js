const mongoose = require('mongoose');
 mongoose.Promise = global.Promise;
const config = require('config');
const FuelCharge = require('../model/fuelCharge.js');

let db = null;

const connect = () => {
  if (!db) {
    const dbURL = process.env.db_url || config.get('DB_URL');
    mongoose.connect(dbURL, {useMongoClient:true});
    db = mongoose.connection;
  }
};

exports.insertFuelCharge = function(fuelCharge) {
  connect();
  const newRow = new FuelCharge({
    date: fuelCharge.date,
    kms: fuelCharge.kms,
    liters: fuelCharge.liters,
    efficency: fuelCharge.efficency,
    car: fuelCharge.car,
    days: fuelCharge.days
  });
  return newRow.save();
};

exports.getLastFuelCharge = function(date, car, charges)  {
  connect();
  console.log("** IN getLastFuelCharge");
    FuelCharge.findOne({"car": car}).sort({"date":-1}).limit(1, function (err, fuelCharge){
        if (err) return console.error("ERR",err);
        console.log("charges ", fuelCharge);
         charges(fuelCharge);
    });
};