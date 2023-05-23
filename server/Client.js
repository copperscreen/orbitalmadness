const log = require('./Log');
let {Fields} = require('../client/const');

class Client{
	pressedKeys = new Map();
	releasedKeys = new Map();
	messages = [];
//	d = 0;
	constructor(id){
		this.id = id;
		this.ids = '@'+id;
	}
	addEvent(msg){
		this.messages.push(msg);
	}
	getEvents(now, prevNow){
	        const actions = [];//@todo add already pressed
		log.write('client','convert', this.ids, 'messages', this.messages);
//		if (this.d) debugger;
		for(let msg of this.messages){
			const keys = this.decodeKeys(msg[Fields.KeyDown]);
			for(let tuple of keys){
				let [key, counter] = tuple;
				if (this.releasedKeys.has(counter)) continue;
				this.releasedKeys.delete(key);
				const pressed = this.pressedKeys.get(key);
				if (pressed !== undefined){
					pressed[Fields.Time] = Math.max(pressed[Fields.Time], msg[Fields.Time]);
					continue;
				}else{
					this.addKey(actions, { key, 'start': msg[Fields.Time], 'counter': msg[Fields.MessageCounter] });
				}
			}

			const keySet = new Set(keys.map(_ => _[0]));
			for(let [pressedKey, pressed] of this.pressedKeys.entries()){
				if (!keySet.has(pressed.key)){
					if (pressed.end === undefined){
						pressed.end = msg[Fields.Time];
					}else{
						pressed.end = Math.min(pressed.end, msg[Fields.Time]);
					}
					this.releasedKeys.set(pressed.counter, now);
				}
			}
			this.depressKeys(actions, prevNow, msg[Fields.Time], keys);
		}
		if (this.messages.length === 0){
			for(let key of this.pressedKeys.keys()){
				actions.unshift( { key, 'start': prevNow, 'end': now } );
			}
		}

		actions.forEach( action => { if (action.end === undefined) action.end = now; } );
		this.messages.splice(0);//we're done, clean up the buffer
		log.write('client','convert', this.ids, 'actions', actions);
		const staleKeys = [];
		for(let [key, time] in this.releasedKeys.entries()){
			if (time < now - 60000) staleKeys.push(key);
		}
		for(let k of staleKeys) this.releasedKeys.delete(k);
		log.write('client','convert', this.ids, 'released', Array.from(this.releasedKeys.entries()));
		log.write('client','convert', this.ids, 'pressed', Array.from(this.pressedKeys.entries()));
//		this.d = actions.length;
		return actions;
	}	
	depressKeys(actions, prevNow, msgTime, keys){
		const pressedInMsg = new Set(keys.map( _ => _[0] ));
		for(let key of Array.from(this.pressedKeys.keys())){
			if (!pressedInMsg.has(key)) {
				let found = false;
				for(let i = actions.length - 1; i >= 0; i--){
					if (key == actions[i].key){
						actions[i].end = msgTime;
						found = true;
                				break;
					}
				}
				if (!found){
					actions.unshift( { key, 'start': prevNow, 'end': msgTime } );
				}
				this.pressedKeys.delete(key);
			}
		}
	}
	decodeKeys(keys){
		if (keys === '') return [];
		return keys.split(',').map( _ => [_[0],  _.slice(1)] );
	}
	addKey(actions, action){
		let msgStart = action.start;
		this.pressedKeys.set(action.key, action);
		for(let i = 0; i < actions.length; i++){ //Adjust time for out-of-order messages
			if (actions[i].counter > action.counter){
				msgStart = Math.min(actions[i].start, msgStart);
			}
		}
		for(let i = actions.length - 1; i >= 0; i--){
			if (msgStart > actions[i].start){ //Find the last action after this one
				actions.splice(i, 0, action);
				return;
			}
		}
		actions.unshift(action);
	}
	cleanUpKeys(actions, keys){
		const keySet = new Set(keys.map(_ => _[0]));
		for(let [pressedKey, pressed] of this.pressed.entries()){
			if (!keySet.has(pressed.key)){
				if (pressed.end === undefined){
					pressed.end = msg[Fields.Time];
				}else{
					pressed.end = Math.min(pressed.end, msg[Fields.Time]);
				}
			}
		}
	}
	beginRange(actions, msg){
		const keys = this.decodeKeys(msg[Fields.KeyDown]);
		for(let tuple of keys){
			let [key, counter] = tuple;
			if (this.released.has(counter)) continue;
			const pressed = this.pressed(key);
			if (pressed !== undefined){
				pressed[Fields.Time] = Math.max(pressed[Fields.Time], msg[Fields.Time]);
				continue;
			}else{
				this.addKey(actions, { key, 'start': msg[Fields.Time], 'counter': msg[Fields.MessageCounter] });
			}
		}
		this.cleanUpKeys(actions, keys);
	}
	endRange(actions, counter, time){
		for(let a of actions){
			if (a.counter == counter){
				a.end = time;
				return;
			}
		}
	}
}
module.exports = Client;