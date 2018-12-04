var map;
var buildings;
var currentBuildingName = "";
var currentBuilding = null;
var currentFloor = null;
var currentRoom = null;
var currentSensor = null;
var currentFloorPlanFloor = null;
var markers = [];
var baseurl = "http://nodeloadbalancer-1594461647.us-west-2.elb.amazonaws.com:3000";
if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(search, this_len) {
		if (this_len === undefined || this_len > this.length) {
			this_len = this.length;
		}
		return this.substring(this_len - search.length, this_len) === search;
	};
}
function initMap() {
    $('#loginModal').modal('toggle');
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.334665328, lng: -121.875329832},
        zoom: 14
    });
    updateBuildings();
}

function updateBuildings(callback){
    $.get(baseurl + '/buildings', function(res, err){
        addBuildings(res);
        if (currentBuildingName) {
            for (var i = 0; i < buildings.length; i++) {
                if (buildings[i]['name'] === currentBuildingName) {
                    currentBuilding = buildings[i];
                    break;
                }
            }
        }
        if (callback && callback.length) {
            for (var i = 0; i < callback.length; i ++) {
                callback[i]();
            }
        }
    });
}

function addBuildings(buildings_list) {
    setMapOnMarkers(null);
    for (var i = 0; i < buildings_list.length; i++){
        var marker = new google.maps.Marker({
            position: {lat: parseFloat(buildings_list[i]['latitude']), lng: parseFloat(buildings_list[i]['longitude'])},
            map: map,
            title: buildings_list[i]['name']
        });
        addBuildingTitleClick(marker, buildings_list[i]['name']);
        markers.push(marker);
    }
    buildings = buildings_list
}

function addBuildingTitleClick(marker, buildingName) {
    var buildingTitle = buildingName;
    marker.addListener('click', function() {
        for (var i = 0; i < buildings.length; i++) {
            if (buildings[i]['name'] === buildingTitle && buildingTitle !== currentBuildingName) {
                currentBuilding = JSON.parse(JSON.stringify(buildings[i]));
                currentBuildingName = currentBuilding['name'];
                setCurrentBuilding(currentBuildingName);
                setFloorTable();
            }
        }
    });
}

function clearMarkers() {
    setMapOnMarkers(null);
    markers = []
}

function setMapOnMarkers(map) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
}

function processNewBuilding() {
    var buildingName = $("#buildingName").val();
    var longitude = $("#longitude").val();
    var latitude = $("#latitude").val();
    var floorNumberJSON = $("#floorNumber").val();
    if (!buildingName) {
        alert("Building Not Added: Building Name must be specified");
    }
    else if (!longitude) {
        alert("Building Not Added: Longitude must be specified");
    }
    else if (isNaN(longitude) || parseFloat(longitude) < -180 || parseFloat(longitude) > 180) {
        alert("Building Not Added: Longitude must be number in between -180 and 180");
    }
    else if (!latitude) {
        alert("Building Not Added: Latitude must be specified");
    }
    else if (isNaN(latitude) || parseFloat(latitude) < -90 || parseFloat(latitude) > 90) {
        alert("Building Not Added: Latitude must be number in between -90 and 90");
    }
    else if (!floorNumberJSON) {
        alert("Building Not Added: JSON Floor Configuration must be specified");
    }
    else {
        try {
            var floorPlan = JSON.parse(floorNumberJSON);
            var validationFailed = false;
            for (var i = 0; i < floorPlan.length; i++) {
                if (isNaN(floorPlan[i])){
                    validationFailed = true;
                }
            }
            if (validationFailed) {
                alert("Building Not Added: JSON Floor Configuration must be valid (i.e. [3, 4, 1])");
                return;
            }
        } catch (e) {
            alert("Building Not Added: JSON Floor Configuration must be valid (i.e. [3, 4, 1])");
            return;
        }
        var geocoder = new google.maps.Geocoder();
        address = "";
        var latlng = new google.maps.LatLng(latitude, longitude);
        geocoder.geocode({ 'latLng': latlng }, function (results, status) {
            // This is checking to see if the Geoeode Status is OK before proceeding
            if (status == google.maps.GeocoderStatus.OK) {
                address = (results[0].formatted_address);
                console.log(results[0].formatted_address);
            }
            var newBuilding = {
                "name": buildingName,
                "latitude": latitude,
                "longitude": longitude,
                "address": address,
                "floors": []
            }
            var floorPlan = JSON.parse(floorNumberJSON);
            for (var i = 0; i < floorPlan.length; i++) {
                var floorMapPic = "f2.png";
                if (i % 2 == 0) floorMapPic = "f1.png";
                newBuilding.floors.push({
                    rooms: [],
                    floorMap: floorMapPic
                });
                for (var j = 0; j < floorPlan[i]; j++) {
                    newBuilding.floors[newBuilding.floors.length - 1]['rooms'].push({});
                }
            }
            console.log(newBuilding);
            $.ajax({
                type: "POST",
                url: baseurl + "/buildings",
                data: JSON.stringify(newBuilding),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function(data){
                    clearMarkers();
                    addBuildings(data);
                    $("#createBuildingModal .close").click();
                    map.panTo({lat: parseFloat(newBuilding['latitude']), lng: parseFloat(newBuilding['longitude'])});
                },
                failure: function(errMsg) {
                    alert(errMsg);
                },
                error: function(errMsg) {
                    alert("Building Not Added: Building Exists, ensure building name and combination of longitude and latitude are unique");
                }
            });
        });
    }
}

