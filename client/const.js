const Fields = {
//	'KeyUp': 'u',
	'KeyDown': 'd',
	'Fire': 'f',
//	'KeyRepeat': 'r',
	'MessageCounter': 'c',
	'Id': 'id',
	'Time': 't',
//	'PreviousCounter': 'p',
	'EndTime': 'e',
	'Ships': 's',
	'Shots': 'p'
};
const  Actions = {
	'TurnUp': 'u',
	'TurnDown': 'd',
	'TurnLeft': 'l',
	'TurnRight': 'r',
	'TurnClockwise': '+',
	'TurnCClockwise': '-',
	'Fire': 'f',
	'Accelerate': 'a',
	'Deccelerate': 'd',
	'OrientPrograde': 'x',
	'OrientRetrograde': 'X',
	'OrientToCenter': 'c',
	'Stabilize': 's'
};        
const IKeymap = {
	65: Actions.TurnLeft,      //a
	68: Actions.TurnRight,     //d
	87: Actions.TurnUp,        //w
	83: Actions.TurnDown,      //s
	81: Actions.TurnCClockwise,//q
	69: Actions.TurnClockwise, //e
	17: Actions.Fire,          //Ctrl
	90: Actions.Deccelerate,   //z
	16: Actions.Accelerate,    //Shift
	//74:'l', 76: 'r', 73:'u', 75:'d', 85: '-', 79:'+', 
	88: Actions.OrientPrograde, //x
	67: Actions.OrientRetrograde, //c
	86: Actions.OrientToCenter    //v
};
const Keymap = {
	65: Actions.TurnLeft,
	68: Actions.TurnRight,
	87: Actions.TurnDown,
	83: Actions.TurnUp,
	81: Actions.TurnCClockwise,
	69: Actions.TurnClockwise,
	17: Actions.Fire,
	90: Actions.Deccelerate,
	16: Actions.Accelerate,
	//74:'l', 76: 'r', 73:'u', 75:'d', 85: '-', 79:'+', 
	88: Actions.OrientPrograde,
	67: Actions.OrientRetrograde,
	86: Actions.OrientToCenter
};
const orient = Actions.OrientPrograde + Actions.OrientRetrograde + Actions.OrientToCenter;
const Opposites = {
	[Actions.TurnLeft]: Actions.TurnRight + orient,
	[Actions.TurnRight]: Actions.TurnLeft + orient,
	[Actions.TurnDown]: Actions.TurnUp + orient,
	[Actions.TurnUp]: Actions.TurnDown + orient,
	[Actions.TurnCClockwise]: Actions.TurnClockwise + orient,
	[Actions.TurnClockwise]: Actions.TurnCClockwise + orient,
	[Actions.Accelerate]: Actions.Deccelerate + orient,
	[Actions.Deccelerate]: Actions.Accelerate + orient,
	[Actions.OrientPrograde]: Object.values(Keymap).filter(_ => [Actions.Fire, Actions.OrientPrograde].indexOf(_) === -1),
	[Actions.OrientRetrograde]: Object.values(Keymap).filter(_ => [Actions.Fire, Actions.OrientRetrograde].indexOf(_) === -1),
	[Actions.OrientToCenter]: Object.values(Keymap).filter(_ => [Actions.Fire, Actions.OrientToCenter].indexOf(_) === -1)
};
const Colors = {
    cross: 0xeeeeee,
    clear: 0x000000,
    indi: 0x0000ff,
    star: 0xcccccc,
    ship: 0x00ff00,
    shot: 0x0000ff,
    exp: 0xffffff
};

if (typeof(module) !== 'undefined') module.exports = {Fields, Actions, Keymap, IKeymap, Opposites, Colors};