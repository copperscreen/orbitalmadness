let log = require('./Log');
let express = require('express');
let mime = require('mime-types');
let config = require('../client/config');
let Conn = require('./Conn');
let THREE = require('three');
let planets = require('../client/planets.js');
let World = require('./World');
let Client = require('./Client');

const path = require('node:path'); 
let app = express();

app.get('/', function(req, res){
console.log('fetch ');
	const file = path.join(__dirname, '..', 'index.html');
	res.sendFile(file);
	log.writeS('http', 'root', req.path + ': ' + file);
});
app.get('*js', function(req, res){
	const file = path.join(__dirname, '..', 'client', req.path)
	res.sendFile(file, {'headers': 'text/javascript'});
	log.writeS('http', 'js', req.path + ': ' + file);
});
app.get('*', function(req, res){
	const file = path.join(__dirname, '..', 'asset' , req.path);
	res.sendFile(file, {'headers': mime.lookup(req.path) || 'application/octet-stream'});
	log.writeS('http', 'asset', req.path + ': ' + file);
});

const srv = new Conn();
srv.error = err => {console.log(err);}

const world = new World(planets);
const clients = new Map();
const secrets = new Map();
srv.message = msg => {
	let client = clients.get(msg.id);
	if (undefined === client) {
		clients.set(msg.id, client = new Client(msg.id));
	}
	client.addEvent(msg);
}
srv.reliableMessage = (msg, ws, id) => {
	let oldId;
	if (world.Ships.size === 0){
		world.addShip(1, 'dummy');
	}
	if (msg.secret && (oldId = secrets.get(msg.secret))){ //when client reconnects we reinit their state but retain their score
		world.readdShip(id, msg.name);
		ws.send(`{"status":"ok"}`);
	}else if (msg.name && world.addShip(id, msg.name)){
		let secret = Math.random();
		while (secrets.has(secret)) secret = Math.random();
		secrets.set(secret, id);
		ws.send(`{"status":"ok", "secret": ${secret}}`);
	}else ws.send(JSON.stringify({'names': Array.from(names.keys())}));
}
srv.remove = id => { 
	world.removeShip(id); 
	clients.delete(id); 
};	
console.log('listening on the port ' + config.httpPort);

let count = 0;
setInterval( () =>{
	let c = srv.count();
	const state = world.processTick(clients);
	srv.sendAll(state);
}, config.frameLen);

app.listen(config.httpPort);