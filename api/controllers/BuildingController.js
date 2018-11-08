'use strict';


var mongoose = require('mongoose'),
  Building = mongoose.model('BuildingSchema');

exports.get_all_buildings = function(req, res) {
  Building.find({}, function(err, building) {
    if (err)
      res.send(err);
    res.json(building);
  });
};

exports.create_a_building = function(req, res) {
  var new_building_data = req.body;
  Building.find({}, function(err, buildings) {
    var buildingExists = false;
    for (var i = 0; i < buildings.length; i++) {
      if ((buildings[i]['name'].toLowerCase() === new_building_data['name'].toLowerCase()) || (buildings[i]['latitude'] === new_building_data['latitude'] && buildings[i]['longitude'] === new_building_data['longitude']))  {
        buildingExists = true;
        break;
      }
    }

    if (buildingExists === true) {
      res.status(400).send('BuildingExists');
    }
    else {
      var new_building = new Building(req.body);
      new_building.save(function(err, building) {
        if (err)
          res.send(err);
        else {
          Building.find({}, function(err, buildings) {
            if (err)
              res.send(err);
            else
              res.json(buildings);
          });
        }
      });
    }
  });
};

exports.delete_all_buildings = function(req, res) {
  Building.remove({}, function(err, building) {
    if (err)
      res.send(err);
    res.json(building);
  });
}

exports.delete_all_buildings = function(req, res) {
  Building.remove({}, function(err, building) {
    if (err)
      res.send(err);
    res.json(building);
  });
}

exports.get_building = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    if (building === null)
      res.status(404).send("BuildingNotFound");
    else
      res.json(building['floors']);
  });
}

exports.get_floors = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    if (building === null)
      res.status(404).send("BuildingNotFound")
    else
      res.json(building['floors']);
  });
}

exports.add_cluster = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else
      var new_cluster = req.body;
      if (!new_cluster['clusterName'] || new_cluster['floorNumber'] === undefined || !new_cluster['status']) {
        res.status(400).send("MissingClusterInfo: Requires clusterName, floorNumber, status");
      }
      else if (!building['floors'][new_cluster['floorNumber']]) {
        res.status(400).send("FloorNumberMissing");
      }
      else if (new_cluster['floorNumber'] < 0 || new_cluster['floorNumber'] >= building['floors'].length ) {
        res.status(400).send("Invalid Floor");
      }
      else if (building['floors'][new_cluster['floorNumber']]['clusterName']) {
        res.status(400).send("ClusterExistsOnFloor");
      }
      else {
        building['floors'][new_cluster['floorNumber']]['clusterName'] = new_cluster['clusterName'];
        building['floors'][new_cluster['floorNumber']]['status'] = new_cluster['status']
        Building.updateOne({"name": req.params.buildingName}, building, function (err, building) {
          res.json(building);
        });
      }
  });
}

exports.get_floor = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else
      if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("Invalid Floor");
      }
      else {
        res.json(building['floors'][req.params.floorNumber]);
      }
  });
}

exports.delete_cluster = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else {
      if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("Invalid Floor");
      }
      else {
        if (building['floors'][req.params.floorNumber]['clusterName']) {
          building['floors'][req.params.floorNumber]['clusterName'] = undefined;
          building['floors'][req.params.floorNumber]['status'] = undefined;
          if (building['floors'][req.params.floorNumber]['floors']) {
            for (var i = 0; i < building['floors']['rooms'].length; i++) {
              if (building['floors'][req.params.floorNumber]['rooms'][i]['nodeName']) {
                building['floors'][req.params.floorNumber]['rooms'][i]['nodeName'] = undefined;
              }
              if (building['floors'][req.params.floorNumber]['rooms'][i]['status']) {
                building['floors'][req.params.floorNumber]['rooms'][i]['status'] = undefined;
              } 
              if (building['floors'][req.params.floorNumber]['rooms'][i]['sensors']) {
                building['floors'][req.params.floorNumber]['rooms'][i]['sensors'] = undefined;
              }
            }
          }
          Building.updateOne({"name": req.params.buildingName}, building, function (err, building) {
            res.json(building);
          });
        }
        else {
          res.status(404).send('NoClusterOnFloor');
        }
      }
    }
  });
}

