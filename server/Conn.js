const config = require('../client/config.js');
const wrap = require('../client/wrap.js');
const nodeDataChannel = require('node-datachannel');  
const WebSocketServer = require('ws');
const {Fields} = require('../client/const.js');
const log = require('./Log');

class Conn{
	messageCounter = 0;
	channels = new Map();
	clientCounter = 2;
	creation = Date.now();
	lastAll = Date.now();
	sendAll = msg => {
		msg.c = this.messageCounter = wrap.incremented(this.messageCounter);
		//msg.t = (Date.now() - this.creation);// & 32768;
		const m = JSON.stringify(msg);
		for(var c of this.channels.keys()){
			if (c.isOpen()) try{
				c.sendMessage(m);
			} catch (ex){
				log.writeS('net', 'error', 'sendall', ex);
				console.log('sendAll error', ex);
			}
		}
		log.writeS('net', 'dc', 'sendall', Date.now() - this.lastAll, m);
		this.lastAll = Date.now();
	};
	reliableSendAll = msg => {
		const m = JSON.stringify(msg);
		for(var c of this.channels.keys()){
			if (c.isOpen()) try {
				c.ws.sendMessage(msg);
			} catch (ex){
				log.writeS('net', 'error', 'reliablesendall', ex);
				console.log('reliableSendAll error', ex);
			}
		}
		log.writeS('net', 'ws', 'sendall', m);
	};
	count = () => Array.from(this.channels.keys()).filter(_ => _.isOpen()).length;
	constructor(){
		const wss = new WebSocketServer.Server({ port: config.wsPort });
		nodeDataChannel.initLogger("Debug");  
		wss.on('connection', ws => {
			ws.id = this.clientCounter++;
			log.writeS('net', 'ws', 'handshake', 'connection', '@'+ws.id);
			let peer2 = new nodeDataChannel.PeerConnection("Peer2", { iceServers: config.stun });
  			ws.on('error', err => {log.write('ws','error', '@'+ws.id, err);});
			peer2.onLocalDescription((sdp, type) => {
				const msg = JSON.stringify({step: 'description', payload : {sdp, type}});
				ws.send(msg);
				log.writeS('net', 'dc', 'handshake', 'local_description', '@'+ws.id, msg);
			})

			peer2.onLocalCandidate((candidate, mid) => {
				const msg = JSON.stringify({step: 'candidate', payload : {candidate, mid}});
		   		ws.send(msg);
				log.writeS('net', 'dc', 'handshake', 'local_candidate', '@'+ws.id, msg);
			});
			peer2.onDataChannel((dc) => {
				log.writeS('net', 'dc', 'handshake', 'created', '@'+ws.id, dc.getLabel());
				this.channels.set(dc, 0);
				dc.ws = ws;
				dc.id = ws.id;
				dc.onMessage((msg1) => {
					const time = Date.now();
				        let msg = JSON.parse(msg1);
					msg[Fields.Time] = time;
					let counter = parseInt( msg.c, 10 );
					let oldCounter = this.channels.get(dc);
					msg.outdated = wrap.outdated( msg.c, oldCounter);
					msg.id = dc.id;
					if (this.message) this.message(msg, dc);
					if (!isNaN(counter)) this.channels.set(dc, Math.max( this.channels.get(dc), counter));
					log.writeS('net', 'dc', 'onmessage', '@'+ws.id, '#' + this.messageCounter, msg1);
					//console.log('Peer2 Received Msg:', msg);
					//dc2.sendMessage("Tick From Peer2 " + (new Date()).toString());
				});
				dc.onError(console.error);
				ws.send(`{"${Fields.Id}":${dc.id},"${Fields.Time}":${Date.now() - this.creation}}`);
				dc.onClosed(() => {
					log.writeS('net', 'dc', 'onclosed', '@'+ws.id, '#' + this.messageCounter, dc?.ws?.readyState);
					if (dc?.ws?.readyState == 1){
						dc.ws.close();
					}
					this.channels.delete(dc);
					if (this.remove) this.remove(dc.id);
				});
			});
			ws.on('message', data => {
				const dataS = data.toString();
				let obj = JSON.parse(dataS);
				switch(obj.step){
					case 'description':
						log.writeS('net', 'ws', 'handshake', 'description', '@'+ws.id, '#' + this.messageCounter, dataS);
						console.log('setRemoteDescription', obj.payload.type, obj.payload.sdp);
						peer2.setRemoteDescription(obj.payload.sdp, obj.payload.type);
					break;
					case 'candidate':
						log.writeS('net', 'ws', 'handshake', 'candidate', '@'+ws.id, '#' + this.messageCounter, dataS);
						console.log('setRemoteCandidate', obj.payload.candidate, obj.payload.sdp);
						peer2.setRemoteCandidate(obj.payload.sdp, obj.payload.candidate);
					break;
					default:
						log.writeS('net', 'ws', 'onmessage', '@'+ws.id, '#' + this.messageCounter, dataS);
						if (this.reliableMessage) this.reliableMessage(obj, ws, ws.id);
				}
  			});
			ws.on('error', err => {
				log.write('net', 'ws', 'onerror', '@'+ws.id, '#' + this.messageCounter, err);
				this.channels.delete(dc);
				this.wsMap.delete(dc);
				if (this.remove && typeof(dc) !== 'undefined' && dc?.id !== undefined) this.remove(dc.id);
			});
			ws.on('close', ev => {
				log.write('net', 'ws', 'onclose', '@'+ws.id, '#' + this.messageCounter, ev);
				const datachannel = Array.from(this.channels.keys()).filter(_ => _.ws === ws).pop();
				if (datachannel){
					this.channels.delete(datachannel);
					if (datachannel.readyState == 'open'){
						datachannel.close();
					}
				}
				if (this.remove && typeof(dc) !== 'undefined' && dc?.id !== undefined) this.remove(dc.id);
			});

		});
	}
}

module.exports = Conn;