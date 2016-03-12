/*
Katherine Kjeer
CS 307 Final Project: Journey to the Seven Kingdoms
December 19, 2014
sword_objects.js
Contains the modeling, animation, and logic for the game of sword training, 
	using an object-oriented SwordCenter and Swords.
*/

var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

//the time it takes a sword to make a move
var SWORD_MOVE_TIME = mobile ? 800 : 700;
var MIN_SWORD_MOVE_TIME = mobile ? 600 : 400;

//the delay between a correct student move and the next teacher move
var TIME_BETWEEN_MOVES = mobile ? 600 : 400;
var MIN_TIME_BETWEEN_MOVES = mobile ? 400 : 300;

//to decrement the above two times every time the student makes a correct move
var DELTA_T = 30;

//the time to wait before giving up on the student making a correct move
var DELAY = mobile ? 4000 : 3000;
//var DELAY = 200000000000;

//the directions the teacherSword can choose from
var DIRECTIONS = ['up', 'down', 'left', 'right', 'cross', 'attack', 'parry'];

//the fractions of the blade length at which the sword should move for each move direction (up, down, etc.)
var BLADE_FRACTIONS = {'up': 0.8, 'down': 0.8, 'left': 0.6, 'right': 0.6, 'cross': 0.4, 'attack': 0.4, 'parry': 0.5};

//the offsets in the x and z directions for each direction (up, down, etc.)
var X_OFFSETS = {'up': 0.25, 'down': 0.22, 'left': 0.27, 'right': -0.22, 'cross': 0.25, 'attack': 0, 'parry': 0.5};
var Z_OFFSETS = {'up': 0.25, 'down': 0.25, 'left': 0.15, 'right': 0.2, 'cross': 0.25, 'attack': 0.15, 'parry': 0};

var characterLevels = {0: 'Riv\'an', 10: 'Lanäo', 20: 'Mesdel', 30: 'Aléo', 40: 'Xelai', 50: 'Aregae'};

//******//
//SwordCenter//
//*******//

/*
SwordCenter()
Purpose: constructs a new SwordCenter object used to control the sword training
Parameters:
	boxSize (number): the size of the cube that encompasses the SwordCenter's frame
	teacherSword (Sword): the Sword that performs randomly chosen moves
	studentSword (Sword): the Sword that the user controls
	teacherPosFrac (Vector3): contains the position of the teacherSword proportional to boxSize
	studentPosFrac (Vector3): contains the position of the studentSword proportional to boxSize
	swordRotation (Vector3): the absolute rotation of the swords (the teacherSword is flipped about the x and z axes)
	movePoints (object): contains Vector3's proportional to boxSize that tell where the Swords should move to for each position
*/
function SwordCenter (boxSize, teacherSword, studentSword, teacherPosFrac, studentPosFrac, swordRotation, movePoints) {
	this.size = boxSize;
	this.teacherSword = teacherSword;
	this.studentSword = studentSword;
	this.teacherPos = teacherPosFrac.multiplyScalar(this.size);
	this.studentPos = studentPosFrac.multiplyScalar(this.size);
	this.teacherRotation = new THREE.Vector3(-swordRotation.x, swordRotation.y, -swordRotation.z);
	this.studentRotation = swordRotation;

	//the points to move the swords to for each move
	this.upPoint = movePoints.up.multiplyScalar(this.size);
	this.downPoint = movePoints.down.multiplyScalar(this.size);
	this.leftPoint = movePoints.left.multiplyScalar(this.size);
	this.rightPoint = movePoints.right.multiplyScalar(this.size);
	this.crossPoint = movePoints.cross.multiplyScalar(this.size);
	this.parryPoint = movePoints.parry.multiplyScalar(this.size);
	this.movePoints = {'up': this.upPoint, 'down': this.downPoint, 'left': this.leftPoint, 'right': this.rightPoint, 
										'cross': this.crossPoint, 'attack': this.parryPoint, 'parry': this.parryPoint};

	//for keeping track of correct/incorrect student moves
	this.isCorrect = false;
	this.correctMoves = 0;

	//controls what keys the user can press at a given time
	this.canPressSpace = true;
	this.canPlayDemos = true;

	//the sword times
	this.swordMoveTime = SWORD_MOVE_TIME;
	this.timeBetweenMoves = TIME_BETWEEN_MOVES;

	var frame = new THREE.Object3D();

	//add the surrounding box
	var box = makeBox(boxSize, "beach_sky.png", "beach_wall.png", "beach_ground.png");
	box.position.set(0, 0.5*boxSize, 0);
	frame.add(box);

	//add the teacherSword
	this.teacherSword.frame.position.copy(this.teacherPos);
	this.teacherSword.frame.rotation.set(this.teacherRotation.x, this.teacherRotation.y, this.teacherRotation.z);
	frame.add(this.teacherSword.frame);

	//add the studentSword
	this.studentSword.frame.position.copy(this.studentPos);
	this.studentSword.frame.rotation.set(this.studentRotation.x, this.studentRotation.y, this.studentRotation.z);
	frame.add(this.studentSword.frame);

	this.frame = frame;

	this.currentStudentDirection = 'right';
}

