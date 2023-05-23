function outdated(newer, older){
	if (newer > older) return false;
	if (newer < 2000 && older > (8192 - 2000)) return false;
	return true;
}
function incremented(counter){
	return (counter + 1) & 8191;
}
if (typeof(module) !== 'undefined') module.exports = { outdated, incremented };