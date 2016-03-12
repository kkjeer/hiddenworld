var hwTree;
var willowTree;
var hwTreeHeight;
var hwTreeRadius;

var DELAY = 5000;

/*
frame origin: center of the bottom of the box 
*/
function HiddenWorld (planeSize) {
	this.planeSize = planeSize;

	hwTreeHeight = 0.7*this.planeSize;
	hwTreeRadius = 0.02*this.planeSize;
	//the indexing functions work now, but for some reason using them in makeLeaf() makes the animations really jerky
	hwTree = makeHWTree(hwTreeHeight, hwTreeRadius, "mossy_bark", "mossy_bark", "leaf_fern_light"/*[0x7CFC00, 0x006400, "semi-random"]*/);
	willowTree = makeHWTree(hwTreeHeight, hwTreeRadius, "willow_bark", "willow_bark", "leaf_fern_light");

	//frame to contain everything (ground plane and elements)
	this.frame = new THREE.Object3D();

	var planeGeom = new THREE.PlaneGeometry(2.5*this.planeSize, 2*this.planeSize, 32, 32);
	var planeMat = createMaterial("forest_floor");
	planeMat.map.repeat.x = 6;
	planeMat.map.repeat.y = 6;
	var planeMesh = new THREE.Mesh(planeGeom, planeMat);
	planeMesh.rotateX(Math.PI/2);
	this.frame.add(planeMesh);

	//add the elements
	this.addElements();
}

HiddenWorld.prototype.addElements = function () {
	this.addFaytiroy();
	this.addTrainingForest();
	this.addMeleth();
	this.addThotur();
	this.addHills();
	this.addMountains();
	this.addStable();
	this.addMeadow();
	//this.addEntrance();
	this.addClimbingTree();
}

HiddenWorld.prototype.addFaytiroy = function () {
	this.ulForestWidth = 0.5*this.planeSize;
	this.ulForestHeight = 0.45*this.planeSize;
	var ulForest = this.makeFaytiroy(this.ulForestWidth, this.ulForestHeight);
	ulForest.position.set(-0.5*this.planeSize, 0, -0.5*this.planeSize + this.ulForestHeight);
	this.frame.add(ulForest);
	this.faytiroyPosition = {x: 0.5*this.planeSize, y: -0.1*this.planeSize, z: -0.1*this.planeSize};
	this.faytiroyRotation = {x: degreesToRadians(5), y: degreesToRadians(20), z: 0};
}

HiddenWorld.prototype.addMeleth = function () {
	this.urForestWidth = 0.4*this.planeSize;
	this.urForestHeight = 0.35*this.planeSize;
	var urForest = this.makeMeleth(this.urForestWidth, this.urForestHeight);
	urForest.position.set(0.5*this.planeSize, 0, -0.5*this.planeSize + this.urForestHeight);
	this.frame.add(urForest);
	this.melethPosition = {x: -0.7*this.planeSize, y: -0.1*this.planeSize, z: 0.03*this.planeSize};
	this.melethRotation = {x: degreesToRadians(3), y: degreesToRadians(-25), z: 0};
}

HiddenWorld.prototype.addTrainingForest = function () {
	this.llForestWidth = 0.45*this.planeSize;
	this.llForestHeight = 0.45*this.planeSize;
	var llForest = this.makeTrainingForest(this.llForestWidth, this.llForestHeight, 10, 40, 100);
	llForest.position.set(-0.3*this.planeSize, 0, 0.6*this.planeSize - this.llForestHeight);
	this.frame.add(llForest);
	this.trainingPosition = {x: 0.2*this.planeSize, y: -0.1*this.planeSize, z: -0.575*this.planeSize};
	this.trainingRotation = {x: 0, y: degreesToRadians(-30), z: 0};
}

HiddenWorld.prototype.addThotur = function () {
	var thotur = this.makeThotur();
	thotur.position.set(-0.02*this.planeSize, 0, -0.0725*this.planeSize);
	this.frame.add(thotur);
	this.thoturPostition = {x: 0.02*this.planeSize, y: -0.15*this.planeSize, z: -0.225*this.planeSize};
	this.thoturRotation = {x: degreesToRadians(10), y: 0, z: 0};
}

HiddenWorld.prototype.addHills = function () {
	this.hillRadius = 0.1*this.planeSize;
	this.hillHeight = 0.45*hwTreeHeight;
	var hills = makeHWHills(this.hillHeight, this.hillRadius, "grass");
	hills.position.set(1.1*this.planeSize, 0, 0.5*this.planeSize);
	this.frame.add(hills);
}

HiddenWorld.prototype.addMountains = function () {
	this.mountainRadius = 0.8*this.hillRadius;
	this.mountainHeight = 1.25*this.hillHeight;
	var mountain = makeCone(0, this.mountainRadius, this.mountainHeight, 0, 0, "mountain");
	mountain.scale.set(1.5, 1, 0.8); 
	mountain.position.set(1.1*this.planeSize - 3*this.hillRadius - this.mountainRadius, 0, 0.5*this.planeSize - this.mountainRadius);
	mountain.rotateY(-Math.PI/2);
	this.frame.add(mountain);
}

HiddenWorld.prototype.addStable = function () {
	this.stableWidth = 0.125*this.planeSize;
	this.stableHeight = 0.23*this.planeSize;
	this.stableDepth = 0.1*this.planeSize;
	var stable = makeStable(this.stableWidth, this.stableHeight, this.stableDepth, "rough_wood2");
	stable.position.set(0.5*this.planeSize - 0.5*this.stableWidth, 0, 0.5*this.planeSize - 1.5*this.hillRadius - this.stableDepth);
	this.frame.add(stable);
	this.stablePosition = {x: 0.45*this.planeSize, y: -0.13*this.planeSize, z: 0*this.planeSize};
	this.stableRotation = {x: degreesToRadians(10), y: degreesToRadians(180), z: 0};
}

