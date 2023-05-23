class Conn{
	messageCounter = 0;
	lastIncoming = -1;
	lastTime = Date.now();
	constructor(){
		let localConnection = new RTCPeerConnection({iceServers: [{urls:config.stun}]});
		let ws = new WebSocket('ws://' + config.server + ':' + config.wsPort);
		ws.addEventListener('error', (event) => {
			if (this.error) {
				this.error('websocket error', event);
				log('net', 'ws', 'error', event);
			}
		});
		ws.addEventListener('close', ev => {
			if (this.close) this.close();
		});
		ws.addEventListener('message', (event) => {
			let msg = JSON.parse(event.data);
			switch(msg.step){
				case 'description':
					log('net', 'ws', 'handshake', 'RemoteDescription', msg.payload);
					localConnection.setRemoteDescription(msg.payload).then( arg => 
						log('net', 'ws', 'handshake', 'RemoteDescriptionSet', arg)
					).catch( ex => log('net', 'ws', 'handshake', 'RemoteDescriptionSetFailure', ex));
				break;
				case 'candidate':
					msg.payload.sdpMid = msg.payload.mid;
					log('net', 'ws', 'handshake', 'addIceCandidate', msg.payload);
			    		localConnection.addIceCandidate(msg.payload).then( arg => console.log('ice candidate added', arg)).catch( ex => console.log('ice candidate add failure', ex));
				default:
					if (this.reliableMessage) this.reliableMessage(msg, ws);
					log('net', 'ws', 'message', msg);					
			}
		});
		ws.addEventListener('open', (event) => { 
			this.sendChannel = localConnection.createDataChannel("sendChannel");
			this.sendChannel.onmessage = event => {
				const data = JSON.parse(event.data);
				let counter = parseInt(data.c, 10);
				data.outdated = outdated( counter, this.lastIncoming );
				if (!data.outdated) this.lastIncoming = counter;
				const now = Date.now();
				log('net', 'dc', 'message', now - this.lastTime, data.c, data);
				this.lastTime = now;
				if (this.message) this.message(data);
				//console.log('sendchannel got message', data);
				//sendChannel.send((new Date()).toString());
			};
			this.sendChannel.onclose = event => {
				log('net', 'dc', 'closed', event);
				if (this.close) this.close();
			}
			this.sendChannel.onerror = event => {
				log('net', 'dc', 'error', event);
			}
			this.sendChannel.onopen = event => {
				if (this.open) this.open();
				log('net', 'dc', 'handshake', 'open', event);
			}
			localConnection.createOffer()
			.then(offer => (log('net','dc', 'setLocalDescriptionOffer', offer), localConnection.setLocalDescription(offer)))    //1
			.then(() => ws.send(JSON.stringify({step: 'description', payload:localConnection.localDescription})))
			.catch( ex => {log('net','dc', 'init failure', ex); if (this.error) this.error('DataChannel error', ex );})
		});
		this.send = msg => {
			const m = JSON.stringify(Object.assign(msg, {'c': this.messageCounter = incremented(this.messageCounter)}));
			this.sendChannel.send(m);
			log('net', 'dc', 'send', msg);
			return this.messageCounter;
		};
		this.reliableSend = msg => {
			const m = JSON.stringify(msg);
			log('net', 'ws', 'send', msg);
			ws.send(m);
		}
	}
}