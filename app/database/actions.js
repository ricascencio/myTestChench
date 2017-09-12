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

exports.getLastCharges = function(self, callback) {
   connect();
  // FuelCharge.find().sort({date:-1}).limit(2).then(function(err, charges){
  //   if(err) console.log(err);
  //   //console.log("****CHARGES ACTIONS", charges);
  //   return charges;
  // });
  FuelCharge.find({}, function(err, charges){
    if(err) console.log(err);
    callback(charges);
  }).sort({date:-1}).limit(2);
}



// result[0] = charges[0].car + ": Consumo de " + charges[0].efficency + " km/l. " + charges[0].liters + " litros en " + charges[0].days + " dias ";
      // result[1] = charges[1].car + ": Consumo de " + charges[1].efficency + " km/l. " + charges[1].liters + " litros en " + charges[1].days + " dias ";

// exports.getLastCharges = function(res) {
//   connect();
//   FuelCharge.find(function (err, charges){
//     if (err) return console.error("ERR",err);
//       const result = [];
//       result[0] = charges[0].car + ": Consumo de " + charges[0].efficency + " km/l. " + charges[0].liters + " litros en " + charges[0].days + " dias ";
//       result[1] = charges[1].car + ": Consumo de " + charges[1].efficency + " km/l. " + charges[1].liters + " litros en " + charges[1].days + " dias ";
//       res(result);
//   }).sort({date:-1}).limit(2);
// };
  // FuelCharge.aggregate([
    // {
    //   "$match": {"car":"polo"}
    // },
    // {
    //     "$unwind": "$fuelcharges"
    // },
  //   {
  //       "$group": {
  //           "_id": "$_id"
  //           //"kms": { "$sum": "$kms" }
  //       }
  //   },
  //   {
  //     "$project": {
  //       "car": "$car",
  //       "days": "$days"
  //     }
  //   }
  // ], function(err, results){
  //   if(err) console.log(err);
  //     console.log(results);
  // });

  //return FuelCharge.aggregate(aggregateOpts).exec();
  
  // FuelCharge.aggregate([
  //   {"group": {
  //     "_id": "$car"
  //   }},
  //   {"$project":{
  //     "_id":0,
  //     "car":"$_id"
  //   }}
  //   ],function(err,results){
  //     if(err) console.log(err);
  //     console.log("/*/*/*/getLastCharges*/*//*", results);
  //   }).exec();
      
  
  
  // FuelCharge.aggregate([
  //     {"$sort": {date: -1}},
  //     {"$project": {"car":1, "date":1}}
  //   ], function(err, results){
  //     if(err) throw err;
  //     return results;
  //   });