HiddenWorld.prototype.addMeadow = function () {
	this.meadowX = 0.5*this.planeSize;
	this.meadowZ = 0.65*this.planeSize - this.urForestHeight;
	this.meadowY = 0.004*this.planeSize;
	var meadow = makeHWMeadow(this.meadowX, this.meadowZ, this.meadowY, "grass");
	meadow.position.set(0.75*this.planeSize - this.meadowX, 2*this.meadowY, -0.5*this.planeSize + this.urForestHeight);
	meadow.rotateX(Math.PI/2);
	this.frame.add(meadow);
}

HiddenWorld.prototype.addEntrance = function () {
	var entrance = this.makeEntrance();
	entrance.position.set(-0.2*this.planeSize, 0, 0.15*this.planeSize);
	this.frame.add(entrance);
}

HiddenWorld.prototype.addClimbingTree = function () {
	this.climbingHeight = 0.95*this.planeSize;
	this.climbingRadius = 0.05*this.climbingHeight;
	this.climbingTree = makeHWTree(this.climbingHeight, this.climbingRadius, "red_bark", "red_bark", "leaf_fern_light");
	this.climbingTree.position.set(0, 0, -0.8*this.planeSize);
	this.climbingTree.rotateY(Math.PI);
	this.frame.add(this.climbingTree);

	this.climbingBasePosition = {x: this.climbingTree.position.x, y: -0.1*this.planeSize, z: -(this.climbingTree.position.z + 0.2*this.planeSize)};
	this.climbingBaseRotation = {x: degreesToRadians(-0), y: 0, z: 0};
	this.climbingTopPosition = {x: this.climbingTree.position.x, y: -0.8*this.climbingHeight, z: -(this.climbingTree.position.z + 0.2*this.planeSize)};
	this.climbingTopRotation = {x: degreesToRadians(-0), y: 0, z: 0};
}

HiddenWorld.prototype.animate = function () {
	if (this.animateFlames) {
		this.flames[0].material.map.offset.y -= 0.08;
    for (var f = 1; f < this.flames.length; f++) {
      this.flames[f].material.map.offset.y -= 0.02;
    }
  }

  if (this.animateLake) {
    this.lake.material.map.offset.x -= 0.005;
  }

  if (this.animateRiver) {
    this.river.material.map.offset.x -= 0.005;
    this.river.material.map.offset.z -= 0.004;
  }
}

HiddenWorld.prototype.stopAnimation = function () {
	this.animateFlames = false;
	this.animateLake = false;
	this.animateRiver = false;
}

HiddenWorld.prototype.reset = function () {
	this.frame.position.copy(hwPosition);
	this.frame.rotation.set(0, 0, 0);
	this.frame.rotateX(hwRotation.x);
  this.frame.rotateY(hwRotation.y);
  this.frame.rotateZ(hwRotation.z);
  $('#top-instructions').html(hiddenWorldInstructions);
  this.animateRiver = true;
  this.animateFlames = false;
  this.animateLake = false;
}

HiddenWorld.prototype.tour = function () {
	//set all the tweens
	this.setThoturTween();
	this.setFaytiroyTween();
	this.setMelethTween();
	this.setTrainingTween();
	this.setStableTween();
	this.setClimbingTweens();

	//chain the tweens together and start the first one (thotur)
	this.thoturMoveTween.chain(
		this.moveToClimbingTween.chain(
			this.moveAlongClimbingTween.chain(
				this.moveDownClimbingTween.chain(
			  	this.faytiroyMoveTween.chain(
			 			this.trainingMoveTween.chain(
			 				this.melethMoveTween.chain(
			 					this.stableMoveTween
			 		 	)
			 		 )
			   	)
			   )
			  )
			 )
		).start();
}

HiddenWorld.prototype.setThoturTween = function () {
	this.thoturTime = 4500;
	var hw = this;
	hw.thoturMoveTween = new TWEEN.Tween(hw.frame.position).to(hw.thoturPostition, hw.thoturTime);
	hw.thoturRotateTween = new TWEEN.Tween(hw.frame.rotation).to(hw.thoturRotation, hw.thoturTime);
	hw.thoturMoveTween.onStart(function () {
		hw.animateFlames = true;
		hw.animateLake = false;
		hw.thoturRotateTween.start();
		$('#top-instructions').html('<b>Thotur</b>: the town where most of the Dragon Shadows live in tents. ' + 
																'Xelai lives here and briefly shares her tent with her cousin Va\'lett.');
	});
	hw.thoturMoveTween.onComplete(function () {
		hw.animateRiver = false;
	});
}

HiddenWorld.prototype.setClimbingTweens = function () {
	this.climbingTime1 = 3500;
	this.climbingTime2 = 3000;
	var hw = this;

	//not sure about this - can't decide whether it looks ridiculous or not
	var rotation = {y: Math.PI};
	hw.treeRotateTween = new TWEEN.Tween(rotation).to({y: 3*Math.PI}, hw.climbingTime2).onUpdate(function () {
		hw.climbingTree.rotation.y = rotation.y;
	});

	//tween to move to the base of the climbing tree
	hw.moveToClimbingTween = new TWEEN.Tween(hw.frame.position).to(hw.climbingBasePosition, hw.climbingTime1);
	hw.rotateToClimbingTween = new TWEEN.Tween(hw.frame.rotation).to(hw.climbingBaseRotation, hw.climbingTime1);
	hw.moveToClimbingTween.onStart(function () {
		hw.animateRiver = false;
		hw.animateLake = false;
		hw.rotateToClimbingTween.start();
		$('#top-instructions').html('<b>The climbing tree</b>: the location of Dragon Shadow climbing lessons, taught by Aregae. ' + 
																'Xelai learns Aregae\'s name during her first climbing lesson with him.');
	});
	hw.moveToClimbingTween.onComplete(function () {
		hw.animateFlames = false;
	});
	hw.moveToClimbingTween.delay(DELAY);

	//tween to move up to the top of the climbing tree
	hw.moveAlongClimbingTween = new TWEEN.Tween(hw.frame.position).to(hw.climbingTopPosition, hw.climbingTime2);
	hw.rotateAlongClimbingTween = new TWEEN.Tween(hw.frame.rotation).to(hw.climbingTopRotation, hw.climbingTime2);
	hw.moveAlongClimbingTween.onStart(function () {
		hw.treeRotateTween.start();
		hw.rotateAlongClimbingTween.start();
	});
	hw.moveAlongClimbingTween.delay(1000);

	//not sure about this - can't decide whether it looks ridiculous or not
	var unwind = {y: 3*Math.PI};
	hw.treeUnwindTween = new TWEEN.Tween(unwind).to({y: Math.PI}, hw.climbingTime2).onUpdate(function () {
		hw.climbingTree.rotation.y = unwind.y;
	});

	//tween to move back down to the base of the climbing tree
	hw.moveDownClimbingTween = new TWEEN.Tween(hw.frame.position).to(hw.climbingBasePosition, hw.climbingTime2).delay(1000);
	hw.moveDownClimbingTween.onStart(function () {
		hw.treeUnwindTween.start();
	});
}