/*
SwordCenter.prototype.playDemos()
Purpose: animates both the teacherSword and studentSword to each position
	to animate a full demo of the sword moves for the user
*/
SwordCenter.prototype.playDemos = function () {
	//reset the SwordCenter so the demo starts with a "clean slate"
	this.reset();

	//so the user can't try to restart the demos or start the training while the demos are playing
	this.canPlayDemos = false;
	this.canPressSpace = false;

	//demo the teacherSword and studentSword simultaneously
	this.demoSword(this.teacherSword, 'attackFirst');
	this.demoSword(this.studentSword, 'parryFirst');

	$('.mybtn').prop('disabled', true);
}

/*
SwordCenter.prototype.demoSword()
Purpose: animates the given sword to each of the build-in positions (up, down, etc.) sequentially
	used to show the demo of each sword move to the user
Parameters:
	sword (Sword): the sword to animate
	order (string): whether to animate the attack or parry position first 
		(depending on whether the teacher or student sword is being animated)
*/
SwordCenter.prototype.demoSword = function (sword, order) {
	var center = this;
	var delayTime = 2000;
	var demoTime = 700;
	
	//demo the up move
	$('#top-instructions').html('Move: up');
	sword.move(center.upPoint, 'up', demoTime, 0);
	sword.moveTween.onComplete(function () {

		//demo the down move
		setTimeout(function () {
			$('#top-instructions').html('Move: down');
		}, delayTime);
		sword.move(center.downPoint, 'down', demoTime, delayTime);
		sword.moveTween.onComplete(function () {

			//demo the left move
			setTimeout(function () {
				$('#top-instructions').html('Move: left');
			}, delayTime);
			sword.move(center.leftPoint, 'left', demoTime, delayTime);
			sword.moveTween.onComplete(function () {

				//demo the right move
				setTimeout(function (){
					$('#top-instructions').html('Move: right');
				}, delayTime);
				sword.move(center.rightPoint, 'right', demoTime, delayTime);
				sword.moveTween.onComplete(function () {

					//demo the cross move
					setTimeout(function () {
						$('#top-instructions').html('Move: cross');
					}, delayTime);
					sword.move(center.crossPoint, 'cross', demoTime, delayTime);
					sword.moveTween.onComplete(function () {

						//if the order is attackFirst, the teacherSword is being demoed, so don't change the top instructions
						if (order == 'attackFirst') {

							//demo the attack move
							sword.move(center.parryPoint, 'attack', demoTime, delayTime);
							sword.moveTween.onComplete(function () {

								//demo the parry move
								sword.move(center.parryPoint, 'parry', demoTime, delayTime);
								sword.moveTween.onComplete(function () {

									//demos are done - reset the training center
									setTimeout(function () {
										$('#top-instructions').html('Press the buttons to replay the demonstration or start training.');
										center.reset();
									}, delayTime);
								});
							});
						} else {
							//demo the parry move
							setTimeout(function () {
								$('#top-instructions').html('Move: parry');
							}, delayTime);
							sword.move(center.parryPoint, 'parry', demoTime, delayTime);
							sword.moveTween.onComplete(function () {

								//demo the attack move
								setTimeout(function () {
									$('#top-instructions').html('Move: attack');
								}, delayTime);
								sword.move(center.parryPoint, 'attack', demoTime, delayTime);
								sword.moveTween.onComplete(function () {

									//demos are done - reset the training center
									setTimeout(function () {
										$('#top-instructions').html('Press the buttons to replay the demonstration or start training.');
										center.reset();
									}, delayTime);
								});
							});
						}
					});
				});
			});
		});
	});
}