function setCurrentBuilding(buildingName) {
    $("#roomTableContainer").hide();
    $("#sensorTableContainer").hide();
    $("#floorTableContainer").show();
    $("#floorPlanDiv").css("visibility","visible");
    $("#entityDiv").css("visibility","visible");
    $("#generateReportButton").css("visibility","visible");
    $("#floorPlanTitle").text(currentBuildingName + " Floor 1");
    currentFloorPlanFloor = 0;
    createFloorPlanTable();
}

function createFloorPlanTable() {
    $("#floorPlanTitle").text(currentBuildingName + " Floor " + (parseInt(currentFloorPlanFloor) + 1));
    $("#floorPlanTable tr").remove();
    $("#floorPlanTable thead").remove();
    $("#floorPlanTable tbody").remove();
    var tableString = "";
    for (var i = 0; i < currentBuilding['floors'][currentFloorPlanFloor]['rooms'].length; i++) {
        if (i % 4 === 0) {
            tableString += "<tr>"
        }
        if (currentBuilding['floors'][currentFloorPlanFloor]['rooms'][i]['nodeName'] && currentBuilding['floors'][currentFloorPlanFloor]['rooms'][i]['status'] === 'Active') {
            tableString += "<td class='nodeRoomFloorPlan' style='background-color: lightgreen' onclick='handleRoomClick(event)'>Room" + (i + 1) + "</td>";
        }
        else if (currentBuilding['floors'][currentFloorPlanFloor]['rooms'][i]['nodeName'] && currentBuilding['floors'][currentFloorPlanFloor]['rooms'][i]['status'] === 'Inactive') {
            tableString += "<td class='nodeRoomFloorPlan' style='background-color: lightgrey' onclick='handleRoomClick(event)'>Room" + (i + 1) + "</td>";
        }
        else if (currentBuilding['floors'][currentFloorPlanFloor]['rooms'][i]['nodeName'] && (currentBuilding['floors'][currentFloorPlanFloor]['rooms'][i]['status'] === 'Turning On' || currentBuilding['floors'][currentFloorPlanFloor]['rooms'][i]['status'] === 'Turning Off')) {
            tableString += "<td class='nodeRoomFloorPlan' style='background-color: lightblue' onclick='handleRoomClick(event)'>Room" + (i + 1) + "</td>";
        }
        else if (currentBuilding['floors'][currentFloorPlanFloor]['rooms'][i]['nodeName'] && currentBuilding['floors'][currentFloorPlanFloor]['rooms'][i]['status'] === 'Maintenance') {
            tableString += "<td class='nodeRoomFloorPlan' style='background-color: red' onclick='handleRoomClick(event)'>Room" + (i + 1) + "</td>";
        }
        else {
            tableString += "<td>Room" + (i + 1) + "</td>";
        }
        if (i % 4 === 3) {
            tableString += "</tr>"
        }
    }
    if (!tableString.endsWith('</tr')) {
        tableString += "</tr>"
    }
    $("#floorPlanTable").append(tableString);
}