HiddenWorld.prototype.setFaytiroyTween = function () {
	this.faytiroyTime = 4000;
	var hw = this;
	hw.faytiroyMoveTween = new TWEEN.Tween(hw.frame.position).to(hw.faytiroyPosition, hw.faytiroyTime);
	hw.faytiroyRotateTween = new TWEEN.Tween(hw.frame.rotation).to(hw.faytiroyRotation, hw.faytiroyTime);
	hw.faytiroyMoveTween.onStart(function () {
		hw.animateFlames = true;
		hw.animateLake = false;
		hw.animateRiver = false;
		hw.faytiroyRotateTween.start();
		$('#top-instructions').html('<b>Faytiroy forest</b>: Mesdel lives here, and Xelai finds Aregae here at the end of ' + 
																'<i>Dragon Shadow</i> and <i>Starting Over</i>.');
	});

	//Faytiroy directly follows the climbing tree - don't delay as long
	hw.faytiroyMoveTween.delay(1000);
}

HiddenWorld.prototype.setTrainingTween = function () {
	this.trainingTime = 5000;
	var hw = this;
	hw.trainingMoveTween = new TWEEN.Tween(hw.frame.position).to(hw.trainingPosition, hw.trainingTime);
	hw.trainingRotateTween = new TWEEN.Tween(hw.frame.rotation).to(hw.trainingRotation, hw.trainingTime);
	hw.trainingMoveTween.onStart(function () {
		hw.animateRiver = true;
		hw.animateLake = false;
		hw.trainingRotateTween.start();
		$('#top-instructions').html('<b>The training forest</b>: Xelai and Aregae train together here after Xelai becomes a Dragon Shadow. ' + 
																'Aregae first gives Xelai the idea to find Raqan while they are training here.');
	});
	hw.trainingMoveTween.onComplete(function () {
		hw.animateFlames = false;
	});
	hw.trainingMoveTween.delay(DELAY);
}

HiddenWorld.prototype.setMelethTween = function () {
	this.melethTime = 6000;
	var hw = this;
	hw.melethMoveTween = new TWEEN.Tween(hw.frame.position).to(hw.melethPosition, hw.melethTime);
	hw.melethRotateTween = new TWEEN.Tween(hw.frame.rotation).to(hw.melethRotation, hw.melethTime);
	hw.melethMoveTween.onStart(function () {
		hw.animateLake = true;
		hw.animateFlames = false;
		hw.melethRotateTween.start();
		$('#top-instructions').html('<b>Meleth forest</b>: Aregae shows Xelai the lake in this forest shortly after she becomes a Dragon Shadow.');
	});
	hw.melethMoveTween.onComplete(function () {
		hw.animateRiver = false;
	});
	hw.melethMoveTween.delay(DELAY);
}

HiddenWorld.prototype.setStableTween = function () {
	this.stableTime = 4000;
	var hw = this;
	hw.stableMoveTween = new TWEEN.Tween(hw.frame.position).to(hw.stablePosition, hw.stableTime);
	hw.stableRotateTween = new TWEEN.Tween(hw.frame.rotation).to(hw.stableRotation, hw.stableTime);
	hw.stableMoveTween.onStart(function () {
		hw.animateFlames = false;
		hw.stableRotateTween.start();
		$('#top-instructions').html('<b>The stable</b>: home of the highly trained Dragon Shadow horses. Aregae meets Xelai here when she ' + 
																'leaves to find Raqan and asks if she would mind company.');
	});
	hw.stableMoveTween.onComplete(function () {
		hw.animateLake = false;
		hw.animateRiver = true;
	});
	hw.stableMoveTween.delay(DELAY);
}

HiddenWorld.prototype.explore = function (direction, amount) {
	switch (direction) {
		case "moveUpDown":
			//if (this.canMoveUpDown(amount)) {
				this.frame.position.z += 0.5*amount;
				this.frame.position.z += amount;
			//}
			break;
		case "moveLeftRight":
			//if (this.canMoveLeftRight(amount)) {
				this.frame.position.x += 0.5*amount;
				this.frame.position.x += amount;
			//}
			break;
		case "rotateUpDown":
			if (this.canRotateUpDown(amount))
				this.frame.rotateX(amount);
			break;
		case "rotateLeftRight":
			this.frame.rotateY(amount);
			break;
	}
}

HiddenWorld.prototype.canRotateUpDown = function (amount) {
	return this.frame.rotation.x + amount <= hwUpperRotationLimit && this.frame.rotation.x + amount >= hwLowerRotationLimit;
}

HiddenWorld.prototype.canMoveUpDown = function (amount) {
	return this.frame.position.z + amount <= hwPosition.z + 0.5*this.planeSize
		&& this.frame.position.z + amount >= hwPosition.z;
}

HiddenWorld.prototype.canMoveLeftRight = function (amount) {
	return this.frame.position.x + amount <= 0.25*this.planeSize
		&& this.frame.position.x + amount >= -0.25*this.planeSize;
}