/*
SwordCenter.prototype.teacherMove()
Purpose: moves the SwordCenter's teacherSword in a randomly chosen direction (up, down, etc.)
	terminates the training session if the user fails to choose a move within DELAY milliseconds
*/
SwordCenter.prototype.teacherMove = function () {
	$('.mybtn').prop('disabled', true);

	var center = this;
	center.isCorrect = false;

	//randomly choose the direction the teacherSword should move in
	var teacherDirection = DIRECTIONS[Math.floor(Math.random()*DIRECTIONS.length)];

	//ensure the teacherSword doesn't move in the same direction twice in a row
	while (teacherDirection == center.teacherDirection) {
		teacherDirection = DIRECTIONS[Math.floor(Math.random()*DIRECTIONS.length)];
	}

	//update the correctDirection and teacherDirection of the center
	center.correctDirection = teacherDirection;
	if (teacherDirection == 'attack') {
		center.correctDirection = 'parry';
	} else if (teacherDirection == 'parry') {
		center.correctDirection = 'attack';
	}
	center.teacherDirection = teacherDirection;

	//move the teacherSword
	center.teacherSword.move(this.movePoints[teacherDirection], teacherDirection, center.swordMoveTime, 0);

	//if the user doesn't respond within DELAY milliseconds, end the training session
	center.teacherSword.giveUpTween = new TWEEN.Tween(center.teacherSword.frame.position).to(center.teacherPos, 0.5*center.swordMoveTime);
	center.teacherSword.giveUpTween.delay(DELAY).onStart(function () {
		//if the user gave a correct move, stop the giveUpTween
		if (center.isCorrect == true) {
			center.teacherSword.giveUpTween.stop();
		}
	}).onComplete(function () {
		//if the user failed to move, end the training session
		setTimeout(function () {
			$('#top-instructions').html('Sorry, too late! The correct move was ' + center.correctDirection + 
																	'.<br>You got ' + center.correctMoves + ' correct. ' + //Your character level is ' + center.findCharacterLevel() + '.' + 
																	'<br>Press the buttons to replay or return to the Hidden World.');
			center.reset();
		}, 1000);
	});
	center.teacherSword.moveTween.chain(center.teacherSword.giveUpTween);
}

