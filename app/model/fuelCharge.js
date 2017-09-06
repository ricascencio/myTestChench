const mongoose = require('mongoose');

const fuelChargeSchema = mongoose.Schema({
  date: Date,
  kms: Number,
  liters: Number,
  efficency: Number,
  car: String,
  days: Number
});

const FuelCharge = mongoose.model('FuelCharge', fuelChargeSchema); 

module.exports = FuelCharge;