/*
makeFaytiroy()
Purpose: returns an Object3D containing several trees
	placed in the northwest corner of the hidden world
	origin: lower left corner (aligns with the left edge of the hidden world)
Parameters:
	width (number): the length along the x-axis of the triangle that encloses the forest
	height (number): the length along the z-axis of the triangle that encloses the forest
*/ 
HiddenWorld.prototype.makeFaytiroy = function (width, height) {
	var frame = new THREE.Object3D();

	//create a curve that defines the border of the forest
	//this curve is not added to the frame in any way, it is just used to place the trees
	var borderPoints = [new THREE.Vector3(0, 0, 0),
												new THREE.Vector3(0.5*width + 2*hwTreeRadius, 0, -0.25*height),
												new THREE.Vector3(0.9*width + 2*hwTreeRadius, 0, -0.65*height),
												new THREE.Vector3(width, 0, -height)];
	var borderCurve = new THREE.CubicBezierCurve3(borderPoints[0], borderPoints[1], borderPoints[2], borderPoints[3]);

	//add a campfire
	var campfire = this.makeCampfire(0.3*width, 0.075*this.planeSize);
	campfire.scale.z = 0.75;
	campfire.position.set(0.00*width, 0.75*hwTreeRadius, -0.425*height);
	frame.add(campfire);

	//add a log behind the campfire
	//logFrame origin: center of the log (raised by the logRadius), extending along the + and - x axes
	var logFrame = new THREE.Object3D();
	var logRadius = 1.25*hwTreeRadius;
	var logLength = 0.4*width;
	var logGeom = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 32, 32);
	var logMat = createMaterial("dark_bark");
	var logMesh = new THREE.Mesh(logGeom, logMat);
	logMesh.position.y = logRadius;
	logMesh.rotateY(Math.PI);
	logMesh.rotateZ(Math.PI/2);
	logFrame.add(logMesh);
	logFrame.position.set(0.08*width + 0.5*logLength, 0, -0.525*height - 2*logRadius);
	logFrame.rotateY(degreesToRadians(-20));
	frame.add(logFrame);

	//add trees in a quad to the back of the forest
	addQuadTrees(frame, 10, -0.4*width, 0.85*width, -1.2*height, -0.9*height, false);

	//add trees in a quad to the back left of the forest
	addQuadTrees(frame, 6, -0.5*width, -0.2*width - 2*hwTreeRadius, -1.2*height, -0.3*height, false);

	//add trees along the border so it's actually apparent that the forest has a curved border
	addBorderTrees(frame, borderCurve, 6, false);

	return frame;
}

//origin: lower right corner of the triangular forest
//extends along the negative x and z axes
HiddenWorld.prototype.makeMeleth = function (width, height) {
	var frame = new THREE.Object3D();

	//add trees along the triangular border
	var borderCuve = new THREE.SplineCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-width, 0, -height)]);
	addBorderTrees(frame, borderCuve, 7, true);

	//points for placing the lake and log
	var markLeft = -0.3;
	var markRight = 0;
	var markFront = -0.6;
	var markBack = -0.7;

	//add a lake
	var lakeX = 0.5*width;
	var lakeZ = 0.25*height;
	var lakeY = 0.003*this.planeSize;
	this.lake = makeLake(lakeX, lakeZ, lakeY, "blue_coral1", 8, 8);
	this.lake.position.set(markLeft*width, 2*lakeY, markBack*height);
	this.lake.rotateY(degreesToRadians(35));
	frame.add(this.lake);

	var logFrame = new THREE.Object3D();
	var logRadius = 1.1*hwTreeRadius;
	var logLength = 0.8*lakeX;
	var logGeom = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 32, 32);
	var logMat = createMaterial("bark_paper");
	var logMesh = new THREE.Mesh(logGeom, logMat);
	logMesh.position.y = logRadius;
	logMesh.rotateY(Math.PI);
	logMesh.rotateZ(Math.PI/2);
	logFrame.add(logMesh);
	logFrame.position.set(this.lake.position.x + 0.2*logLength, 0, this.lake.position.z - 4*logRadius);
	logFrame.rotateY(degreesToRadians(40));
	frame.add(logFrame);

	//add trees in the quad behind the lake and log
	addQuadTrees(frame, 6, -0.9*width, 0.7*width, -1.2*height, logFrame.position.z - 2*hwTreeRadius - 2*logRadius, true);

	return frame;
}

/*
makeTrainingForest()
Purpose: returns an Object3D containing a river and several trees
	placed in the southwest corner of the hidden world
	origin: leftmost endpoint of the river (upper left corner of the forest)
Parameters:
	width (number): the length along the x-axis of the triangle that encloses the forest
	height (number): the length along the z-axis of the triangle that encloses the forest
	numPoints (integer): the number of points (oscillations) on the river
	oscillation (number): the magnitude of the river oscillation in the river's y-direction
	radius (number): the radius of the river
*/
HiddenWorld.prototype.makeTrainingForest = function (width, height, numPoints, oscillation, radius) {
	var frame = new THREE.Object3D();

	//River
	//find the length of the river from the given width and height
	var riverStart = new THREE.Vector3(0, 0, 0);
	var riverEnd = new THREE.Vector3(width, 0, height);
	var length = riverStart.distanceTo(riverEnd);

	//the river follows a straight line, while oscillating in the y-direction
	var straightLine = new THREE.SplineCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0)]);
	var curve = makeOscillatingCurve(straightLine, length, numPoints, oscillation);

	//make the tube geometry, material and mesh
	var geom = new THREE.TubeGeometry(curve, 32, radius, 32, false);
	var mat = textureMaterial("blue_coral1.jpg");
	this.river = new THREE.Mesh(geom, mat);

	//rotate the river so it lines up with the western and southern edges of the hidden world
	var angle = new THREE.Vector3(width, 0, 0).angleTo(riverEnd);
	this.river.rotateY(-angle);

	//rotate the river so it oscillates in the xz-plane instead of the xy-plane, and add it to the frame
	this.river.rotateX(Math.PI/2);
	frame.add(this.river);
	this.animateRiver = true;
	//End River

	//points for making the arrangement of archery/sword marks
	var markRight = 0.6;
	var markLeft = 0.2;
	var markFront = 1.0;
	var markBack = 0.8;

	//add the archery mark
	var archeryWidth = 0.3*width;
	var archeryHeight = 0.2*hwTreeHeight;
	archeryWidth = 0.2*archeryHeight;
	var archeryMark = makeArcheryMark(archeryHeight, archeryWidth, 0.15*archeryWidth, "red_wood");
	archeryMark.position.set(markLeft*width, 0.6*archeryHeight, markFront*height);
	archeryMark.rotateY(degreesToRadians(30));
	frame.add(archeryMark);

	//add the sword mark
	var swordMark = makeSwordMark(0.3*width, 0.03*width, 0.003*width);
	swordMark.position.set(markRight*width, 0, markBack*height);
	swordMark.rotateY(degreesToRadians(30));
	frame.add(swordMark);

	//add trees in the triangle behind the archery and sword marks
	addTriangleTrees(frame, 8, new THREE.Vector3(-0.3*this.planeSize + hwTreeRadius, 0, radius + hwTreeRadius + oscillation), 
														 new THREE.Vector3(0.75*width-radius-hwTreeRadius-oscillation, 0, height - 4*hwTreeRadius - (1-markBack)*height),
														 new THREE.Vector3(-0.3*this.planeSize + hwTreeRadius, 0, height - 4*hwTreeRadius - (1-markBack)*height));

	//add trees in the quad alongside the archery and sword marks
	addQuadTrees(frame, 10, -0.5*width, markLeft*width - 4*hwTreeRadius, 0, 2*height);

	return frame;
}

