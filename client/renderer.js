const w = 256;
const h = 100;
const ratio = h / w;

class Renderer{
	w = 256;
	h = 100;
	ratio = this.h / this.w;
    	camera = new THREE.PerspectiveCamera(35, this.w / this.h, 0.1, 100000);
	backCamera = new THREE.PerspectiveCamera(35, this.w / this.h, 0.1, 10000);
	frontCamera = new THREE.OrthographicCamera(2, -2, this.ratio, -this.ratio, 0.1, 10);
	renderer = new THREE.WebGLRenderer({
		preserveDrawingBuffer: true,
		alpha: true
	});
	backScene = new THREE.Scene();
	frontScene = new THREE.Scene();
	scene = new THREE.Scene();
	Ships = new Map();
	Shots = new Map();
	Explosions = {};
	screen = document.getElementById('screen');	
	constructor(startTime, planets){
		this.startTime = startTime;
    		this.camera.quaternion.setFromEuler(new THREE.Euler(0, Math.PI, 0));

		this.renderer.autoClearColor = false;

		this.renderer.setClearColor(new THREE.Color().setHex(Colors.clear));
		this.renderer.setSize(w, h);

		//this.initStars();
		this.initCrossHair();
		this.syncCam();
		//const ldr = new THREE.JSONLoader();
		const ldr = new THREE.ObjectLoader();
//		this.ShipData = ldr.parse(shipFile, "");
		this.ShipData = new THREE.BoxGeometry( 1, 1, 1 )
		
	}
	attach(elem) {
		elem.appendChild(this.renderer.domElement);
	}

	update(data){
		for(let shipId in data.ships.removed.entries()){
			this.scene.remove(this.Ships.get(shipId));
			this.Ships.delete(shipId);
		}
		for(let shotId in data.shots.removed.entries()){
			this.scene.remove(this.Shots.get(shotId));
			this.Shots.delete(shotId);
		}
		for(let [id, coords] in data.ships.modified.entries()){
			const ship = this.Ships.get(id);
			ship.position = coords.pos;
			ship.quaternion = coords.rot;
		}
		for(let [id, coords] in data.shots.modified){
			const shot = this.Shots.get(id);
			shot.position = coords.pos;
			shot.quaternion = coords.rot;
		}
		for(let [id, coords] in data.ships.added){
			const shape = new THREE.Mesh(shipData.geometry, new THREE.MeshFaceMaterial(shipData.materials));
			shape.position = coords.pos;
			shape.quaternion = coords.rot;
			shape.scale.set(100,100,100);
			this.scene.add(shape);
			this.Ships.set(id, shape);			
		}
		for(let shots in data.shots.added){
			const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
			const material = new THREE.MeshBasicMaterial({ color: Colors.shot  });
        		const shape = new THREE.Mesh(geometry, material);
			shape.position = coords.pos;
			shape.quaternion = coords.rot;
			this.scene.add(shape);
			this.Shots.set(id, shape);			
		}
		if (data.my){
			this.camera.position.set(data.my.pos.x, data.my.pos.y, data.my.pos.z);
			this.camera.quaternion.set(data.my.rot._x, data.my.rot._y, data.my.rot._z, data.my.rot._w);
		}
		const c = this.camera;
		log('renderer', 'camera', [c.position.x, c.position.y, c.position.x, c.quaternion._x, c.quaternion._y, c.quaternion._z, c.quaternion._w]);
	}
	render(data){
		if (data) this.update(data);
		this.syncCam();
		this.renderer.clear();
		this.renderer.clearDepth();
		this.renderer.autoClear = false;
		this.renderer.render(this.backScene, this.backCamera);
		if (this.scene.length) {
	                //planets.shape.positionScreen.set(0,0,0);
			this.renderer.clearDepth();
			this.renderer.render(this.scene, this.camera);
			//console.log(planets.shape.positionScreen);
		}
		//if (!getElem('dead').classList.contains('on')) {
		this.renderer.clearDepth();
		this.renderer.render(this.frontScene, this.frontCamera);
		//}
	}
	syncCam() {
        	this.backCamera.quaternion.copy(this.camera.quaternion);
	}
	zoomIn() {
			this.camera.fov = 5;
			this.backCamera.fov = 5;
			this.camera.updateProjectionMatrix();
			this.backCamera.updateProjectionMatrix();

	}
	resetZoom(){
			this.camera.fov = 35;
			this.backCamera.fov = 35;
			this.camera.updateProjectionMatrix();
			this.backCamera.updateProjectionMatrix();
	}
	initStars() {
		let oldStars;
		while (oldStars = this.backScene.children[0]) this.backScene.remove(oldStars);
		let skyRadius = Math.max(this.w / 3, this.h / 3);
		let dblpi = Math.PI * 2;
		const stars = [];
		for (let i = 0; i < 200; ++i) {
			let a1 = Math.random() * dblpi;
			let a2 = Math.cos(Math.random() * dblpi) * dblpi;
			let x = skyRadius * Math.cos(a1);
			let y = skyRadius * Math.sin(a2);
			let z = skyRadius * Math.sin(a1);
//			stars.vertices.push(new THREE.Vector3(x, y, z));
                        stars.push(new THREE.Vector3(x, y, z));
		}

		let cloud = new THREE.Points(new THREE.BufferGeometry().setFromPoints(stars), new THREE.PointsMaterial({
			color: Colors.star
		}));
		this.backScene.add(cloud);
	}
	initCrossHair() {
		let crossM = new THREE.LineBasicMaterial({
			color: Colors.cross
    		});

/*		let crossVert = new THREE.BufferGeometry();
    		crossVert.vertices.push(
        		new THREE.Vector3(0, -0.05, -1),
        		new THREE.Vector3(0, 0.05, -1)
    		);
		let crossHoriz = new THREE.BufferGeometry();
    		crossHoriz.vertices.push(
        		new THREE.Vector3(-0.05, 0, -1),
        		new THREE.Vector3(0.05, 0, -1)
    		);*/
		this.crossVertLine = new THREE.Line(
			new THREE.BufferGeometry().setFromPoints( 
				[new THREE.Vector3(0, -0.05, -1), new THREE.Vector3(0, 0.05, -1)] 
				), 
			crossM);
		this.crossHorizLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints( 
				[new THREE.Vector3(-0.05, 0, -1), new THREE.Vector3(0.05, 0, -1)]
				), 
			crossM);
		this.frontScene.add(this.crossVertLine);
		this.frontScene.add(this.crossHorizLine);
	}
	resize(width, height){
        //var body = document && document.body;
		//this.renderer.setSize(10, 10);
		this.w = width - 23;
		this.h = height - 24;
		this.crossVertLine.scale.set(1, 0.5 * this.w / this.h, 1);
            //body.querySelector('canvas').style.marginTop = "40px";
		this.renderer.setSize(this.w, this.h);
		this.camera.setViewOffset(this.w, this.h, 0, 0, this.w, this.h);
		this.backCamera.setViewOffset(this.w, this.h, 0, 0, this.w, this.h);
		this.camera.updateProjectionMatrix();
		this.backCamera.updateProjectionMatrix();
		this.ratio = this.h / this.w;
		this.frontCamera = new THREE.OrthographicCamera(1, -1, ratio, -ratio, 0.1, 10);
		this.frontCamera.updateProjectionMatrix();
		this.initStars();
        }
}
