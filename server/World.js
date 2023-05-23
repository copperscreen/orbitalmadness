let Gravity = require('../client/gravity');
let Ship = require('./Ship');
let THREE = require('three');
let {Fields} = require('../client/const');
const log = require('./Log');
const Client = require('./Client');

class World{
	Ships = new Map();
	Shots = new Map();
        LastTime = Date.now();
	static unitz = new THREE.Vector3(0, 0, 1);
       	constructor(planets){
	}
	addShip(id, name){
		if (Array.from(this.Ships.values()).filter( _ => _.name == name).length) return false;
		let ship = new Ship(id, name);
		this.generateSafePosition(ship, Array.from(this.Ships.values()), this.planets?.safeR || 0); 
		this.Ships.set(id, ship);
		return true;
	}
	readdShip(id, name){
		let ship = new Ship(id, name);
		this.generateSafePosition(ship, Array.from(this.Ships.values()), this.planets?.safeR || 0); 
		this.Ships.set(id, ship);
	}
	removeShip(id){
		this.Ships.delete(id);
	}
	generateSafePosition(obj, ships, safeR){
		let rotation = new THREE.Quaternion();
		rotation.setFromEuler(new THREE.Euler( 0, 1*ships.length, 0, 'XYZ'));
		obj.oldPos = obj.Pos = World.unitz.clone().applyQuaternion(rotation).multiplyScalar(safeR);        
		return;
		for(let i =0; i < Math.PI; i+=0.01){        
			let next = false;
			let rotation = new THREE.Euler( 0, i*ships.length, 0, 'XYZ');
			obj.Pos = rotation.applyTo(World.unitz).scalarMultiply(safeR);        
			for (ship of ships){
				if (ship!=obj && obj.position.distance(ship.position) < 20) {
					next = true;
					break;
				}
				if (next) continue;
//System.out.println("Positioned at " + Util.Str(obj.position));

				obj.oldPosition = obj.position;
				if (this.star?.mass > 0){
					obj.speed = THREE.Vector3.crossVectors(obj.position, new Vector3D(0,1,0)).normalize();
	                		obj.speed.scalarMultiply(1.1 * Math.sqrt(star.mass/obj.position.getNorm()));
		            	}
        		    	break;
        		}
		}
	}

/*	mend(now, events){
		let perShipMap = new Map();
		for(let msg of events){
			const ship = this.Ships.get[msg.id];
			if (!ship) continue;
			let shipEvents = perShipMap.get(msg.id);
			if (submap === undefined) perShipMap.set(msg.id, shipEvents = []);
			if (msg['d'] !== undefined){
				
			}else if (msg['u'] !== undefined){
			}
		}
	}*/
	processTick(clients){
		let now = Date.now();
		for(var tuple of clients.entries()){
			const [id, client] = tuple;
			const ship = this.Ships.get(id);
			ship.storeState();
			const actions = client.getEvents(now, this.LastTime);
			for(let action of actions){
				ship.apply(action);
			}
			ship.advance(now - this.LastTime);
		}
		let perShipMap = new Map();
//		for(let msg of messages.entries()){
/*			const ship = this.Ships.get[msg.id];
			if (!ship) continue;
			let submap = perShipMap.get(msg.id);
			if (submap === undefined) perShipMap.set(msg.id, submap = new Map());
			if (msg[Fields.KeyDown] !== undefined){
				
			}else if (msg[Fields.KeyUp] !== undefined){
			}*/
//		}
		this.LastTime = now;
		const result = {[Fields.Ships]: Array.from(this.Ships.values()).map( _ => _.serialize())};
		if (!this.Shots.size) result[Fields.Time] = Date.now();
		return result;
	}
}
module.exports = World;