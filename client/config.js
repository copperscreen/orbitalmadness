const config = {
	server: 'localhost',
	wsPort: 8080,
	httpPort: 3000,
	stun: ["stun:stun.l.google.com:19302"],
	frameLen: 40,
	shiftToPast: 160,
	acceptableLag: 500,
	bufMax: 5,
	bufMin: 3,
	maxSpeed: 100
}
if (typeof(module) !== 'undefined') module.exports = config;
