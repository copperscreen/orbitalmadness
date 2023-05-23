let logbuf = [];
function log(){
	const type = Array.from(arguments).slice(0,-1).join('_');
	logbuf.push({type, 'msg': arguments[arguments.length-1]});	
};
function halt(){
	log = function(){};
	console.log(logbuf.length);
}
function dump(){
//    window.open( "data:application/octet-stream," + encodeURIComponent(JSON.stringify(logbuf)), "log" );
//chrome started to block this popup hence the workaround: https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
	let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logbuf), null, '   ');
	let downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute("href",     dataStr);
	downloadAnchorNode.setAttribute("download",  'log.json');
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}

class tst{};