function handleRoomClick(event) {
    currentFloor = currentFloorPlanFloor;
    currentRoom = parseInt(event.currentTarget.innerText.substring(4)) - 1;
    setSensorTable();
}

function setFloor() {
    var floorNumber = $("#selectedFloor").val();
    if (isNaN(floorNumber) || !floorNumber.match(/^-{0,1}\d+$/) || floorNumber < 1 || floorNumber > currentBuilding['floors'].length) {
        alert("Must Enter valid floor in " + currentBuildingName + " between 1 and " + currentBuilding['floors'].length + ". Must also be an integer." );
    }
    else {
        currentFloorPlanFloor = parseInt(floorNumber) - 1;
        createFloorPlanTable();
    }
}

function setFloorTable() {
    $("#floorTable tr").remove();
    var tableString = "<thead><tr><th scope='col'>Floor Number</th>" +
    "<th scope='col'>Cluster Name</th><th scope='col'>Status</th>"+
    "<th scope='col'>Actions</th></tr></thead><tbody>"
    for (var i = 0; i < currentBuilding['floors'].length; i++) {
        tableString += "<tr><td scope='row'>" + (i + 1) + "</td>";
        if (currentBuilding['floors'][i]['clusterName']) {
            tableString += "<td scope='row'>" + currentBuilding['floors'][i]['clusterName'] + 
            "</td><td scope='row'>" + currentBuilding['floors'][i]['status'] + "</td>" +
            "<td scope='row'><button class='btn btn-info' onclick='viewFloors(event)'>View Nodes</button>&nbsp;" +
            "<button class='btn btn-warning' onclick='editCluster(event)'>Edit</button>&nbsp;" + 
            "<button class='btn btn-danger' onclick='deleteCluster(event)'>Delete</button></td></tr>";
        }
        else {
            tableString += "<td></td><td></td><td></td></tr>";
        }
    }
    $("#floorTableTitle").text("Floors for " + currentBuildingName);
    $("#floorTable").append(tableString);
}

function setRoomTable() {
    floorNumber = currentFloor;
    $("#roomTable tr").remove();
    tableString = "<thead><tr><th scope='col'>Room Number</th>" +
    "<th scope='col'>Smart Node Name</th><th scope='col'>Status</th>"+
    "<th scope='col'>Actions</th></tr></thead><tbody>"
    var roomList = currentBuilding['floors'][floorNumber]['rooms'];
    for (var i = 0; i < roomList.length; i++) {
        tableString += "<tr><td scope='row'>" + (i + 1) + "</td>";
        if (roomList[i]['nodeName']) {
            tableString += "<td scope='row'>" + roomList[i]['nodeName'] + 
            "</td><td scope='row'>" + roomList[i]['status'] + "</td>" +
            "<td scope='row'><button class='btn btn-info' onclick='viewSensors(event)'>View Sensors</button>&nbsp;" +
            "<button class='btn btn-warning' onclick='editNode(event)'>Edit</button>&nbsp;" + 
            "<button class='btn btn-danger' onclick='deleteNode(event)'>Delete</button></td></tr>";
        }
        else {
            tableString += "<td></td><td></td><td></td></tr>";
        }
    }
    $("#roomTableTitle").text("Rooms for Floor " + (currentFloor + 1));
    $("#roomTable").append(tableString);
}