exports.update_cluster = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else
      var update_cluster = req.body;
      if (!update_cluster['clusterName'] || !update_cluster['status']) {
        res.status(400).send("MissingClusterInfo");
      }
      else if (building['floors'][req.params.floorNumber] === undefined) {
        res.status(400).send("FloorNumberMissing");
      }
      else if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("InvalidFloor");
      }
      else if (!building['floors'][req.params.floorNumber]['clusterName']) {
        res.status(400).send("ClusterMissingOnFloor");
      }
      else {
        building['floors'][req.params.floorNumber]['clusterName'] = update_cluster['clusterName'];
        building['floors'][req.params.floorNumber]['status'] = update_cluster['status']
        Building.updateOne({"name": req.params.buildingName}, building, function (err, building) {
          res.json(building);
        });
      }
  });
}

exports.get_rooms = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else {
      if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("Invalid Floor");
      }
      else {
        res.json(building['floors'][req.params.floorNumber]['rooms'])
      }
    }
  });
}

exports.add_node = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else {
      if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("InvalidFloor");
      }
      else {
        var new_node = req.body;
        if (!new_node || !new_node['nodeName'] || new_node['roomNumber'] === undefined || !new_node['status']) {
          res.status(400).send("NoInfoSpecified: Requires nodeName, roomNumber, and status");
        }
        else if (new_node['roomNumber'] < 0 || new_node['roomNumber'] >= building['floors'][req.params.floorNumber]['rooms'].length ) {
          res.status(400).send("InvalidRoom");
        }
        else if (building['floors'][req.params.floorNumber]['rooms'][new_node['roomNumber']]['nodeName']) {
          res.status(400).send("NodeInRoom");
        }
        else {
          building['floors'][req.params.floorNumber]['rooms'][new_node['roomNumber']]['nodeName'] = new_node['nodeName'];
          building['floors'][req.params.floorNumber]['rooms'][new_node['roomNumber']]['status'] = new_node['status'];
          building['floors'][req.params.floorNumber]['rooms'][new_node['roomNumber']]['sensors'] = [];
          Building.updateOne({"name": req.params.buildingName}, building, function (err, building) {
            res.json(building);
          });
        }
      }
    }
  });
}

exports.get_room = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else {
      if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("Invalid Floor");
      }
      else {
        if (req.params.roomNumber < 0 || req.params.roomNumber >= building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]) {
          res.status(400).send("Invalid Room");
        }
        else {
          res.json(building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]);
        }
      }
    }
  });
}

exports.delete_node = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else {
      if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("InvalidFloor");
      }
      else {
        if (req.params.roomNumber < 0 || req.params.roomNumber >= building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]) {
          res.status(400).send("InvalidRoom");
        }
        else {
          if (!building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['nodeName']) {
            res.status(404).send("NodeDoesNotExist");
          }
          else {
            building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['nodeName'] = undefined;
            building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['status'] = undefined;
            building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['sensors'] = undefined;
            Building.updateOne({"name": req.params.buildingName}, building, function (err, building) {
              res.json(building);
            });
          }
        }
      }
    }
  });
}

exports.update_node = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else {
      if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("InvalidFloor");
      }
      else {
        if (req.params.roomNumber < 0 || req.params.roomNumber >= building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]) {
          res.status(400).send("InvalidRoom");
        }
        else {
          if (!building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['nodeName']) {
            res.status(404).send("NodeDoesNotExist");
          }
          else {
            var update_node = req.body;
            if (!update_node['nodeName'] || !update_node['status']) {
              res.status(400).send("MissingNodeInfo");
            }
            else {
              building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['nodeName'] = update_node['nodeName']
              building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['status'] = update_node['status'];
              Building.updateOne({"name": req.params.buildingName}, building, function (err, building) {
                res.json(building);
              });
            }
          }
        }
      }
    }
  });
}

exports.get_sensors = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else {
      if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("InvalidFloor");
      }
      else {
        if (req.params.roomNumber < 0 || req.params.roomNumber >= building['floors'][req.params.floorNumber]['rooms'].length ) {
          res.status(400).send("InvalidRoom");
        }
        else {
          res.json(building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['sensors']);
        }
      }
    }
  });
}