//origin: center of the tent arrangement
HiddenWorld.prototype.makeThotur = function () {
	var frame = new THREE.Object3D();

	var width = 0.25*this.planeSize;
	var height = 0.2*this.planeSize;

	this.tentRadius = 0.04*this.planeSize;
	this.tentHeight = 2.5*this.tentRadius;

	//add the leftmost tent
	var tent = makeTent(this.tentHeight, this.tentRadius, 7*Math.PI/4, "burlap");
	tent.position.set(-0.5*width, 0, 0);
	frame.add(tent);

	//add the rightmost tent
	var rightmostTent = tent.clone();
	rightmostTent.position.set(0.5*width, 0, 0);
	frame.add(rightmostTent);

	//add the back left tent
	var backLeftTent = tent.clone();
	backLeftTent.position.set(-0.25*width, 0, -0.5*height);
	frame.add(backLeftTent);

	//add the back right tent
	var backRightTent = tent.clone();
	backRightTent.position.set(0.25*width, 0, -0.5*height);
	frame.add(backRightTent);

	//add the front left tent
	var frontLeftTent = tent.clone();
	frontLeftTent.position.set(-0.2*width, 0, 0.5*height);
	frontLeftTent.rotateY(degreesToRadians(10));
	frame.add(frontLeftTent);

	//add the front right tent
	var frontRightTent = tent.clone();
	frontRightTent.position.set(0.2*width, 0, 0.5*height);
	frontRightTent.rotateY(degreesToRadians(-10));
	frame.add(frontRightTent);

	return frame;
}

HiddenWorld.prototype.makeCampfire = function (width, height) {
	var frame = new THREE.Object3D();

	var logRadius = 0.15*height;
	var logGeom = new THREE.CylinderGeometry(logRadius, logRadius, width, 32, 32);
	var logMat = createMaterial("dark_bark");

	var verticalLog = new THREE.Mesh(logGeom, logMat);
	verticalLog.rotateX(Math.PI/2);
	frame.add(verticalLog);

	var horizontalLog = verticalLog.clone();
	horizontalLog.rotateZ(Math.PI/2);
	frame.add(horizontalLog);

	var leftSlantLog = verticalLog.clone();
	leftSlantLog.rotateZ(-Math.PI/4);
	frame.add(leftSlantLog);

	var rightSlantLog = verticalLog.clone();
	rightSlantLog.rotateZ(Math.PI/4);
	frame.add(rightSlantLog);

	this.flames = [];

	var bigFlameWidth = 0.25*width;
	var flame = makeFlame(bigFlameWidth, height);
	frame.add(flame);

	this.flames.push(flame);

	var numLittleFlames = 8;
	var littleFlameWidth = 0.1*width;
	var theLittleFlame = makeFlame(littleFlameWidth, 0.6*height);
	theLittleFlame.position.set(0, 0, 0);
	frame.add(theLittleFlame);
	this.flames.push(theLittleFlame);

	for (var i = 1; i < numLittleFlames; i++) {
		var littleFlame = theLittleFlame.clone();
		var angle = i*2*Math.PI/numLittleFlames;
		var x = -0.8*bigFlameWidth*Math.cos(angle);
		var z = -0.8*bigFlameWidth*Math.sin(angle);
		littleFlame.position.set(x, 0, z);
		frame.add(littleFlame);
		this.flames.push(littleFlame);
	}

	return frame;
}

//origin: bottom center of the flame, extends along positive y-axis
function makeFlame (width, height) {
	//Bezier curve that defines the outline of the flame
	var curve = new THREE.CubicBezierCurve3(new THREE.Vector3(0.75*width, 0, 0),
																					new THREE.Vector3(1.0*width, 0, 0.3*height),
																					new THREE.Vector3(0.25*width, 0, 0.7*height),
																					new THREE.Vector3(0, 0, height));

	//get an array of points from the curve
	var points = [];
	for (var i = 0; i <= 1; i += 0.1) {
		points.push(curve.getPoint(i));
	}

  //the geometry - a lathe
  var geom = new THREE.LatheGeometry(points, 32);

  //the material
  var mat = createMaterial("fire");

  //the mesh
  var mesh = new THREE.Mesh(geom, mat);
  mesh.rotateX(-Math.PI/2);
  return mesh;
}

//origin: bottom left corner
//extends along the positive x- and y-axes
HiddenWorld.prototype.makeEntrance = function () {
	var frame = new THREE.Object3D();
	this.entranceWidth = 0.25*this.planeSize;
	this.entranceWidth = 0.4*this.planeSize;
	this.entranceHeight = 0.08*this.planeSize;
	var entrance = new THREE.Mesh(new THREE.PlaneGeometry(this.entranceWidth, this.entranceHeight), createMaterial("gray_wall"));
	entrance.material.map.repeat.x = 6;
	entrance.material.map.repeat.y = 2;
	entrance.position.set(0.5*this.entranceWidth, 0.5*this.entranceHeight, 0);
	entrance.rotateX(Math.PI);
	frame.add(entrance);
	return frame;
}