function setSensorTable() {
    $("#floorTableContainer").hide();
    $("#sensorTableContainer").show();
    $("#roomTableContainer").hide();
    $("#sensorTable tr").remove();
    tableString = "<thead><tr><th scope='col'>Sensor Name</th>" +
    "<th scope='col'>Sensor Type</th><th scope='col'>Status</th>"+
    "<th scope='col'>Actions</th></tr></thead><tbody>"
    var sensorList = currentBuilding['floors'][currentFloor]['rooms'][currentRoom]['sensors'];
    for (var i = 0; i < sensorList.length; i++) {
        tableString += "<tr><td scope='row'>" + sensorList[i]['sensorName'] + "</td><td scope='row'>" + sensorList[i]['sensorType'] + 
        "</td><td scope='row'>" + sensorList[i]['status'] + "</td><td scope='row'>" +
        "<button class='btn btn-warning' onclick='editSensor(event)'>Edit</button>&nbsp;" + 
        "<button class='btn btn-danger' onclick='deleteSensor(event)'>Delete</button></td></tr>";
    }
    $("#sensorTableTitle").text("Sensors for " + currentBuilding['floors'][currentFloor]['rooms'][currentRoom]['nodeName']);
    $("#sensorTable").append(tableString);
}

function viewFloors(event) {
    $("#floorTableContainer").hide();
    $("#sensorTableContainer").hide();
    $("#roomTableContainer").show();
    var floorNumber = event.currentTarget.parentElement.parentElement.rowIndex - 1;
    currentFloor = floorNumber;
    setRoomTable();
}

function editCluster(event) {
    var clusterNumber = event.currentTarget.parentElement.parentElement.rowIndex  - 1;
    $('#editClusterModal').modal('toggle');
    $('#editClusterTableTitle').text('Edit ' + currentBuilding['floors'][clusterNumber]['clusterName']);
    $('#editClusterName').val(currentBuilding['floors'][clusterNumber]['clusterName']);
    $("#editClusterStatus option[value='" + currentBuilding['floors'][clusterNumber]['status'] + "']").prop('selected', true);
    currentFloor = clusterNumber;
}

function deleteCluster(event) {
    var clusterNumber = event.currentTarget.parentElement.parentElement.rowIndex  - 1;
    $.ajax({
        type: "DELETE",
        url: baseurl + '/buildings/' + currentBuildingName + "/floors/" + clusterNumber,
        success: function(data){
            updateBuildings([setFloorTable]);
        },
        failure: function(errMsg) {
            alert(errMsg);
        },
        error: function(errMsg) {
            alert("Cluster Not Deleted: Does not exist in building");
        }
    });
}

function updateExistingCluster() {
    var clusterName = $('#editClusterName').val();
    var floor = currentFloor;
    var clusterStatus = $('#editClusterStatus').val();
    if (!clusterName) {
        alert("Cluster Not Updated: Cluster Name must be specified");
    }
    else {
        var updatedCluster = {
            "clusterName": clusterName,
            "status": clusterStatus
        }
        $.ajax({
            type: "PUT",
            url: baseurl + "/buildings/" + currentBuildingName + "/floors/" + floor,
            data: JSON.stringify(updatedCluster),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data){
                updateBuildings([setFloorTable]);
                $("#editClusterModal .close").click();
            },
            failure: function(errMsg) {
                alert(errMsg);
            },
            error: function(errMsg) {
                alert("Cluster Not Updated: Server issue");
            }
        });
    }
}

