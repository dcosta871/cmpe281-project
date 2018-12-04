'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var BuildingSchema = new Schema({
  name: String,
  longitude: String,
  latitude: String,
  address: String,
  floors: [{
    clusterName: String,
    status: String,
    floorMap: String,
    rooms: [{
        nodeName: String,
        status: String,
        sensors: [{
            sensorName: String,
            status: String,
            sensorType: String
        }]
    }]
  }]
});

module.exports = mongoose.model('BuildingSchema', BuildingSchema);