/*
SwordCenter.prototype.studentMove()
Purpose: moves the SwordCenter's studentSword in the given direction
	in response to the user's key press
	Determines whether the user chose the correct move, and acts accordingly
Parameters:
	direction (string): the direction to move in (up, down, parry, etc.)
*/
SwordCenter.prototype.studentMove = function (direction) {
	//if the studentSword isn't supposed to be controlled by the user (e.g. the demos are currently playing), don't do anything
	if (!this.studentSword.canMove) {
		return;
	}

	this.currentStudentDirection = direction;

	//needed for scoping when using TWEEN
	var center = this;

	//stop the teacherSword so its giveUpTween doesn't run
	center.teacherSword.moveTween.stop();

	//move the studentSword in the specified direction
	center.studentSword.move(center.movePoints[direction], direction, center.swordMoveTime, 0);
	center.studentSword.canMove = false;

	//after the studentSword is done moving, check whether the move is correct and respond accordingly
	center.studentSword.moveTween.onComplete(function () {
		if (direction == center.correctDirection) {
			//one more correct move
			center.correctMoves++;
			$('#top-instructions').html('Correct Moves: ' + center.correctMoves);
			center.isCorrect = true;

			//decrease the sword times (down to their minimum values)
			if (center.swordMoveTime + DELTA_T >= MIN_SWORD_MOVE_TIME) {
				center.swordMoveTime -= DELTA_T;
			}
			if (center.timeBetweenMoves + DELTA_T >= MIN_TIME_BETWEEN_MOVES) {
				center.timeBetweenMoves -= DELTA_T;
			}

			//make another teacher move (after center.timeBetweenMoves)
			setTimeout(function () {
				center.studentSword.canMove = true;
				center.teacherMove();
			}, center.timeBetweenMoves);

		} else {
			//incorrect move, so end the training session, after a second's delay
			$('#top-instructions').html('Sorry, incorrect. You chose ' + direction + ' and the correct move was ' + center.correctDirection +
																		 '.<br>You got ' + center.correctMoves + ' correct. ' + //Your character level is ' + center.findCharacterLevel() + '.' +  
																'<br>Press the buttons to replay or return to the Hidden World.');
			setTimeout(function () {
				center.reset();
			}, 1000);
		}
	});
}

SwordCenter.prototype.findCharacterLevel = function () {
	var keys = [];
	for (var key in characterLevels) {
		keys.push(key);
	}
	for (var i = 0; i < keys.length - 1; i++) {
		if (this.correctMoves >= keys[i] && this.correctMoves < keys[i + 1]) {
			return characterLevels[keys[i]];
		}
	}
	return characterLevels[keys[keys.length - 1]];
}

/*
SwordCenter.prototype.reset()
Purpose: resets the SwordCenter to its original state so the user can restart the training session
*/
SwordCenter.prototype.reset = function () {
	//the student sword is now in the 'right' position
	this.currentStudentDirection = 'right';
	
	//now the user can press the space bar to restart the training
	this.canPressSpace = true;

	//now the user can play the demos
	this.canPlayDemos = true;

	//reset the correctness - the student now has 0 correct moves
	this.correctMoves = 0;
	this.isCorrect = false;

	//stop any moving swords
	if (this.teacherSword.moveTween) {
		this.teacherSword.moveTween.stop();
	}
	if (this.studentSword.moveTween) {
		this.studentSword.moveTween.stop();
	}

	//reset the sword times
	this.swordMoveTime = SWORD_MOVE_TIME;
	this.timeBetweenMoves = TIME_BETWEEN_MOVES;

	//reset the teacherSword's position and rotation
	this.teacherSword.frame.position.copy(this.teacherPos);
	this.teacherSword.frame.rotation.set(this.teacherRotation.x, this.teacherRotation.y, this.teacherRotation.z);

	//reset the studentSword's position and rotation
	this.studentSword.frame.position.copy(this.studentPos);
	this.studentSword.frame.rotation.set(this.studentRotation.x, this.studentRotation.y, this.studentRotation.z);

	$('.mybtn').prop('disabled', false);
	//swordButtons();
}

//******//
//End SwordCenter//
//*******//

//******//
//Sword//
//*******//

