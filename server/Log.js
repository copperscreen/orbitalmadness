const fs = require('node:fs');
const noop = function(){};
class Log{		
	static {
		this.f = fs.openSync('events.log', 'w');
	};
	write(){
		const cat = Array.from(arguments).slice(0,-1).join('_');
		fs.write(Log.f, cat + ', ' + JSON.stringify(arguments[arguments.length-1]) + '\n', noop); 
	};
	writeS() {
		const cat = Array.from(arguments).slice(0,-1).join('_');
		fs.write(Log.f, cat + ', ' + arguments[arguments.length-1] + '\n', noop); 
	};
	halt(){
		fs.closeSync(Log.f);
	};
	sync(){
		fs.fdatasyncSync(Log.f);
	}; 
};
const log = new Log();
module.exports = log;