function processNewCluster() {
    var clusterName = $("#clusterName").val();
    var clusterFloorNumber = $("#clusterFloorNumber").val();
    var status = $("#clusterStatus").val();
    if (!clusterName) {
        alert("Cluster Not Added: Cluster Name must be specified");
    }
    else if (!clusterFloorNumber) {
        alert("Cluster Not Added: Cluster Floor must be specified");
    }
    else if (isNaN(clusterFloorNumber) || !clusterFloorNumber.match(/^-{0,1}\d+$/) || parseInt(clusterFloorNumber) < 1 || parseInt(clusterFloorNumber) > currentBuilding['floors'].length) {
        alert("Cluster Not Added: Cluster Floor must be number in between 1 and " + currentBuilding['floors'].length);
    }
    else {
        var newCluster = {
            "clusterName": clusterName,
            "floorNumber": clusterFloorNumber - 1,
            "status": status
        }
        $.ajax({
            type: "POST",
            url: baseurl + "/buildings/" + currentBuildingName + "/floors",
            data: JSON.stringify(newCluster),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data){
                updateBuildings([setFloorTable]);
                $("#createClusterModal .close").click();
            },
            failure: function(errMsg) {
                alert(errMsg);
            },
            error: function(errMsg) {
                alert("Cluster Not Added: Cluster Exists in floor");
            }
        });
    }
}
function processNewNode() {
    var nodeName = $("#nodeName").val();
    var clusterFloorNumber = currentFloor
    var nodeFloorNumber = $("#nodeRoomNumber").val();
    var status = $("#nodeStatus").val();
    if (!nodeName) {
        alert("Node Not Added: Node Name must be specified");
    }
    else if (!nodeFloorNumber) {
        alert("Node Not Added: Node Floor must be specified");
    }
    else if (isNaN(nodeFloorNumber) || !nodeFloorNumber.match(/^-{0,1}\d+$/) || parseInt(nodeFloorNumber) < 1 ||
     parseInt(nodeFloorNumber) > currentBuilding['floors'][clusterFloorNumber]['rooms'].length) {
        alert("Node Not Added: Node Floor must be number in between 1 and " + currentBuilding['floors'][clusterFloorNumber]['rooms'].length);
    }
    else {
        var newNode = {
            "nodeName": nodeName,
            "roomNumber": nodeFloorNumber - 1,
            "status": status
        }
        $.ajax({
            type: "POST",
            url: baseurl + "/buildings/" + currentBuildingName + "/floors/" + clusterFloorNumber + "/rooms",
            data: JSON.stringify(newNode),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data){
                updateBuildings([setRoomTable, createFloorPlanTable]);
                $("#createNodeModal .close").click();
            },
            failure: function(errMsg) {
                alert(errMsg);
            },
            error: function(errMsg) {
                alert("Node Not Added: Node Exists in floor");
            }
        });
    }
}

function editNode() {
    var roomNumber = event.currentTarget.parentElement.parentElement.rowIndex  - 1;
    currentRoom = roomNumber;
    $('#editNodeModal').modal('toggle');
    var floorNumber = currentFloor;
    $('#editNodeTableTitle').text('Edit ' + currentBuilding['floors'][floorNumber]['rooms'][roomNumber]['nodeName']);
    $('#editNodeName').val(currentBuilding['floors'][floorNumber]['rooms'][roomNumber]['nodeName']);
    $("#editClusterStatus option[value='" + currentBuilding['floors'][currentFloor]['rooms'][currentRoom]['status'] + "']").prop('selected', true);
}

function updateExistingNode() {
    var nodeName = $("#editNodeName").val();
    var nodeStatus = $("#editNodeStatus").val();
    if (!nodeName) {
        alert("Node Not Added: Node Name must be specified");
    }
    else {
        var updatedNode = {
            "nodeName": nodeName,
            "status": nodeStatus
        }
        $.ajax({
            type: "PUT",
            url: baseurl + "/buildings/" + currentBuildingName + "/floors/" + currentFloor + "/rooms/" + currentRoom,
            data: JSON.stringify(updatedNode),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data){
                updateBuildings([setRoomTable, createFloorPlanTable]);
                $("#editNodeModal .close").click();
            },
            failure: function(errMsg) {
                alert(errMsg);
            },
            error: function(errMsg) {
                alert("Cluster Not Updated: Server issue");
            }
        });
    }
}

function backToFloors() {
    $("#roomTableContainer").hide();
    setFloorTable();
    $("#floorTableContainer").show();
}

function backToRooms() {
    $("#roomTableContainer").show();
    setRoomTable();
    $("#sensorTableContainer").hide();
}

function deleteNode(event) {
    var nodeNumber = event.currentTarget.parentElement.parentElement.rowIndex  - 1;
    $.ajax({
        type: "DELETE",
        url: baseurl + "/buildings/" + currentBuildingName + "/floors/" + currentFloor + "/rooms/" + nodeNumber,
        success: function(data){
            updateBuildings([setRoomTable, createFloorPlanTable]);
        },
        failure: function(errMsg) {
            alert(errMsg);
        },
        error: function(errMsg) {
            alert("Node Not Deleted: Does not exist in building. Please refresh application");
        }
    });
}

function viewSensors(event) {
    var roomNumber = event.currentTarget.parentElement.parentElement.rowIndex - 1;
    currentRoom = roomNumber;
    setSensorTable();
}