/*
Sword()
Purpose: creates a new Sword object
	frame origin: the center of the base of the blade (where the blade meets the hilt)
	blade extends up the positive y-axis, hilt extends down the negative y-axis
Parameters:
	length (number): the total length of the sword, from the tip to the top of the hilt
	width (number): the width of the base of the blade
	thickness (number): the thickness of the sword, in the yz-plane
	sign (1 for a student sword or -1 for a teacher sword): dictates which way the sword moves
*/
function Sword (length, width, thickness, gripColor, sign) {
	//properties taken directly from the parameters
	this.length = length;
	this.width = width;
	this.thickness = thickness;
	this.sign = sign;

	//properties that control the hilt, computed from the parameters
	this.hiltLength = 0.3*this.length;
	this.sideHiltLength = 0.25*this.length;
	this.sideHiltRadius = 0.2*this.width;

	//create environment-mapped materials
	var cubeMap = createCubeMap("silver3", "silver3", "silver3");
	this.hiltMat = new THREE.MeshPhongMaterial({color: 0xbdbdbd, ambient: 0xbdbdbd,
                                              specular: 0xffffff, shininess: 100, 
                                              side: THREE.DoubleSide, envMap: cubeMap});
	this.gripMat = new THREE.MeshPhongMaterial({color: gripColor, ambient: gripColor,
                                              specular: 0xffffff, shininess: 100, 
                                              side: THREE.DoubleSide, envMap: cubeMap});

	//properties that control the blade, computed from the parameters
	//the length of the blade, computed from the total length
	this.bladeLength = this.length - this.hiltLength;
	this.bladeMat = new THREE.MeshPhongMaterial({color: 0xcfcfcf, ambient: 0xcfcfcf,
                                              specular: 0xffffff, shininess: 100, 
                                              side: THREE.DoubleSide, envMap: cubeMap});

	//properties that control the helical wrapping around the grip portion of the hilt
	this.helixSpacing = 6;
	this.helixThickness = 0.02*this.sideHiltLength;
	this.helixColor = 0x000000;

	//initially, the sword can't move (the user needs to press the space bar first)
	this.canMove = false;

	this.frame = new THREE.Object3D();

	//make and add the hilt
	this.hilt = this.makeHilt();
	this.frame.add(this.hilt);

	//make and add the blade
	this.blade = this.makeBlade();
	this.frame.add(this.blade);

	//scale the frame so it matches the given thickness
	this.frame.scale.z = this.thickness/this.sideHiltRadius;
}

/*
Sword.prototype.makeHilt()
Purpose: returns an Object3D containing the hilt of the Sword
	origin: center of the hilt (where it would meet the blade)
	the top prong extends along the negative y-axis
*/
Sword.prototype.makeHilt = function () {
	var hiltFrame = new THREE.Object3D();

	//create and add the two prongs that stick out on the left and right sides
	var leftProng = this.makeHiltProng(this.sideHiltLength, this.sideHiltRadius);
	var rightProng = leftProng.clone();

	//left prong
	leftProng.rotateZ(Math.PI/2);
	hiltFrame.add(leftProng);

	//right prong
	rightProng.rotateZ(-Math.PI/2);
	hiltFrame.add(rightProng);

	//make the grip portion
	//grip frame origin: bottom of the cylinder, extends along the positive y-axis (makes it easier to place the helix)
	var gripFrame = new THREE.Object3D();
	this.gripWidth = 0.9*this.width;
	this.gripLength = 0.5*this.hiltLength;
	var gripGeom = new THREE.CylinderGeometry(0.5*this.gripWidth, 0.5*this.gripWidth, this.gripLength, 16, 16);
	var gripMesh = new THREE.Mesh(gripGeom, this.gripMat);
	gripMesh.position.set(0, 0.5*this.gripLength, 0);
	gripMesh.rotateY(Math.PI);
	gripFrame.add(gripMesh);

	//add the helical wrap to the grip
	var helixPoints = [];
  for (var i = 0; i <= this.gripLength/this.helixSpacing; i++) {
    helixPoints.push(new THREE.Vector3((0.5*this.gripWidth + this.helixThickness)*Math.cos(i), 
    																		this.helixSpacing*i, 
    																		(0.5*this.gripWidth + this.helixThickness)*Math.sin(i)));
  }
  var helix = this.makeHelixMesh(helixPoints);
  gripFrame.add(helix);

  //position the grip so it extends along the negative y-axis
  gripFrame.position.set(0, -this.gripLength, 0);
	hiltFrame.add(gripFrame);

	//add the top prong - extends along the negative y-axis of the hiltFrame
	this.topProngLength = this.hiltLength - this.gripLength;
	this.topProngRadius = 0.5*this.gripWidth;
	var topProng = this.makeHiltProng(this.topProngLength, this.topProngRadius);
	topProng.position.set(0, gripFrame.position.y, 0);
	topProng.rotateX(Math.PI);
	hiltFrame.add(topProng);

	return hiltFrame;
}