/*
addTriangleTrees()
Purpose: adds numTrees trees at random points within the triangle defined by a, b, and c
Parameters:
	frame (Object3D): the frame to add the trees to
	numTrees (integer): the number of trees to add
	a (Vector3): one point on the triangle to add the trees within
	b (Vector3): one point on the triangle to add the trees within
	c (Vector3): one point on the triangle to add the trees within
*/
function addTriangleTrees (frame, numTrees, a, b, c, isWillow) {
	var ultimateTree = isWillow? willowTree.clone() : hwTree.clone();
	var points = randomPointsInTriangle(a, b, c, numTrees);
	for (var i = 0; i < points.length; i++) {
		//clone the hwTree
		var tree = ultimateTree.clone();

		//scale the tree so the trees aren't all identical
		tree.scale.y = randomInRange(0.8, 1);
		var xzScale = randomInRange(0.8, 1);
		tree.scale.x = xzScale;
		tree.scale.z = xzScale;

		//position the tree within the triangle
		tree.position.copy(points[i]);
		frame.add(tree);
	}
}

/*
addBorderTrees()
Purpose: adds numBorderTrees trees to the border defined by the given borderCurve to the given frame
Parameters:
	frame (Object3D): the frame to add the trees to
	borderCurve (Curve): the curve the trees are placed along
	numBorderTrees (integer): the number of trees to add
*/
function addBorderTrees (frame, borderCurve, numBorderTrees, isWillow) {
	var ultimateTree = isWillow? willowTree.clone() : hwTree.clone();
	var curvePoints = borderCurve.getSpacedPoints(numBorderTrees + 1);
	for (var i = 1; i <= numBorderTrees; i++) {
		var tree = ultimateTree.clone();
		var point = curvePoints[i];
		tree.position.set(point.x, 0, point.z);
		tree.rotateY(Math.random()*2*Math.PI);
		frame.add(tree);
	}
}

/*
addQuadTrees()
Purpose: adds numInnerTrees trees to the given frame
	with x-coordinates in the range (minX, maxX)
	and z-coordinates in the range (minZ, maxz)
Parameters:
	frame (Object3D): the frame to add the trees to
	numInnerTrees (integer): the number of trees to add
	minX (number): the minimum x-coordinate of the quad to add the trees within
	maxX (number): the maximum x-coordinate of the quad to add the trees within
	minZ (number): the minimum z-coordinate of the quad to add the trees within
	maxZ (number): the maximum z-coordinate of the quad to add the trees within
*/
function addQuadTrees (frame, numInnerTrees, minX, maxX, minZ, maxZ, isWillow) {
	var ultimateTree = isWillow? willowTree.clone() : hwTree.clone();
	for (var j = 0; j < numInnerTrees; j++) {
		var innerTree = ultimateTree.clone();
		var treeX = randomInRange(minX, maxX);
		var treeZ = randomInRange(minZ, maxZ);
		innerTree.position.set(treeX, 0, treeZ);
		innerTree.rotateY(Math.random()*2*Math.PI);
		frame.add(innerTree);
	}
}

/*
makeHWTree()
Purpose: returns an Object3D containing a tree based on the tree from the map functions,
	but using many more branches and leaves
	origin: bottom center of the cylindrical trunk
	extends along the positive y-axis
Parameters:
	treeHeight (number): the height of the tree
	treeRadius (number): the radius of the cylindrical tree trunk
	treeImage (string): the image of the trunk
	branchImage (string): the image of each of the branches
	leafImage (string): the image of each of the leaves
*/
function makeHWTree (treeHeight, treeRadius, treeImage, branchImage, leafImage) {
	var treeFrame = new THREE.Object3D();

	//create and add the cylindrical trunk
  var trunkGeom = new THREE.CylinderGeometry(treeRadius, treeRadius, treeHeight, 64, 64);
  var trunkMat = createMaterial(treeImage);
  var trunkMesh = new THREE.Mesh(trunkGeom, trunkMat);
  trunkMesh.position.set(0, 0.5*treeHeight, 0);
  treeFrame.add(trunkMesh);
  treeFrame.add(trunkMesh);

  //branches
  var numBranches = Math.floor(Math.random()*5 + 7);
  var branchLength = (Math.random()*0.2 + 0.2)*treeHeight;
	var branchRadius = (Math.random()*0.2 + 0.4)*treeRadius;
	var branchCurvature = (Math.random()*0.2 + 0.2)*branchLength;
	var numLeaves = Math.floor(Math.random()*2 + 3);
  var theBranch = makeBranch(branchLength, branchRadius, branchCurvature, branchImage, numLeaves, leafImage, 0.3);
  for (var i = 0; i < numBranches; i++) {
  	//define randomized branch parameters and create the branch
  	var branchLength = (Math.random()*0.2 + 0.2)*treeHeight;
  	var branchRadius = (Math.random()*0.2 + 0.4)*treeRadius;
  	var branchCurvature = (Math.random()*0.2 + 0.2)*branchLength;
  	var numLeaves = Math.floor(Math.random()*2 + 3);
  	//var branch = makeBranch(branchLength, branchRadius, branchCurvature, branchImage, numLeaves, leafImage, 0.3);
  	var branch = theBranch.clone();

  	//position and rotate the branch along the cylindrical trunk
  	var branchHeight = (Math.random()*0.2 + 0.55)*treeHeight;
  	branch.position.set(0, branchHeight, 0);
  	branch.rotateY(Math.random()*2*Math.PI - 2*Math.PI);
  	branch.rotateZ(Math.random()*2*Math.PI - 2*Math.PI);
  	treeFrame.add(branch);
  }

	return treeFrame;
}

