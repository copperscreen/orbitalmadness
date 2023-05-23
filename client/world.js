const lerp = (prev, next, time) => (next - prev) * time + prev;
class World{
	//Scene = new THREE.Scene();
	Inbuf = [];
	LastTime = Date.now();
	TimeWithinFrame = 0;
	FrameIndex = -1;
	Mode = 0; //0 - idle, 1 - interpolating, 2 - extrapolating //, 3 - reconciling after extrapolation - won't do it for now
	constructor(){
		this.currentPower = this.maxPower = planets?.maxPower || 3000;
		this.shotPower = planets?.shotPower || 3000;
		this.recup = planets?.shotRecup || 1;	
	}
	setPlanets(planets){
	}
	shoot(){
		const lastShot = this.lastShot || Date.now();
		this.currentPower = Math.min(this.maxPower, this.currentPower + this.recup * (Date.now() - this.lastShot));
		if (this.currentPower > 0){
			this.currentPower = this.currentPower - this.shotPower;
			this.lastShot = Date.now();
			return true;
		}
		return false;
	}
	setPlayerId(id){
		this.Id = id;
	}
	update(msg){
		//const parsed = JSON.parse(msg);
		msg.arrived = Date.now();
		if (msg[Fields.Shots] === undefined) msg[Fields.Shots] = [];
		this.Inbuf.push(msg);
		log('world', 'update', this.Inbuf.length, {msg, Inbuf: this.Inbuf});
	}
	calc(prev, next, time){
		const pos = new THREE.Vector3(lerp(prev[1], next[1], time), lerp(prev[2], next[2], time), lerp(prev[3], next[3], time));
		const rot = new THREE.Quaternion(prev[4], prev[5], prev[6], prev[7]);
		const newRot = new THREE.Quaternion(next[4], next[5], next[6], next[7]);
		rot.slerp(newRot, time);
		return {pos, rot};
	}