/*
Sword.prototype.makeHiltProng()
Purpose: returns an Object3D containing one "prong" used to make a hilt
	origin: bottom center of the prong
	extends along the positive y-axis
	contains a semi-cylindrial portion and a curved top "lid"
Parameters:
	length (number): the total length of the prong, including the lid
	radius (number): the radius at the bottom of the prong
*/
Sword.prototype.makeHiltProng = function (length, radius) {
	var prongFrame = new THREE.Object3D();

	//define a Bezier curve for the semi-cylindrically-based part of the prong
	var topRadius = 3*radius;
	var prongHeight = 0.7*length;
	var prongCurve = new THREE.CubicBezierCurve3(new THREE.Vector3(radius, 0, 0),
																							 new THREE.Vector3(0.9*radius, 0, 0.8*prongHeight),
																							 new THREE.Vector3(0.8*topRadius, 0, 0.9*prongHeight),
																							 new THREE.Vector3(topRadius, 0, prongHeight));

	//define a Bezier curve for the curved top "lid" of the prong
	var topHeight = length - prongHeight;
	var topCurve = new THREE.CubicBezierCurve3(new THREE.Vector3(topRadius, 0, prongHeight),
																							 new THREE.Vector3(topRadius, 0, 0.25*topHeight + prongHeight),
																							 new THREE.Vector3(0.25*topRadius, 0, length),
																							 new THREE.Vector3(0, 0, length)); 

	//create a lathe geometry and mesh from the concatenation of both Bezier curves
	var points = prongCurve.getPoints(10).concat(topCurve.getPoints(10));
	var prongGeom = new THREE.LatheGeometry(points, 32);
	var prongMesh = new THREE.Mesh(prongGeom, this.hiltMat);

	//rotate and add the mesh to the prongFrame
	prongMesh.rotateX(-Math.PI/2);
	prongFrame.add(prongMesh);

	return prongFrame;
}

/*
Sword.prototype.makeHelixMesh()
Purpose: returns a helical tube mesh
	used to wrap the grip portion of the Sword's hilt
	origin: bottom point of the helix
Parameters:
	points: array of THREE.Vector3's used to create the helix
*/
Sword.prototype.makeHelixMesh = function (points) {
	var spiralGeom = new THREE.TubeGeometry(new THREE.SplineCurve3(points), 64, this.helixThickness, 16, false);
  var spiralMat = new THREE.MeshPhongMaterial({color: this.helixColor, ambient: this.helixColor,
                                              specular: 0xffffff, shininess: 100});
  var spiral = new THREE.Mesh(spiralGeom, spiralMat);
  return spiral;
}

/*
Sword.prototype.makeBlade()
Purpose: returns an Object3D containing a model of a blade
	frame origin: center of the base of the blade (where it attaches to the hilt)
	blade extends along the positive y-axis
*/
Sword.prototype.makeBlade = function () {
	var bladeFrame = new THREE.Object3D();

	//define a Bezier curve for the blade
	this.bladeRadius = 0.5*this.width;
	this.bladeCurve = new THREE.CubicBezierCurve3(new THREE.Vector3(this.bladeRadius, 0, 0),
																							 new THREE.Vector3(0.8*this.bladeRadius, 0, 0.8*this.bladeLength),
																							 new THREE.Vector3(0.9*this.bladeRadius, 0, 0.9*this.bladeLength),
																							 new THREE.Vector3(0, 0, this.bladeLength));
	var bladePoints = this.bladeCurve.getPoints(10);

	//create the blade from a LatheGeometry using the Bezier points
	var bladeGeom = new THREE.LatheGeometry(bladePoints, 6);
	var bladeMesh = new THREE.Mesh(bladeGeom, this.bladeMat);

	//scale, rotate and add the bladeMesh to the bladeFrame
	bladeMesh.scale.y = this.sideHiltRadius/this.width;
	bladeMesh.rotateX(-Math.PI/2);
	bladeFrame.add(bladeMesh);

	return bladeFrame;
}

