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


app.post('/push', function(req, res) {
	console.log(req.body)
	res.send(req.body)
})