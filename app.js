/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var Cloudant = require('cloudant')
var bodyParser = require('body-parser');
var cloudant = Cloudant('https://84263529-892c-4d7b-814c-cfcd113aa1f8-bluemix:860afff06af3febc99c4ea45b5f34abcbff2f87835a77aeb63dcc32fa5c6c871@84263529-892c-4d7b-814c-cfcd113aa1f8-bluemix.cloudant.com');

var train = require('./train.json')
var tools = require('./tools.js')

var positionsDB = cloudant.db.use('positions')


// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();
app.use(bodyParser.json());

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});


app.post('/dummy', function(req, res) {
	var response = {}
	response.train = train
	response.my_location = {
		"carriage_id": "2694092",
		"offset": 5.2,
		"deck": 1
	}
	response.friends = [
		{
			"fb_name": "Ueli Maurer",
			"fb_id": "hot_ueli_61",
			"location": {
				"carriage_id": "8694010",
				"offset": 2,
				"deck": 2
			}
		}
	]

	res.send(response)
})


app.post('/push', function(req, res) {
	var fb_id = req.body['fb_id']
	var fb_name = req.body['fb_name']
	console.log("request from user with id: " + fb_id)

	beacons = req.body.beacons
	// sort beacons based on proximity
	beacons.sort(function(a,b) {return a.proximity_m < b.proximity_m})

	bestBeacon = beacons[0]
	secondBeacon = beacons[1]

	// find the carriage
	var carriage = null
	var bestInstalled = null
	var secondInstalled = null
	train.carriages.forEach(function(currentCarriage) {
		if(currentCarriage.beacons != null) {
			currentCarriage.beacons.forEach(function(beacon) {
				if(bestBeacon.uuid == beacon.uuid) {
					carriage = currentCarriage
					bestInstalled = beacon
				}
				if(secondBeacon.uuid == beacon.uuid) {
					secondInstalled = beacon
				}
			})
		}
	})

	var offset = 0
	if(bestInstalled != null) {
		offset = bestInstalled.offset
	}

	if(bestInstalled != null && secondInstalled != null) {
		offset = (bestInstalled.offset+secondInstalled.offset)/2
	}


	// upsert into db
	tools.upsert(positionsDB, fb_id, function() {
		return {
			_id: fb_id,
			fb_name: fb_name,
			location: {
				carriage_id: carriage.id,
				offset: offset,
				deck: 1
			}
		}

	}, function(err, result){})

	positionsDB.find({"selector": {"_id": {"$gt":0}}}, function(err, result) {
		var friends = result.docs
		res.send({
			train: train,
			my_location: {
				carriage_id: carriage.id,
				offset: offset,
				deck: 1
			},
			friends: friends
		})
	})
})