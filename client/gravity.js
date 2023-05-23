class Gravity{
	constructor(planets){
		this.planets = planets;
	}
	applyForce(timespan, pos, speed){
		let direction = this.getCenterDirection(pos);
		let accel = 0.0001 * this.planets.mass / direction.lengthSq();
		speed.add(direction.clone().normalize().scalarMultiply(accel * timespan));
		pos.add(direction.clone().normalize().scalarMultiply(accel * timespan * timespan));
	}
	getCenterDirection(pos){
		return pos.clone().negate();
	}
}
//module.exports = Gravity;
if (typeof(module) !== 'undefined') module.exports = Gravity;