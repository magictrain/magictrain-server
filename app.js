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

	console.log(req.body)

	beacons = req.body.beacons
	// sort beacons based on proximity
	beacons.sort(function(a,b) {return a.proximity_m > b.proximity_m})


	// find the carriage
	var carriage = null
	for(var i=0; i<beacons.length && carriage == null; i++) {

		train.carriages.forEach(function(currentCarriage) {
			if(currentCarriage.beacons != null) {
				currentCarriage.beacons.forEach(function(installedBeacon) {
					console.log("installed")
					console.log(installedBeacon)

					console.log("sent")
					console.log(beacons[i])

					if(installedBeacon.uuid == beacons[i].uuid) {
						console.log('matched beacon:')
						console.log(installedBeacon)
						carriage = currentCarriage
						offset = installedBeacon.offset
					}
				})
			}
		})
	}



	// no longer in reception, delete entry and return
	if(carriage == null || beacons.length == 0) {
		positionsDB.find({"selector": {"_id":fb_id.toString()}}, function(err, result) {
			var doc = result.docs[0]
			if(doc != null) {
				positionsDB.destroy(fb_id.toString(), doc._rev, function(err, body, header){})
			}
			res.send({train: null})

		})
		return
		
	}
	

	if(fb_id != null && carriage != null && offset != null && fb_name != null) {
		// upsert into db
		tools.upsert(positionsDB, fb_id.toString(), function() {
			return {
				_id: fb_id.toString(),
				fb_name: fb_name,
				location: {
					carriage_id: carriage.id,
					offset: offset,
					deck: 1
				}
			}

		}, function(err, result){})
	}
	else {
		console.log("FAIL. DID not insert into DB")
	}

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