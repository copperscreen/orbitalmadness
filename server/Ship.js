let THREE = require('three');
let {Actions} = require('../client/const');
const log = require('./Log');
const MaxPower=3000;
const ShotPower=1000;

const UpLeft = [Actions.TurnUp, Actions.TurnLeft].sort().join('');
const UpRight = [Actions.TurnUp, Actions.TurnRight].sort().join('');
const DownLeft = [Actions.TurnDown, Actions.TurnLeft].sort().join('');
const DownRight = [Actions.TurnDown, Actions.TurnLeft].sort().join('');

const UpAxis = new THREE.Vector3(0, 1, 0);
const RightAxis = new THREE.Vector3(1, 0, 0);
const ForwardAxis = new THREE.Vector3(0, 0, 1);
const UpRightAxis = (new THREE.Vector3(1, 1, 0)).normalize();
const UpLeftAxis = (new THREE.Vector3(-1, 1, 0)).normalize();

const unit = new THREE.Vector3(0, 0, 1);

function sort(string){
	return string.split('').sort().join('');
}
function extract(key, string){
	const result = string.replace(key, '');
	return [result.length < string.length, result];
}
class Ship{
	points = 0;
        constructor(id, name){
		this.Pos = new THREE.Vector3();
		this.Speed = new THREE.Vector3();
		this.Rotation = new THREE.Quaternion();
		this.name = name;
		this.id = id;
	}
	serialize(){
		return [this.id, 
			this.Pos.x, this.Pos.y, this.Pos.z, 
			/*this.Speed.x, this.Speed.y, this.Speed.z,*/ 
			this.Rotation._x, this.Rotation._y, this.Rotation._z, this.Rotation._w
		];
	}
	score(){
		return [this.name, this.points];
	}
	rotate(axis, angle){
		this.Rotation.multiply( (new THREE.Quaternion()).setFromAxisAngle(axis, angle) )
		log.write('ship','rotate', this.id, [axis.x, axis.y, axis.z, angle]);
	}
	accel(amount){
       		this.Speed.add(unit.clone().applyQuaternion(this.Rotation).multiplyScalar(amount));        
	}
	advance(time){
		this.Pos.add(this.Speed.clone().multiplyScalar(time));
	}
	apply(action){
		let keys = sort(action.key);
		const duration = action.end - action.start;
		const amount = duration * 0.001;
		let [isAccel, keys1] = extract(Actions.Accelerate, keys);
		let [isDeccel, keys2] = extract(Actions.Accelerate, keys1);
		if (isAccel && isDeccel) isAccel = isDeccel = false;
		let [isFire, keys3] = extract(Actions.Fire, keys2);
		if (isAccel) this.accel(duration); else if (isDeccel) this.accel(-duration);

		switch (keys3){
			//programs
			case Actions.Stabilize:
			case Actions.Prograde:
			case Actions.Retrograde:
			case Actions.Center:
				break;
			case Actions.TurnUp:	this.rotate(RightAxis, amount);		break;
			case Actions.TurnDown:	this.rotate(RightAxis, -amount);	break;
			case Actions.TurnLeft:	this.rotate(UpAxis, amount);		break;
			case Actions.TurnRight:	this.rotate(UpAxis, -amount);		break;
			case Actions.Clockwise:	this.rotate(ForwardAxis, amount);	break;
			case Actions.CClockwise:this.rotate(ForwardAxis, amount);	break;
			case UpLeft:		this.rotate(UpRightAxis, -amount);	break;
			case UpRight:		this.rotate(UpLeftAxis, -amount);	break;
			case DownLeft:		this.rotate(UpLeftAxis, amount);	break;
			case DownRight:		this.rotate(UpRightAxis, amount);	break;
		}
	}
	storeState(){
		this.prevPos = this.Pos.clone();
		this.prevSpeed = this.Speed.clone();
		this.prevRotation = this.Rotation.clone();
	}
}

module.exports = Ship;