/*
Sword.prototype.move()
Purpose: moves the Sword's frame to the given point, rotating along the way
Parameters:
	point: the point to move to
	direction: the type of move being made (up, down, left, right, etc.)
	swordTime: the time taken to move the sword
	delayTime (optional): the time to wait before starting to move
*/
Sword.prototype.move = function (point, direction, swordTime, delayTime) {
	if (delayTime == undefined) {
		delayTime = 0;
	}

	//offset the blade point in the x-direction so the student and teacher swords don't intersect
	//(at least when they stop moving; they may intersect while they're moving)
	var bladeFrac = BLADE_FRACTIONS[direction];
	var width = this.bladeCurve.getPoint(bladeFrac).x;
	var height = 0;
	if (direction == 'attack') {
		width = 0;
		height = this.bladeCurve.getPoint(bladeFrac).x + this.thickness;
	}
	var newPoint = new THREE.Vector3(point.x - this.sign*width, point.y - this.sign*height, point.z);

	var sword = this;

	//the point on the sword's blade that should be at the given point by the end of the move
	var swordPoint = new THREE.Vector3(0, bladeFrac*sword.bladeLength, 0);

	//offset the sword so the swordPoint ends up in the right place
	var xDistance = X_OFFSETS[direction]*sword.bladeLength;
	var zDistance = Z_OFFSETS[direction]*sword.bladeLength;

	//figure out the yDistance using trig:

	//get the diagonal from the sword's desired origin point to the point below newPoint
	var alpha = Math.atan(xDistance/zDistance);

	//if the xDistance is 0, alpha will be NaN, so recalculate alpha using a very small xDistance
	if (xDistance == 0) {
		alpha = Math.atan(0.000001/zDistance);
	}
	var diag = xDistance/Math.sin(alpha);

	//get the yDistance
	var theta = Math.acos(diag/swordPoint.y);
	yDistance = swordPoint.y*Math.sin(theta);

	//determine whether the blade should be above or below the hilt based on the direction
	var ySign = direction == 'down' ? 1: -1;

	//the position to move the sword hilt center to the blade point ends up at the given point
	var finalPos = {x: newPoint.x + this.sign*xDistance, y: newPoint.y + ySign*yDistance, z: newPoint.z + this.sign*zDistance};

	//to rotate the sword as it moves:
	//determine the rotation based on the this.sign and direction
	var zRotOffset = direction == 'down' ? this.sign*Math.PI : 0;
	var xRotSign = direction == 'down' ? 1 : -1;
	var zRotSign = direction == 'down' ? -1 : 1;

	//determine the final rotation of the sword so the swordPoint ends up in the right spot
	var finalRotation = {x: xRotSign*Math.atan(finalPos.z/swordPoint.y), 
											z: zRotOffset + (xDistance/Math.abs(xDistance))*zRotSign*Math.atan(finalPos.z/swordPoint.y)};

	//special rotation cases for the 'parry' and 'attack' directions
	if (direction == 'parry') {
		finalRotation = {x: -Math.PI/8, y: 0, z: this.sign*Math.PI/2};
	} else if (direction == 'attack') {
		finalRotation.x += this.sign*Math.PI/this.thickness;
		finalRotation.y = 0;
		finalRotation.z = 0;
	}

	//create a tween to rotate the sword (will start at the same time as the tween for moving the sword)
	var rotationTween = new TWEEN.Tween(sword.frame.rotation).to(finalRotation, swordTime);

	//move and rotate the sword
	sword.moveTween = new TWEEN.Tween(sword.frame.position).to(finalPos, swordTime).onStart(function () {
		rotationTween.start();
	}).onStop(function () {
		sword.frame.position = new THREE.Vector3(finalPos.x, finalPos.y, finalPos.z);
	}).delay(delayTime).start();
}

//******//
//End Sword//
//*******//