exports.add_sensor = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else {
      if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("InvalidFloor");
      }
      else {
        var new_sensor = req.body;
        if (req.params.roomNumber < 0 || req.params.roomNumber >= building['floors'][req.params.floorNumber]['rooms'].length ) {
          res.status(400).send("InvalidRoom");
        }
        else if (!new_sensor['sensorName'] || !new_sensor['sensorType'] || !new_sensor['status']) {
          res.status(400).send("InformationNeeded: sensorName, sensorType, sensorStatus");
        }
        else {
          var sensor_exists = false;
          for (var i = 0; i < building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['sensors'].length; i++){
            if (building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['sensors'][i]['sensorName'] === new_sensor.sensorName) {
              sensor_exists = true;
              break;
            }
          }
          if (sensor_exists) {
            res.status(400).send("SensorExists");
          }
          else {
            building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['sensors'].push({
              sensorName: new_sensor.sensorName,
              status: new_sensor['status'],
              sensorType: new_sensor.sensorType
            });
            Building.updateOne({"name": req.params.buildingName}, building, function (err, building) {
              res.json(building);
            });
          }
        }
      }
    }
  });
}

exports.get_sensor = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else {
      if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("InvalidFloor");
      }
      else {
        if (req.params.roomNumber < 0 || req.params.roomNumber >= building['floors'][req.params.floorNumber]['rooms'].length ) {
          res.status(400).send("InvalidRoom");
        }
        else {
          if (!building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['sensors'][req.params.sensorNumber]){
            res.status(404).send("SensorNotFound");
          }
          else {
            res.json(building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['sensors'][sensor_position]);
          }
        }
      }
    }
  });
}

exports.delete_sensor = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else {
      if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("InvalidFloor");
      }
      else {
        if (req.params.roomNumber < 0 || req.params.roomNumber >= building['floors'][req.params.floorNumber]['rooms'].length ) {
          res.status(400).send("InvalidRoom");
        }
        else {
          if (!building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['sensors'][req.params.sensorNumber]){
            res.status(404).send("SensorNotFound");
          }
          else {
            building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['sensors'].splice(req.params.sensorNumber, 1);
            Building.updateOne({"name": req.params.buildingName}, building, function (err, building) {
              res.json(building);
            });
          }
        }
      }
    }
  });
}

exports.update_sensor = function(req, res) {
  Building.findOne({"name": req.params.buildingName}, function(err, building) {
    var update_sensor = req.body;
    if (err)
      res.send(err);
    else if (building === null)
      res.status(404).send("BuildingNotFound");
    else if (!update_sensor.sensorName || !update_sensor.status || !update_sensor.sensorType) {
      res.status(400).send("MissingInfo");
    }
    else {
      if (req.params.floorNumber < 0 || req.params.floorNumber >= building['floors'].length ) {
        res.status(400).send("InvalidFloor");
      }
      else {
        if (req.params.roomNumber < 0 || req.params.roomNumber >= building['floors'][req.params.floorNumber]['rooms'].length ) {
          res.status(400).send("InvalidRoom");
        }
        else {
          var sensor_exists = false;
          for (var i = 0; i < building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['sensors'].length; i++){
            if (i !== parseInt(req.params.sensorNumber) && building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['sensors'][i]['sensorName'] === update_sensor.sensorName) {
              sensor_exists = true;
            }
          }
          if (sensor_exists === true){
            res.status(400).send("SensorNameTaken");
          }
          else {
            building['floors'][req.params.floorNumber]['rooms'][req.params.roomNumber]['sensors'][req.params.sensorNumber] = {
              sensorName: update_sensor.sensorName,
              sensorType: update_sensor.sensorType,
              status: update_sensor.status
            };
            Building.updateOne({"name": req.params.buildingName}, building, function (err, building) {
              res.json(building);
            });
          }
        }
      }
    }
  });
}

exports.authenticate = function(req, res) {
  var authentication_request = req.body;
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb+srv://admin:admin@cluster0-ileym.mongodb.net";

  MongoClient.connect(url, function(err, db) {
    if (err) {
      res.status(500).send("ConnectionError");
      throw err;
    }
    var dbo = db.db("users");
    dbo.collection("users").findOne({"user": authentication_request.user}, function(err, result) {
      if (err) throw err;
      if (!result || result["password"] !== authentication_request.password) {
        res.status(401).send("NotAuthorized");
      }
      else {
        res.status(200).send("Authenticated");
      }
      db.close();
    });
  });
}