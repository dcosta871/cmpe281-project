'use strict';
module.exports = function(app) {
  var buildingsList = require('../controllers/BuildingController');

  // todoList Routes
  app.route('/buildings')
    .get(buildingsList.get_all_buildings)
    .post(buildingsList.create_a_building)
    .delete(buildingsList.delete_all_buildings);

  app.route('/buildings/:buildingName')
    .get(buildingsList.get_building);
  
  app.route('/buildings/:buildingName/floors')
    .get(buildingsList.get_floors)
    .post(buildingsList.add_cluster);
  
  app.route('/buildings/:buildingName/floors/:floorNumber')
    .get(buildingsList.get_floor)
    .delete(buildingsList.delete_cluster)
    .put(buildingsList.update_cluster);
  
  app.route('/buildings/:buildingName/floors/:floorNumber/rooms')
    .get(buildingsList.get_rooms)
    .post(buildingsList.add_node);
  
  app.route('/buildings/:buildingName/floors/:floorNumber/rooms/:roomNumber')
    .get(buildingsList.get_room)
    .delete(buildingsList.delete_node)
    .put(buildingsList.update_node);
    
  app.route('/buildings/:buildingName/floors/:floorNumber/rooms/:roomNumber/sensors')
    .get(buildingsList.get_sensors)
    .post(buildingsList.add_sensor);

  app.route('/buildings/:buildingName/floors/:floorNumber/rooms/:roomNumber/sensors/:sensorNumber')
    .get(buildingsList.get_sensor)
    .delete(buildingsList.delete_sensor)
    .put(buildingsList.update_sensor);
};