function makeWillowTree (treeHeight, treeRadius, treeImage, branchImage, leafImage) {
	var treeFrame = new THREE.Object3D();

	//create and add the cylindrical trunk
  var trunkGeom = new THREE.CylinderGeometry(treeRadius, treeRadius, treeHeight, 64, 64);
  var trunkMat = createMaterial(treeImage);
  var trunkMesh = new THREE.Mesh(trunkGeom, trunkMat);
  trunkMesh.position.set(0, 0.5*treeHeight, 0);
  treeFrame.add(trunkMesh);
  treeFrame.add(trunkMesh);

  //branches
  var numBranches = Math.floor(Math.random()*5 + 7);
  var branchLength = (Math.random()*0.2 + 0.2)*treeHeight;
	var branchRadius = (Math.random()*0.2 + 0.4)*treeRadius;
	var branchCurvature = (Math.random()*0.2 + 0.2)*branchLength;
	var numLeaves = Math.floor(Math.random()*2 + 3);
  var theBranch = makeBranch(branchLength, branchRadius, branchCurvature, branchImage, numLeaves, leafImage, 0.3);
  for (var i = 0; i < numBranches; i++) {
  	var branch = theBranch.clone();

  	//position and rotate the branch along the cylindrical trunk
  	var branchHeight = 0.9*treeHeight;
  	branch.position.set(0, branchHeight, 0);
  	branch.rotateY(Math.random()*2*Math.PI - 2*Math.PI);
  	branch.rotateX(Math.PI);
  	treeFrame.add(branch);
  }

	return treeFrame;
}

/*
makeHWHills()
Purpose: returns an Object3D containing three hills grouped together (hills taken from the map functions)
	origin: lower right corner of the hill group (aligns with the southeastern corner of the hidden world)
Parameters:
	height (number): the height of the leftmost hill (the other two hills are scaled from this height)
	radius (number): the radius of the bottom of each hill
	image (string): the image to texture-map
*/
function makeHWHills (height, radius, image) {
	var frame = new THREE.Object3D();

	var hillLeft = makeHill(height, radius, image, 0);
	var hillRight = hillLeft.clone();
	var hillBack = hillLeft.clone();

	hillRight.scale.y = 0.8;
	hillRight.position.set(0, 0, -radius);
	frame.add(hillRight);

	hillLeft.position.set(-radius, 0, -radius);
	frame.add(hillLeft);

	hillBack.scale.y = 1.2;
	hillBack.position.set(-0.5*radius, 0, -1.5*radius);
	frame.add(hillBack);

	return frame;
}

/*
makeTent()
Purpose: returns an Object3D containing a conical tent, with a cut out of the front 
		and a curved flap coming out of the opening
	origin: bottom center of the conical tent
	the tent extends along the positive y-axis, with the opening facing the positive z-axis
Parameters:
	height (number): the height of the tent
	radius (number): the radius of the bottom of the tent
	latheCut (number): the angle to sweep around the z-axis to create the tent
	image (string): the image to texture-map
*/
function makeTent (height, radius, latheCut, image) {
	var frame = new THREE.Object3D();

	//add the lathe tent - a cone with a triangle cut out of the front
	var lathePoints = [new THREE.Vector3(radius, 0, 0), new THREE.Vector3(0, 0, height)];
	var latheStart = 0.5*Math.PI + (2*Math.PI - 0.5*latheCut);
	var latheGeom = new THREE.LatheGeometry(lathePoints, 32, latheStart, latheCut);
	var tentMat = createMaterial(image);
	var latheMesh = new THREE.Mesh(latheGeom, tentMat);
	latheMesh.rotateX(-Math.PI/2);
	frame.add(latheMesh);

	//add the Bezier "flap"
	//a roughly "triangular" shape that oscillates in the z-direction according to flapCurvature
	var flapCurvature = 1.25*radius;
	var flapHeight = lathePoints[0].distanceTo(lathePoints[1]);
	var flapWidth = 0.25*flapHeight;
	var flapPoints = [
		//bottom row
		[[0, 0, 0],
		 [0.25*flapWidth, 0, 0.75*flapCurvature],
		 [0.85*flapWidth, 0, -0.75*flapCurvature],
		 [flapWidth, 0, 0]],
		//second from bottom row
		[[0, 0.25*flapHeight, 0],
		 [0.25*flapWidth, 0.25*flapHeight, 1.25*flapCurvature],
		 [0.75*flapWidth, 0.25*flapHeight, -1.25*flapCurvature],
		 [0.75*flapWidth, 0.25*flapHeight, 0]],
		//second from top row
		[[0, 0.75*flapHeight, 0],
		 [0.25*flapWidth, 0.75*flapHeight, flapCurvature],
		 [0.75*flapWidth, 0.75*flapHeight, -flapCurvature],
		 [0.15*flapWidth, 0.75*flapHeight, 0]],
		//top row
		[[0, flapHeight, 0],
		 [0, flapHeight, 0],
		 [0, flapHeight, 0],
		 [0, flapHeight, 0]]
	];
	var flapGeom = new THREE.BezierSurfaceGeometry(flapPoints, 10, 10);
	var flapMesh = new THREE.Mesh(flapGeom, tentMat);

	//position the flap at the right side of the tent opening
	flapMesh.position.set(radius*Math.cos(latheStart), 0, -radius*Math.sin(latheStart));

	//rotate the flap so it aligns with the right edge of the tent opening
	flapMesh.rotation.x = -Math.atan(flapMesh.position.z/height);
	flapMesh.rotation.z = Math.atan(flapMesh.position.x/height);
	frame.add(flapMesh);

	return frame;
}