function processNewSensor() {
    var sensorName = $("#sensorName").val();
    var sensorTypeSelect = $("#sensorTypeSelect").val();
    var status = $("#sensorStatus").val();
    if (!nodeName) {
        alert("Node Not Added: Node Name must be specified");
    }
    else {
        var newSensor = {
            "sensorName": sensorName,
            "sensorType": sensorTypeSelect,
            "status": status
        }
        $.ajax({
            type: "POST",
            url: baseurl + "/buildings/" + currentBuildingName + "/floors/" + currentFloor + "/rooms/" + currentRoom + "/sensors",
            data: JSON.stringify(newSensor),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data) {
                updateBuildings([setSensorTable]);
                $("#createSensorModal .close").click();
            },
            failure: function(errMsg) {
                alert(errMsg);
            },
            error: function(errMsg) {
                alert("Sensor Not Added: Sensor Name exists");
            }
        });
    }
}

function editSensor() {
    var sensorNumber = event.currentTarget.parentElement.parentElement.rowIndex  - 1;
    currentSensor = sensorNumber;
    $('#editSensorModal').modal('toggle');
    var floorNumber = currentFloor;
    $('#editSensorTableTitle').text('Edit ' + currentBuilding['floors'][floorNumber]['rooms'][currentRoom]['sensors'][sensorNumber]['sensorName']);
    $('#editSensorName').val(currentBuilding['floors'][floorNumber]['rooms'][currentRoom]['sensors'][sensorNumber]['sensorName']);
    $("#editSensorStatus option[value='" + currentBuilding['floors'][currentFloor]['rooms'][currentRoom]['sensors'][sensorNumber]['sensorStatus'] + "']").prop('selected', true);
}

function updateExistingSensor() {
    var sensorName = $("#editSensorName").val();
    var sensorTypeSelect = $("#editSensorTypeSelect").val();
    var sensorStatus = $("#editSensorStatusSelect").val();
    if (!nodeName) {
        alert("Node Not Added: Node Name must be specified");
    }
    else {
        var updateSensor = {
            "sensorName": sensorName,
            "sensorType": sensorTypeSelect,
            "status": sensorStatus
        }
        $.ajax({
            type: "Put",
            url: baseurl + "/buildings/" + currentBuildingName + "/floors/" + currentFloor + "/rooms/" + currentRoom + "/sensors/" + currentSensor,
            data: JSON.stringify(updateSensor),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data) {
                updateBuildings([setSensorTable]);
                $("#editSensorModal .close").click();
            },
            failure: function(errMsg) {
                alert(errMsg);
            },
            error: function(errMsg) {
                alert("Sensor Not Added: Sensor Name exists");
            }
        });
    }
}

function deleteSensor() {
    var sensorNumber = event.currentTarget.parentElement.parentElement.rowIndex  - 1;
    $.ajax({
        type: "DELETE",
        url: baseurl + "/buildings/" + currentBuildingName + "/floors/" + currentFloor + "/rooms/" + currentRoom + "/sensors/" + sensorNumber,
        success: function(data){
            updateBuildings([setSensorTable]);
        },
        failure: function(errMsg) {
            alert(errMsg);
        },
        error: function(errMsg) {
            alert("Sensor Not Deleted: Does not exist in building");
        }
    });
}

function generateReport() {
    if (currentBuilding) {
        $('#generateReportModal').modal('toggle');
        $("#generateReportTitle").text(currentBuildingName + " report")
        $("#reportDiv").text(JSON.stringify(currentBuilding, null, 2));
    }
}

function login() {
    var userName = $("#userName").val();
    var userPassword = $("#password").val();
    if (!userName || !userPassword) {
        alert("User name and password must be specified");
        return;
    }
    var authInfo = {
        user: userName,
        password: userPassword
    }
    $.ajax({
        type: "POST",
        data: JSON.stringify(authInfo),
        contentType: "application/json; charset=utf-8",
        url: baseurl + "/login",
        success: function(data){
            $('#loginModal').modal('toggle');
        },
        failure: function(errMsg) {
            alert("Incorrect User or Password");
        },
        error: function(errMsg) {
            alert("Incorrect User or Password");
        }
    });
}