	prepare(prev, next, time){
		const modified = new Map();
		const added = new Map();
		const removed = new Set();
		const pMap = new Map();
		const nSet = new Set();
		for(let p of prev) pMap.set(p[0], p);
		for(let n of next){
			const p = pMap.get(n[0]);
			if (undefined == p){
				added.set(n[0], {pos: new THREE.Vector3(n[1],n[2],n[3]), rot: new THREE.Quaternion(n[4],n[5],n[6],n[7])});
			}else{
				modified.set(n[0], this.calc(p, n, time));
			}
			nSet.add(n[0]);
		}
		for(let p in pMap.keys()){
			if (!nSet.has(p)) removed.add(p);
		}
		return {added, modified, removed};
	}
	serialize(obj){
		return [obj.id, 
			obj.pos.x, obj.pos.y, obj.pos.z, 
			/*this.Speed.x, this.Speed.y, this.Speed.z,*/ 
			obj.rot._x, obj.rot._y, obj.rot._z, obj.rot._w
		];
	}
	extrapolated(){
		return {
			[Fields.Ships] : this.Extrapolated[Fields.Ships].map( s => this.serialize(s) ),
			[Fields.Shots] : this.Extrapolated[Fields.Shots].map( s => this.serialize(s) ),
			my : this.serialize(this.Extrapolated.my)
		};
	}
	logGet(type, now, delta, msg){
		const m = msg || {};
		m.mode = this.Mode;
		m.index = this.FrameIndex;
		m.time = this.TimeWithinFrame;
		m.lastTime = this.LastTime;
		m.now = now;
		m.Inbuf = this.Inbuf;
		log('world', 'get', type, this.FrameIndex, `${this.TimeWithinFrame}:${delta}`, this.Inbuf.map(_ => now - _.arrived).join(','), m);
	}
	get(now){
		if (this.Id === undefined) return;
		let delta = now - this.LastTime;
		this.logGet('entry', now, delta);
		this.LastTime = now;

		if (this.FrameIndex > 2){ //remove processed data
			const removed = this.Inbuf.splice(0, this.FrameIndex - 2).length;
			this.FrameIndex -= removed;
			this.logGet('removeProcessed', now, delta, {removed});
		}
		const bufMax = Math.floor(config.acceptableLag / config.frameLen);
		if (this.Inbuf.length  > bufMax){ //too many messages piled up, perform reset
			const reset = this.Inbuf.splice(0, this.Inbuf.length - bufMax).length;
			this.FrameIndex = Math.max(0, this.FrameIndex - reset);
			this.TimeWithinFrame = 0;
			this.LastTime = now;
			this.logGet('reset', now, delta,  { reset });
		}
		for(let msg of this.Inbuf){
			if (msg.my) continue;
			const myIdx = msg[Fields.Ships].findIndex( _ => _[0] == this.Id );
			if (myIdx === -1) continue;
			const myShip = msg[Fields.Ships].splice(myIdx, 1).pop();
			msg.my = myShip;
		}
		//this.Inbuf = this.Inbuf.filter(_ => _.my);
		if (this.Mode === 0){//not enough data packets to run
			const arrived = this.Inbuf.map(_ => now - _.arrived);
			if (this.Inbuf.length >= config.bufMin && (now - this.Inbuf[0].arrived < config.shiftToPast)) {
//		debugger;
				this.Mode = 1;
				this.logGet('0->1', now, delta, { arrived });
			} else {
				this.logGet('idling', now, delta, { arrived });
				return;  //not enough data packets that are not stale
			} 
		}
		if (this.Mode === 1){//main mode, interpolating between packets
			while (this.TimeWithinFrame + delta > config.frameLen){
				this.logGet('advance', now,  delta);
				this.FrameIndex ++;
				this.TimeWithinFrame -= config.frameLen;
			}
			if (this.FrameIndex < 0) this.FrameIndex = 0;
			if (this.Inbuf.length - this.FrameIndex < 2) {
				this.Mode = 2;
				this.logGet('1->2', now,  delta);
			} else {
				const prev = this.Inbuf[this.FrameIndex];
				const next = this.Inbuf[this.FrameIndex + 1];
				//this.FrameIndex++;
				const time = this.TimeWithinFrame = this.TimeWithinFrame + delta;
				let result = {
					ships:this.prepare(prev[Fields.Ships], next[Fields.Ships], time),
					shots:this.prepare(prev[Fields.Shots], next[Fields.Shots], time)
				};
				if (prev.my && next.my){
					result.my = this.calc(prev.my, next.my, time)
				}
				this.logGet('interpolated', now, delta, {prev, next, result});
				this.TimeWithinFrame += delta;
				return result;
			}
		}
		if (this.Mode === 2){//not enough data packets, compensating with extrapolation 
			if ( (this.Inbuf.length < 2) || (now - this.Inbuf.slice(-1).pop().arrived > config.acceptableLag)){
				this.Mode = 0; //data packets are too stale or absent, stop updating the screen and wait for more packets
				this.Extrapolated = undefined;
				this.logGet('2->0', now,  delta);
				return;
			}else if (this.Inbuf.slice(this.FrameIndex).length > 1){//new data has arrived, don't need to extrapolate anymore
				//this.Mode = 3;//skip interpolation for now.
				this.Mode = 1;
				this.logGet('2->1', now,  delta);
			}else{
				const time = this.TimeWithinFrame = this.TimeWithinFrame + delta;
				const [prev, next] = this.Inbuf.slice(-2);
				this.Extrapolated = {
					ships:this.prepare(prev[Fields.Ships], next[Fields.Ships], time),
					shots:this.prepare(prev[Fields.Shots], next[Fields.Shots], time),
				};
				if (prev.my && next.my){
					this.Extrapolated.my = this.calc(prev.my, next.my, time)
				}
				this.logGet('extrapolated', now, delta, {prev, next, extrapolated: this.Extrapolated});
				this.TimeWithinFrame += delta;
				return this.Extrapolated;
			}
		}
/*		if (this.Mode === 3){//data has finally arrived, catching up after extrapolation
			if (this.Extrapolated == undefined){//should never happen
				this.Mode = 1;
				log('world', 'get', 'lost', [prev, next, this.Extrapolated, this.Mode, this.FrameIndex, this.TimeWithinFrame, this.LastTime, now, this.Inbuf]);
				return;
			}
			if (now - this.Inbuf[this.FrameIndex + 1].arrivedAt > config.acceptableLag){
				this.Mode = 0; //data packets are too stale, stop updating the screen and wait for more packets
				this.Extrapolated = undefined;
				log('world', 'get', '3->0', [this.Mode, this.FrameIndex, this.TimeWithinFrame, this.LastTime, now, this.Inbuf]);
				return;
			}
			const time = this.TimeWithinFrame = this.TimeWithinFrame + config.frameLen;
		}*/
	}
}