/*
makeLake()
Purpose: returns an Object3D containing a rippled lake enclosed by a rectangle of width*height, 
	with the coordinates bounded between two sine curves
	the rectangle lies in the xz-plane, with lake oscillations in the y-direction
	origin: upper left corner of the rectangle that encloses the lake (width*height)
Parameters:
	width (number): the width of the bounding rectangle
	height (number): the height of the bounding rectangle
	yCurvature (number): the curvature of the lake in the y-direction (controls the magnitude of each oscillation)
	image (string): the image to texture-map
	xRipples (integer): the number of ripples in the x-direction
	zRipples (integer): the number of ripples in the z-direction
*/
function makeLake (width, height, yCurvature, image, xRipples, zRipples) {
	var frame = new THREE.Object3D();

	//define a curve that gives the zRange for each value of u in the radialWave functions
	//var zCurve = new THREE.EllipseCurve(0, 0, 0.25*width, height, Math.PI, 0, true);
	var zCurve = new THREE.CubicBezierCurve3(new THREE.Vector3(0, 0, 0),
																						new THREE.Vector3(0, height, 0),
																						new THREE.Vector3(width, height, 0),
																						new THREE.Vector3(width, 0, 0));

	//define the function that creates the vectors on the lake surface
  radialWave = function (u, v) {
  	//x and z both lie within a width*height rectangle
    var x = u*width;
    var z = v*height;

    //adjust the z-coordinate so it is bounded by two sine curves, offset by 0.5*height
    //var zRange = Math.sin(u*Math.PI)*height/2;
    var zRange = zCurve.getPointAt(u).y;
    var zMin = 0.5*height - zRange;
    var zMax = 0.5*height + zRange;
    if (z < zMin) {
    	z = zMin;
    }
    if (z > zMax) {
    	z = zMax;
    }

    //adjust the x-coordinate to help avoid the points on either side of the lake
    var minX = 0.04*width;
    var maxX = 0.96*width;
    if (x < minX) {
    	x += 0.5*minX;
    }
    if (x > maxX) {
    	x -= 0.5*(width - maxX);
    }

    //create the "ripples" in the lake by making y a sinusoidal combination of u and v, scaled by yCurvature
    var y = (Math.sin(u * xRipples * Math.PI) + Math.cos(v * zRipples * Math.PI)) * yCurvature;

    var result = new THREE.Vector3(x, y, z);
		return result;
 	}

 	//create the geometry, material and mesh
  var lakeGeom = new THREE.ParametricGeometry(radialWave, 100, 100, false);
  var lakeMat = createMaterial(image);
  var lakeMesh = new THREE.Mesh(lakeGeom, lakeMat);
  frame.add(lakeMesh);

  return lakeMesh;
}

/*
makeStable()
Purpose: returns an Object3D containing a box-shaped stable
	origin: center of the bottom of the stable
Parameters:
	width (number): the width of the stable
	height (number): the height of the stable
	depth (number): the depth of the stable
	image (string): the image to use for the texture-mapped material
*/
function makeStable (width, height, depth, image) {
	var frame = new THREE.Object3D();

	var stableGeom = new THREE.BoxGeometry(width, height, depth, 32, 32, 32);
	var stableMat = createMaterial(image);
	var stableMesh = new THREE.Mesh(stableGeom, stableMat);
	stableMesh.position.set(0, 0.5*depth, 0);
	frame.add(stableMesh);

	return frame;
}

/*
makeArcheryMark()
Purpose: returns an Object3D containing a rotated bow and arrow
	origin: center of the bowstring
Parameters (see archery_objects.js for more detail):
	bowHeight (number): the height of the bow
	bowWidth (number): the width of the bow
	bowRadius (number): the maximum radius of the bow
	bowImage (string): the image to texture-map onto the bow
*/
function makeArcheryMark (bowHeight, bowWidth, bowRadius, bowImage) {
	var frame = new THREE.Object3D();

	var bow = new Bow(bowHeight, bowWidth, bowRadius, bowImage, false);
	bow.frame.rotateY(-Math.PI/2);
	frame.add(bow.frame);

	return frame;
}

/*
makeSwordMark()
Purpose: returns an Object3D containing two crossed swords
	origin: center of the ground underneath where the two swords cross
Parameters (see sword_objects.js for more detail):
	swordLength (number): the length of each sword
	swordWidth (number): the width of each sword
	swordThickness (number): the thickness of each sword
*/
function makeSwordMark (swordLength, swordWidth, swordThickness) {
	var frame = new THREE.Object3D();

	//the hilt is to the right of the tip
	var sword1 = new THREE.Object3D();
	var sword = new Sword(swordLength, swordWidth, swordThickness, 0xFFD700, 1);
	sword.frame.position.set(0, sword.bladeLength, 0);
	sword.frame.rotateX(Math.PI);
	sword1.add(sword.frame);

	//the hilt is to the left of the tip
	var sword2 = sword1.clone();

	sword1.rotateZ(-Math.PI/6);
	sword2.rotateZ(Math.PI/6);

	sword1.position.set(-0.25*swordLength, 0, swordThickness);
	frame.add(sword1);

	sword2.position.set(0.25*swordLength, 0, 0);
	frame.add(sword2);

	return frame;
}

/*
origin: bottom left corner of the meadow surface
  offset by curvature in the z-direction
  extends along the positive x- and y-axes
*/
function makeHWMeadow (width, height, curvature, image) {
  var meadowFrame = new THREE.Object3D();

  //define the control points for the Bezier surface
  var bottomRow = [[0, 0, 0], 
                    [0.2*width, 0.1*height, 2*curvature],
                    [0.8*width, -0.1*height, -2*curvature],
                    [width, 0, 0]];
  var secondFromBottom = [[0.1*width, 0.2*height, 0],
                          [0.2*width, 0.2*height, 2*curvature],
                          [0.8*width, 0.2*height, curvature],
                          [0.8*width, 0.8*height, 0]];
  var secondFromTop = [[0.1*width, 0.8*height, 0],
                        [0.2*width, 0.8*height, curvature],
                        [0.7*width, 0.8*height, curvature],
                        [0.8*width, 0.8*height, 0]];
  var topRow = [[0, height, 0],
                [0.2*width, 0.9*height, curvature],
                [0.7*width, 0.9*height, 0],
                [width, height, 0]];
  var points = [bottomRow, secondFromBottom, secondFromTop, topRow];

  //create the geometry, material, and mesh
  var geom = new THREE.BezierSurfaceGeometry(points, 10, 10);
  var mat = createMaterial(image);
  var mesh = new THREE.Mesh(geom, mat);

  //offset the mesh by curvature in the z-direction
  mesh.position.set(0, 0, curvature);
  meadowFrame.add(mesh);

  return meadowFrame;
}
