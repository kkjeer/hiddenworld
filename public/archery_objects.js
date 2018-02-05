/*
Katherine Kjeer
2014
archery_objects.js
Contains the modeling, animation, and logic for the game of archery training, 
	using an object-oriented ArcheryCenter, Bows, Targets, and a Quiver,
	as well as arrow modeling functions.
*/

var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

//limitations on drawing back the arrow
var MAX_CURVATURE = 130;
var MAX_VELOCITY = 450;

//to control how fast the arrow goes
var Y_ACCEL = -9.8;
var ARROW_TWEEN_TIME = 150;

//determine how many arrows the player has at each level
var ARROWS_PER_LEVEL = [4, 6, mobile ? 8 : 6];
var MAX_ARROWS = mobile ? 12 : 10;

//for conservation of momentum calculations to make things (cylinders and boxes) fall when hit by an arrow
var ARROW_MASS = 10;
var CYLINDER_MASS = 175;
var MOVING_TARGET_MASS = 200;
//increase or decrease this value to increase or decrease the difficulty of the MovingTarget level
var MOVING_TARGET_SPEED = 0.7;

//the time taken to animate a cylinder falling off a TableTarget
//also the delay time in switching out targets in advanceLevel()
var CYLINDER_TIME = 1000;

//**********//
//ArcheryCenter//
//**********//

/*
ArcheryCenter()
Purpose: constructs a new ArcheryCenter object that drives the archery training
	the frame consists of a large box that encloses the user's view,
	with the frames of a Bow, and Target and Quiver object added to the frame
	frame origin: the center of the bottom of the box
Parameters:
	boxSize (number): the width, height, and depth of the enclosing box mesh
	bow (Bow): the Bow object that belongs to the ArcheryCenter (used in animations)
	target (Target): the Target object that belongs to the ArcheryCenter (used in animations)
		Targets come in one of (currently) three forms: BoxTarget, TableTarget, or MovingTarget (see below for Target code)
*/
function ArcheryCenter (boxSize, bow, target) {
	//properties taken directly from the parameters
	this.size = boxSize;
	this.bow = bow;
	this.target = target;

	//initial level of 0
	this.level = 0;

	//intially, the ArcheryCenter is not finished and its Target has not been hit
	this.finished = false;
	this.hit = false;

	//create and add the frame:
	var frame = new THREE.Object3D();

	//the enclosing box to give the illusion of being surrounded by the space
	var box = makeBox(boxSize, "archery_sky.png", "archery_forest.png", "archery_ground.png");
	box.position.set(0, 0.5*boxSize, 0);
	frame.add(box);

	//add the Target's frame
	target.frame.position.set(target.posFraction.x*boxSize, target.posFraction.y*boxSize, target.posFraction.z*boxSize);
	frame.add(target.frame);

	//add the Bow's frame
	bow.frame.position.set(0.1*boxSize, 0.22*boxSize, 0.4*boxSize);
	frame.add(bow.frame);

	this.bowSizeX = 0.3*boxSize;
	this.bowSizeY = 0.4*boxSize;
	this.bowMinX = bow.frame.position.x/boxSize - 0.5*this.bowSizeX;
	this.bowMaxX = bow.frame.position.x/boxSize + 0.5*this.bowSizeX + $('#scene-div').width();
	this.bowMinY = bow.frame.position.y/boxSize - 0.5*this.bowSizeY;
	this.bowMaxY = bow.frame.position.y/boxSize + 0.5*this.bowSizeY;

	//create and add a Quiver object and frame
	//a Quiver's frame is a rectangle containing the user's arrows (see below for Quiver code)
	var quiver = new Quiver(bow.arrow, 0.25*boxSize, 2*bow.arrow.arrowLength);
	quiver.frame.position.set(-0.4*boxSize, 0.25*boxSize, 0.4*boxSize);
	frame.add(quiver.frame);
	this.quiver = quiver;

	this.frame = frame;
}

/*
ArcheryCenter.prototype.advanceLevel()
Purpose: checks whether the user completed the current Target
	if so, and if there are still Targets remaining, updates the ArcheryCenter's Target
	and adds the number of arrows indicated by ARROWS_PER_LEVEL to the ArcheryCenter's Quiver
*/
ArcheryCenter.prototype.advanceLevel = function () {
	//stop the target
	this.target.stop(this.bow);

	this.bow.canRelease = false;

	//if the user didn't complete the current level, inform them of that and return
	if (this.target.isComplete == false) {
		this.finished = true;
		$('#startButton').prop('disabled', false);
		$('#top-instructions').html('Keep practicing and someday you can join the Dragon Shadows.' + 
																	"<br>Press the buttons to replay training or return to the Hidden World.");
		return;
	}

	//go up one level
	this.level++;

	//inform the user that we're moving to the next level
	$('#top-instructions').html($('#top-instructions').html() + " Moving to next level.");

	//if we're out of targets (as dictated by the global archeryTargets array in the main project.html file), 
	//set the training center to finished, update the top instructions, and return
	if (this.level >= archeryTargets.length) {
		this.finished = true;
		$('#startButton').prop('disabled', false);
		$('#new-session').css('background-color', $('.instructions').css('background-color'));
		var html = this.target.isComplete == true ? 'Congratulations! You\'ve mastered archery training!' : 
																	'Keep practicing and someday you can join the Dragon Shadows.'
		$('#top-instructions').html(html + "<br>Press the buttons to replay training or return to the Hidden World.");
		return;
	}

	//add the new target to the training center, at the "out" position
	var outPosition = {x: 0, y: this.size, z: 0.25*this.size};
	archeryTargets[this.level].frame.position.set(outPosition.x, outPosition.y, outPosition.z);
	this.frame.add(archeryTargets[this.level].frame);

	//tween the new target in
	var center = this;
	var inPosition = {x: archeryTargets[this.level].posFraction.x*this.size, 
										y: archeryTargets[this.level].posFraction.y*this.size,
										z: archeryTargets[this.level].posFraction.z*this.size};
	var newTargetInTween = new TWEEN.Tween(archeryTargets[this.level].frame.position).to(inPosition, 1500).onComplete(function () {
	});

	//tween the old target out (start both tweens at the same time)
	var oldTargetOutTween = new TWEEN.Tween(this.target.frame.position).to(outPosition, 1500).onComplete(function () {
	}).onStart(function () {
		newTargetInTween.start();
	}).onComplete(function () {
		center.target = archeryTargets[center.level];
		$('#top-instructions').html(center.target.instructions);

		//add more arrows to the quiver, up to MAX_ARROWS
		var arrowsToAdd = ARROWS_PER_LEVEL[center.level] + 1;
		if (center.quiver.numArrows + arrowsToAdd > MAX_ARROWS) {
			arrowsToAdd = MAX_ARROWS - center.quiver.numArrows;
		}
		center.quiver.addArrows(arrowsToAdd);

		//reset the bow
		center.resetBow();

		//start moving the target
		center.target.move();
		if (center.target.moveTween != undefined) {
			center.target.moveTween.onComplete(function () {
				center.finished = true;
				$('#startButton').prop('disabled', false);
				if (center.target.isComplete == false) {
					$('#top-instructions').html('Keep practicing and someday you can join the Dragon Shadows.' + 
																	"<br>Press the buttons to replay training or return to the Hidden World.");
				}
			});
		}
	}).delay(CYLINDER_TIME).start();

	
}

/*
ArcheryCenter.prototype.releaseArrow()
Purpose: animates the arrow moving along a trajectory based on the ArcheryCenter's Bow's position, rotation, and velocity
	checks whether the arrow hits the ArcheryCenter's current Target and responds accordingly
	advances to the next level if the current Target is complete
*/
ArcheryCenter.prototype.releaseArrow = function () {
	//if the bow has zero velocity, the arrow shouldn't go anywhere
	if (this.bow.velocity == 0) {
		return;
	}

	this.bow.drawTween.stop();

	//re-mark the ArcheryCenter as not being hit
	this.hit = false;

	//so if the user presses the release key while the arrow is currently being released, nothing happens
	this.bow.canRelease = false;

	//now the user can reset
	this.bow.canReset = false;

	//find the angle to the horizontal at which the arrow is launched
	var launchAngle = this.bow.frame.rotation.x;

	//break the velocity down into horizontal and vertical (z and y) components
	var zVelocity = this.bow.velocity*Math.cos(launchAngle);
	var yVelocity = this.bow.velocity*Math.sin(launchAngle);

	//find the total time of flight
	var flightTime;
	if (yVelocity != 0) {
		flightTime = Math.abs(-2*yVelocity/Y_ACCEL);
	} else {
		flightTime = Math.sqrt(2*this.bow.frame.position.y/-Y_ACCEL); 
	}
	
	//tween between 0 and flightTime, updating the arrow's position based on projectile motion at each point in time
	var center = this;
	var bow = center.bow;
	var target = center.target;
	var time = {t: 0}
	var finalTime = {t: flightTime};
	bow.arrowLaunchTween = new TWEEN.Tween(time).to(finalTime, flightTime*ARROW_TWEEN_TIME);
	bow.arrowLaunchTween.onUpdate(function () {
		//update the arrow's position
		var y = yVelocity*time.t + 0.5*Y_ACCEL*time.t*time.t;
		var z = -zVelocity*time.t;
		bow.arrow.frame.position.set(bow.arrow.frame.position.x, y, z);

		//rotate the arrow to follow the tangent of its trajectory:
		//find the derivative of y w.r.t time.t
		var yPrime = yVelocity + Y_ACCEL*time.t;

		//the angle of x-rotation is the inverse tangent of the y-derivative, scaled by 1/(2*PI)
		var angle = Math.atan(yPrime)/(2*Math.PI);
		bow.arrow.frame.rotation.x = angle;

		//determine whether the arrow has hit the target
		var arrowPos = bow.arrowWorldRange();
		center.hit = target.isHit(arrowPos);

		//if the arrow has hit the target:
		if (center.hit == true) {
			//stop the tween the launches the arrow
			bow.arrowLaunchTween.stop();

			//redo the target
			center.frame.remove(target.frame);
			target.whenHit(center.bow, center.quiver);
			center.frame.add(target.frame);

			checkArrowsLeft();
		}
	}).start();

	//local function to determine whether the target has been hit, and whether the user still has arrows left
	function checkArrowsLeft () {
		center.bow.canReset = true;
		center.resetBow();
		if (!center.hit && !center.target.cylindersNeeded) {
			$('#top-instructions').html("Sorry, try again!");
		}
		if (center.quiver.numArrows < 0 || center.target.isComplete == true) {
			center.advanceLevel();
		}
	}

	//check the number of arrows once the arrow finishes moving
	bow.arrowLaunchTween.onComplete(checkArrowsLeft);

	//tween the bowstring curvature back to 0
	var initialCurvature = bow.curvature;
	var finalCurvature = {curvature: 0};
	bow.stringTween = new TWEEN.Tween(this.bow).to(finalCurvature, flightTime*100).onUpdate(function () {
		bow.addBowstring();
	}).start();
}

/*
ArcheryCenter.prototype.resetBow()
Purpose: resets the ArcheryCenter's Bow object to its initial position and rotation
	sets a new arrow to the bow, and removes an arrow from the quiver
*/
ArcheryCenter.prototype.resetBow = function () {
	this.bow.reset();

	//get rid of one of the arrows in the quiver
	this.quiver.removeArrow();
}

//**********//
//End ArcheryCenter//
//**********//

//**********//
//Bow//
//**********//

/*
Bow()
Purpose: constructs a new Bow object
	the frame is a curved bow struct with an initially linear tube for the bowstring
	the bowstring can be animated to draw back and release
	the Bow also has an arrow attached to it, created using makeArrow()
	frame origin: center of the bowstring
	the bow extends along the negative z-axis by bowWidth, and along the positive and negative y-axes by half the bowHeight
Parameters:
	bowHeight (number): the height of the bow 
	bowWidth (number): the distance from the origin of the bow to the intersection of the two halves of the bow struct
		along the (negative) z-axis
	bowRadius (number): the maximum radius of the bow struct (where the two halves meet)
	image (string): the image to texture-map onto the bow struct (the bowstring is simply black)
*/
function Bow (bowHeight, bowWidth, bowRadius, image) {
	this.canReset = false;
	this.canRelease = true;

	var frame = new THREE.Object3D();

	this.height = bowHeight;
	this.width = bowWidth;
	this.radius = bowRadius;
	this.image = image;
	this.stringRadiusF = 0.3;
	this.velocity = 0;

	var upperHalf = this.makeHalfBow();
	upperHalf.position.set(0, 0, -this.width);
	frame.add(upperHalf);

	var lowerHalf = upperHalf.clone();
	lowerHalf.position.set(0, 0, -this.width);
	lowerHalf.rotateZ(Math.PI);
	frame.add(lowerHalf);

	this.curvature = 0;
	this.stringImage = 0x000000;
	this.arrow = arrow;
	this.frame = frame;

	var arrow = makeArrow(this, "dark_wood", "gray_wall", "blue_jay_feather");
	this.arrow = arrow;
	arrow.frame.position.set(this.getArrowX(), 0, 0);
	frame.add(arrow.frame);

	this.addBowstring();

	this.frame = frame;
}

/*
Bow.prototype.arrowWorldRange()
Purpose: returns the range of the Bow's arrow coordinates relative to the Bow frame's parent frame (typically the ArcheryCenter frame)
	used to detect collisions between the arrow and a Target frame
*/
Bow.prototype.arrowWorldRange = function () {
		if (this.arrow == undefined) {
			return new THREE.Vector3(10000, 10000, 10000);
		}

		var arrowPos = this.arrowWorldPosition();
		var x = arrowPos.x;
		var y = arrowPos.y;
		var z = arrowPos.z;

		return {xMinArrow: x - this.arrow.headScaleX*this.arrow.headRadius, xMaxArrow: x + this.arrow.headScaleX*this.arrow.headRadius,
						yMinArrow: y - this.arrow.headRadius, yMaxArrow: y + this.arrow.headRadius,
						zMinArrow: z - 0.5*this.arrow.headLength, zMaxArrow: z + 0.5*this.arrow.headLength};
	}

/*
Bow.prototype.arrowWorldPosition()
Purpose: returns the position of the Bow's arrow relative to the Bow frame's parent frame (typically the ArcheryCenter frame)
	used to animate the arrow hitting a target, especially in Table and Moving Targets
*/
Bow.prototype.arrowWorldPosition = function () {
		//set the x-coordinate
		var xSign = 0;
		if (this.frame.rotation.y > 0) {
			xSign = -1;
		} else if (this.frame.rotation.y < 0) {
			xSign = 1;
		}
		var xzOffset = (-this.arrow.frame.position.z*Math.sin(Math.abs(this.frame.rotation.y)));
		var xBefore = this.frame.position.x + this.arrow.frame.position.x;
		var x = xBefore + xSign*xzOffset;

		//set the y-coordinate
		var ySign = 0;
		if (this.frame.rotation.x > 0) {
			ySign = 1;
		} else if (this.frame.rotation.x < 0) {
			ySign = -1;
		}
		var yOffset = (-this.arrow.frame.position.z*Math.sin(Math.abs(this.frame.rotation.x)))
		var y = this.frame.position.y + this.arrow.frame.position.y + ySign*yOffset;

		//set the z-coordinate
		//make sure the z-coordinate is halfway down the head of the arrow, not at the base of the arrow
		//so that the arrow stops when half the head is embedded in the target
		var z = this.frame.position.z + this.arrow.frame.position.z - this.arrow.arrowLength - 0.5*this.arrow.headLength + xzOffset;

		//create and return the position of the arrow relative to the bow's parent (usually the training center)
		var arrowPos = new THREE.Vector3(x, y, z);
		return arrowPos;
	}

/*
Bow.prototype.addBowstring()
Purpose: removes the current bowstring from the Bow's frame
	and adds a new bowstring to the Bow's frame based on the Bow's new curvature
	used to adjust the curvature of the bowstring in drawing and releasing arrows
*/
Bow.prototype.addBowstring = function () {
	var stringRadius = this.stringRadiusF*this.radius;
	var stringLength = (0.5 - 0.05)*this.height - (-0.5 + 0.05)*this.height;
	this.frame.remove(this.frame.getObjectByName("string"));

	//create the string using two linear Spline curves
	var stringFrame = new THREE.Object3D();
	var stringPointsUpper = [new THREE.Vector3(0, stringLength, 0),
														new THREE.Vector3(this.getArrowX(), 0.5*stringLength, this.curvature)]
	var stringCurveUpper = new THREE.SplineCurve3(stringPointsUpper);
	var stringGeomUpper = new THREE.TubeGeometry(stringCurveUpper, 32, stringRadius, 16, false);
	var stringMat = createMaterial(this.stringImage);
	var stringUpper = new THREE.Mesh(stringGeomUpper, stringMat);
	stringFrame.add(stringUpper);

	var stringPointsLower = [new THREE.Vector3(0, 0, 0),
														new THREE.Vector3(this.getArrowX(), 0.5*stringLength, this.curvature)]
	var stringCurveLower = new THREE.SplineCurve3(stringPointsLower);
	var stringGeomLower = new THREE.TubeGeometry(stringCurveLower, 32, stringRadius, 16, false);
	var stringLower = new THREE.Mesh(stringGeomLower, stringMat);
	stringFrame.add(stringLower);

	var join = this.makeLinearJoin(stringPointsUpper, stringPointsLower);
	stringFrame.add(join);

	//add the string to the bow's frame
	stringFrame.position.set(0, (-0.5 + 0.05)*this.height, 0);
	stringFrame.name = "string";
	this.frame.add(stringFrame);
}

/*
Bow.prototype.makeLinearJoin
Purpose: returns a mesh that is a curve to smoothly join two linear meshes
Parameters:
	points1: THREE.Vector3 array: contains the two points that define the curve of the first linear mesh
	points2: THREE.Vector3 array: contains the two points that define the curve of the second linear mesh
*/
Bow.prototype.makeLinearJoin = function (points1, points2) {
	//endpoints: last point of first curve, first point of second curve
  var r0 = points1[1];
  var r3 = points2[0];

  //middle points: point slightly beyond end of first curve, point slightly beyond first point of second curve
  var r1 = new THREE.SplineCurve3(points1).getPoint(1.01);
  var r2 = new THREE.SplineCurve3(points2).getPoint(0.01);

  //make the curve, geometry, and mesh
  var smoothCurve = new THREE.CubicBezierCurve3(r0, r1, r2, r3);
  var smoothGeom = new THREE.TubeGeometry(smoothCurve, 32, this.stringRadiusF*this.radius, 16, false);
  var smoothMesh = new THREE.Mesh(smoothGeom, createMaterial(this.stringImage));
  return smoothMesh;
}

/*
Bow.prototype.drawArrow()
Purpose: draws the arrow back all the way
	increases the curvature and velocity of the bow, up until their global maximum values
	draws the arrow back all the way, all at once
	used in the mouse and swipe usage of archery training
*/
Bow.prototype.drawArrow = function () {
	var bowTime = 1500;
	var bowStep = 7;
	var properties = {velocity: MAX_VELOCITY, curvature: MAX_CURVATURE};
	var bow = this;
	bow.drawTween = new TWEEN.Tween(bow).to(properties, 1000).onUpdate(function () {
		bow.arrow.frame.position.z = bow.curvature;
		bow.addBowstring();
	}).easing(TWEEN.Easing.Quadratic.Out).start();
}

/*
Bow.prototype.incrementArrow
Purpose: draws the arrow back by one step, limited by the global maximum values
	used in the keyboard usage of archery training
*/
Bow.prototype.incrementArrow = function () {
	this.drawTween = new TWEEN.Tween();
	var bowStep = 7;
	var vStep = MAX_VELOCITY/(MAX_CURVATURE/bowStep);
	if (this.curvature <= MAX_CURVATURE - 5) {
		this.velocity += vStep;
		this.curvature += bowStep;
		this.arrow.frame.position.z += bowStep;
		this.addBowstring();
	}
}

Bow.prototype.reset = function () {
	//now the user can release the arrow again
	this.canRelease = true;

	//the user can't reset twice in a row
	this.canReset = false;

	//stop the tweens that are launching the arrow
	this.arrowLaunchTween.stop();
	this.stringTween.stop();

	//reset the curvature and velocity
	this.curvature = 0;
	this.velocity = 0;

	//reset the rotation so the bow is exactly back in its original state
	this.frame.rotation.x = 0;
	this.frame.rotation.y = 0;
	this.frame.rotation.z = 0;

	//reset the arrow rotation
	this.arrow.frame.rotation.x = 0;

	//reset the bowstring and arrow
	this.curvature = 0;
	this.addBowstring();

	this.arrow.frame.position.set(this.getArrowX(), 0, 0);
	this.frame.add(this.arrow.frame);
}

/*
Bow.prototype.makeHalfBow()
Purpose: returns an Object3D containing half a bow
	creates half a bow using Bezier curves and TubeRadialGeometry
	origin: the bottom of the curve
	curves away from the y-axis, in the +y, +z quadrant of the x-y plane
*/
Bow.prototype.makeHalfBow = function () {
	var bowHeight = 0.5*this.height;
	var bowPoints = [new THREE.Vector3(0, 0, 0),
										new THREE.Vector3(0, 0.25*bowHeight, 0),
										new THREE.Vector3(0, 0.75*bowHeight, this.width),
										new THREE.Vector3(0, bowHeight, this.width)];
	var bowCurve = new THREE.CubicBezierCurve3(bowPoints[0], bowPoints[1], bowPoints[2], bowPoints[3]);

	var bowRadii = [this.radius, this.stringRadiusF*this.radius];

	var bowGeom = new THREE.TubeRadialGeometry(bowCurve, 32, bowRadii, 16, false);
	var bowMat = createMaterial(this.image);
	var bowMesh = new THREE.Mesh(bowGeom, bowMat);
	return bowMesh;
}

Bow.prototype.getArrowX = function () {
	//return 0;
	return -(this.radius + this.arrow.headScaleX*this.arrow.headRadius);
}

//**********//
//End Bow//
//**********//

//**********//
//Arrow - not object oriented//
//Arrows don't need to "do" anything - they're just a part of the bow//
//Possible future extension: make arrows object-oriented//
//**********//

//origin: bottom end of the arrow's shaft (opposite the head)
//extends along the negative z-axis
function makeArrow (bow, shaftImage, headImage, featherImage) {
	var object = {};

	var frame = new THREE.Object3D();

	//set the images from the parameters
	object.shaftImage = shaftImage;
	object.headImage = headImage;
	object.featherImage = featherImage;

	//set the arrow length in terms of the bow width
	object.arrowLength = 2*bow.width;

	//set the arrow shaft radius in terms of the bow radius
	object.shaftRadius = 0.5*bow.radius;

	//the shaft - a cylinder
	var shaftPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -object.arrowLength)];
	var shaftCurve = new THREE.SplineCurve3(shaftPoints);
	var shaftGeom = new THREE.CylinderGeometry(object.shaftRadius, object.shaftRadius, object.arrowLength, 16, 16, false);
	var shaftMat = createMaterial(object.shaftImage);
	var shaft = new THREE.Mesh(shaftGeom, shaftMat);
	shaft.rotateX(-Math.PI/2);
	shaft.translateY(0.5*object.arrowLength);
	frame.add(shaft);

	//the head - a cone
	object.headLength = 0.25*object.arrowLength;
	object.headRadius = 2.5*object.shaftRadius;
	var headGeom = new THREE.CylinderGeometry(0, object.headRadius, object.headLength, 6, 16, false);
	var headMat = createMaterial(object.headImage);
	var head = new THREE.Mesh(headGeom, headMat);
	object.headScaleX = 0.85;
	head.scale.x = object.headScaleX;
	head.position.set(0, 0, -object.arrowLength);
	head.rotateX(-Math.PI/2);
	frame.add(head);

	//the feathers
	object.featherLength = 0.25*object.arrowLength;
	object.featherWidth = 0.3*object.featherLength;
	object.featherSlope = 0.5;
	object.featherCurvature = 0.5*object.featherWidth;

	var leftFeather = makeFeather(object);
	leftFeather.position.set(-(object.featherWidth + object.shaftRadius), 0, 0);
	frame.add(leftFeather);

	var rightFeather = leftFeather.clone();
	rightFeather.position.set(object.featherWidth + object.shaftRadius, 0, 0);
	rightFeather.rotateZ(Math.PI);
	frame.add(rightFeather);

	var topFeather = leftFeather.clone();
	topFeather.position.set(0, object.featherWidth + object.shaftRadius, 0);
	topFeather.rotateZ(-Math.PI/2);
	frame.add(topFeather);

	var bottomFeather = leftFeather.clone();
	bottomFeather.position.set(0, -(object.featherWidth + object.shaftRadius), 0);
	bottomFeather.rotateZ(Math.PI/2);
	frame.add(bottomFeather);

	frame.name = "arrow";

	object.frame = frame;

	return object;
}

/*
makeFeather()
Purpose: returns an Object3D containing a slanted plane used for each feather of an arrow
	origin: bottom left corner
	extends down the negative z-axis and up the positive x-axis
Parameters:
	arrow (object): the arrow to add the feather to
*/
function makeFeather (arrow) {
	var frame = new THREE.Object3D();

	var length = arrow.featherLength;
	var width = arrow.featherWidth;
	var slope = arrow.featherSlope;
	var curvature = arrow.featherCurvature;

	var featherPoints = [
		//bottom row
		[[0, 0, 0], 
			[0.25*width, 0, -slope*0.25*width], 
			[0.75*width, 0, -slope*0.75*width], 
			[width, 0, -slope*width]],

		//second from bottom row
		[[0, 0, -0.25*length], 
			[0.25*width, curvature, -(slope*0.25*width + 0.25*length)], 
			[0.75*width, curvature, -(slope*0.75*width + 0.25*length)], 
			[width, 0, -(slope*width + 0.25*length)]],

		//second from top row
		[[0, 0, -0.75*length], 
			[0.25*width, -curvature, -(slope*0.25*width + 0.75*length)], 
			[0.75*width, -curvature, -(slope*0.75*width + 0.75*length)], 
			[width, 0, -(slope*width + 0.75*length)]],

		//top row
		[[0, 0, -length], 
			[0.25*width, 0, -(slope*0.25*width + length)], 
			[0.75*width, 0, -(slope*0.75*width + length)], 
			[width, 0, -(slope*width + length)]]
	];
	var featherGeom = new THREE.BezierSurfaceGeometry(featherPoints, 20, 20);
	var featherMat = createMaterial(arrow.featherImage);
	featherMat.side = THREE.DoubleSide;
	var feather = new THREE.Mesh(featherGeom, featherMat);
	frame.add(feather);

	return frame;
}

//**********//
//End Arrow//
//**********//

//**********//
//Quiver//
//**********//

/*
Quiver()
Purpose: constructs a new Quiver object
	a Quiver holds all the arrows available to the user
	the frame is a rectangular region containing all the arrows in a row
	frame origin: center of the left edge of the rectangle
Parameters:
	arrow (object): the initial arrow of the quiver (each arrow added to the quiver clones this arrow)
	width (number): the width of the rectangle that holds the arrows
	height (number): the height of the rectangle that holds the arrows
*/
function Quiver (arrow, width, height) {
	this.arrow = arrow;
	this.width = width;
	this.height = height;
	this.numArrows = 0;
	this.arrowSpacing = this.width/MAX_ARROWS;

	this.frame = new THREE.Object3D();

	this.addArrows(ARROWS_PER_LEVEL[0]);
}

/*
Quiver.prototype.removeArrow()
Purpose: removes one arrow from the Quiver
	used when drawing a new arrow
*/
Quiver.prototype.removeArrow = function () {
	//remove the most recently added (rightmost) arrow and decrement the numArrows property
	this.frame.remove(this.frame.getObjectByName("quiverArrow" + this.numArrows));
	this.numArrows--;
}

/*
Quiver.prototype.addArrows()
Purpose: adds the given number of arrows to the Quiver and updates the Quiver's numArrows property
	used when moving to the next level in the ArcheryCenter
Parameters:
	arrowNum (integer): the number of arrows to add
*/
Quiver.prototype.addArrows = function (arrowNum) {
	//figure out the x-coordinate of the first arrow to add based on how many arrows there already are
	var arrowStart = (this.numArrows)*this.arrowSpacing;

	//add the arrows, spaced equally apart
	for (var i = 1; i <= arrowNum; i++) {
		var arrowFrame = this.arrow.frame.clone();
		arrowFrame.position.set(arrowStart + i*this.arrowSpacing, -0.5*this.arrow.arrowLength, 10);
		arrowFrame.rotation.set(Math.PI/2, 0, 0);
		var arrowIndex = this.numArrows + i;
		arrowFrame.name = "quiverArrow" + arrowIndex;
		this.frame.add(arrowFrame);
	}

	//update the numArrows property
	this.numArrows += arrowNum;
}

//**********//
//End Quiver//
//**********//

//**********//
//Targets//
/*
Properties all targets must have:
isComplete (boolean) - whether the target has been completely hit (e.g. has all its necessary cylinders knocked down)
posFraction (Vector3) - contains the numbers to multiply by boxSize of the archery center for positioning
instructions (string) - what to display in the top-instruction div

Functions all targets must have:
isHit() - returns true iff the target has been hit by the arrow (param: the world range of the arrow)
whenHit() - sets the behavior of the target once it has been hit (param: a bow)
move() - moves the target around - empty for most targets except MovingTarget
stop() - stops the target's motion - empty for BoxTarget
*/
//**********//

//**********//
//BoxTarget//
//**********//

/*
BoxTarget()
Purpose: constructs a new BoxTarget object
	the frame contains a thin cylindrical stand (leg) and a box on top of the stand
	frame origin: the center of the bottom of the stand
Parameters:
	height (number): the total height of the target (including the height of the box)
		the height of the target is randomly generated within a range depending on the parameter height
	boxWidth (number): the width of the box
	boxHeight (number): the height of the box (the leg height is the difference of height and boxHeight)
	boxDepth (number): the depth of the box
	image (string): the image to texture-map onto the box
	posFraction (Vector3): a vector containing the position of the TableTarget's frame relative to 
		its parent ArcheryCenter frame, proportional to the size of the ArcheryCenter's frame (required Target property)
*/
function BoxTarget (height, boxWidth, boxHeight, boxDepth, image, posFraction) {
	//choose a random height within [0.8*height, 1.3*height]
	this.height = (Math.random()*0.5 + 0.8)*height;

	//taken straight from the parameters
	this.width = boxWidth;
	this.boxWidth = boxWidth;
	this.boxHeight = boxHeight;
	this.boxDepth = boxDepth;
	this.image = image;
	this.posFraction = posFraction;

	//the target is not complete until it's been hit
	this.isComplete = false;

	var frame = new THREE.Object3D();

	//create the "leg" the box sits on
	var legRadius = 0.07*this.width;
	var legHeight = this.height - boxHeight;
	var legGeom = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16, 16, false);

	var leg = new THREE.Mesh(legGeom, createMaterial("dark_wood"));
	leg.name = "leg";
	leg.position.set(0, 0.5*legHeight, 0);
	frame.add(leg);

	//create the box
	var boxGeom = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
	var boxMat = createMaterial(image);
	var box = new THREE.Mesh(boxGeom, boxMat);
	box.position.set(0, legHeight + 0.5*boxHeight, 0);
	box.name = "box";
	frame.add(box);

	this.box = box;
	
	this.frame = frame;

	this.instructions = "";
}

/*
BoxTarget.prototype.isHit()
Required Target function
Purpose: returns true iff the box portion of the target has been hit by the arrow with the given position
Parameters:
	arrowRange (object): the range of coordinates of the arrow that either did or didn't hit the target
*/
BoxTarget.prototype.isHit = function (arrowPos) {
	return hitsBox(this, arrowPos, this.boxWidth, this.boxHeight, this.boxDepth);
}

/*
BoxTarget.prototype.whenHit()
Required Target function
Purpose: when the BoxTarget is hit, change the material of its box and mark the target as complete
Parameters:
	bow (Bow): the Bow used to hit the target
		not used, but required by the Target API
*/
BoxTarget.prototype.whenHit = function (bow) {
	this.image = "green_target.png";
	this.box.material = textureMaterial(this.image);
	this.isComplete = true;
	$('#top-instructions').html("You hit the target!");
}

/*
BoxTarget.prototype.move()
Required Target function
Purpose: empty - BoxTargets don't move
*/
BoxTarget.prototype.move = function () {

}

/*
BoxTarget.prototype.stop()
Required Target function
Purpose: empty - BoxTargets don't need to do anything when stopped
Parameters:
	bow (Bow): not used, but required by the Target API
*/
BoxTarget.prototype.stop = function (bow) {

}

//**********//
//End BoxTarget//
//**********//

//**********//
//TableTarget//
//**********//

/*
TableTarget()
Purpose: constructs a new TableTarget object
	the frame contains a table, numCylinders cylinders, and a box-shaped stand for each cylinder
		the stands sit on top of the table, and each cylinder sits on top of its stand
		the stand heights are randomly generated (within a certain range)
	frame origin: center of the rectangle bounded by the bottom of the four legs
Parameters:
	tableHeight (number): the height of the table (not including the stands and cylinders)
	tableWidth (number): the width of the table
	tableDepth (number): the depth of the table
	numCylinders (integer): the number of cylinders to add to the top of the table
	posFraction (Vector3): a vector containing the position of the TableTarget's frame relative to 
		its parent ArcheryCenter frame, proportional to the size of the ArcheryCenter's frame (required Target property)
*/
function TableTarget (tableHeight, tableWidth, tableDepth, numCylinders, posFraction) {
	this.height = (Math.random()*0.2 + 0.9)*tableHeight;
	this.width = tableWidth;
	this.depth = tableDepth;
	this.posFraction = posFraction;
	//this.numCylinders = numCylinders;
	this.numCylinders = mobile ? Math.floor(2*Math.random() + 3) : Math.floor(4*Math.random() + 4);

	//the number of cylinders the user nees to hit in order for the target to be considered complete
	//this.cylindersNeeded = this.numCylinders - 1;
	this.cylindersNeeded = Math.floor((0.2*Math.random() + 0.8)*this.numCylinders);
	ARROWS_PER_LEVEL[1] = mobile ? 2*this.cylindersNeeded : this.cylindersNeeded + 3;
	this.isComplete = false;

	var frame = new THREE.Object3D();

	//add the table:
	//the box that makes up the table surface
	var boxThickness = 0.15*this.height;
	this.boxThickness = boxThickness;
	var tableGeom = new THREE.BoxGeometry(this.width, boxThickness, this.depth);
	var tableMat = createMaterial("rough_wood");
	var tableMesh = new THREE.Mesh(tableGeom, tableMat);
	tableMesh.position.set(0, this.height, 0);
	tableMesh.name = "tableSurface";
	frame.add(tableMesh);

	//the legs:
	var legWidth = 0.1*this.width;
	this.legWidth = legWidth;
	var legGeom = new THREE.BoxGeometry(legWidth, this.height, legWidth);

	//upper left leg
	var upperLeftLeg = new THREE.Mesh(legGeom, tableMat);
	upperLeftLeg.position.set(-0.5*this.width + 0.5*legWidth, 0.5*this.height, -0.5*this.depth + 0.5*legWidth);
	upperLeftLeg.name = "upperLeftLeg";
	frame.add(upperLeftLeg);

	//upper right leg
	var upperRightLeg = upperLeftLeg.clone();
	upperRightLeg.position.set(0.5*this.width - 0.5*legWidth, 0.5*this.height, -0.5*this.depth + 0.5*legWidth);
	upperRightLeg.name = "upperRightLeg";
	frame.add(upperRightLeg);

	//lower left leg
	var lowerLeftLeg = upperLeftLeg.clone();
	lowerLeftLeg.position.set(-0.5*this.width + 0.5*legWidth, 0.5*this.height, 0.5*this.depth - 0.5*legWidth);
	lowerLeftLeg.name = "lowerLeftLeg";
	frame.add(lowerLeftLeg);

	//lower right leg
	var lowerRightLeg = upperLeftLeg.clone();
	lowerRightLeg.position.set(0.5*this.width - 0.5*legWidth, 0.5*this.height, 0.5*this.depth - 0.5*legWidth);
	lowerRightLeg.name = "lowerRightLeg";
	frame.add(lowerRightLeg);

	//add the cylinders
	this.cylinderRadius = 0.5*legWidth;
	this.cylinderHeight = 0.4*this.height;

	//create the cylinder mesh
	var cylinderGeom = new THREE.CylinderGeometry(this.cylinderRadius, this.cylinderRadius, this.cylinderHeight, 16, 16);
	var cylinderMat = createMaterial("gray_wall");
	var cylinderMesh = new THREE.Mesh(cylinderGeom, cylinderMat);

	//create the cylinder frame
	//origin: bottom center of the cylinder
	var cylinderFrame = new THREE.Object3D();
	cylinderMesh.position.set(0, 0.5*this.cylinderHeight, 0);
	cylinderMesh.rotateY(Math.PI);
	cylinderFrame.add(cylinderMesh);

	//add all the cylinders
	//the cylinders are centered and evenly spaced on the tabletop
	var cylinderStep = (this.width - 4*this.cylinderRadius)/this.numCylinders;
	var cylinderStandHeight = 0.6*this.height;
	this.standSize = this.cylinderRadius;
	this.cylinders = [];
	for (var i = 1; i <= this.numCylinders; i++) {
		//make a box for each cylinder to stand on
		var standHeight = (Math.random() + 0.2)*cylinderStandHeight;
		var standGeom = new THREE.BoxGeometry(this.standSize, standHeight, this.standSize);
		var standMesh = new THREE.Mesh(standGeom, tableMat);
		standMesh.position.set(0, 0.5*standHeight, 0);
		var standZ = Math.random()*(this.depth - 2*this.cylinderRadius) - 0.5*(this.depth - 2*this.cylinderRadius);
		standMesh.position.set(i*cylinderStep - 0.5*this.width, this.height + 0.5*standHeight, standZ);
		frame.add(standMesh);

		//add each cylinder on top of its stand
		var cylinder = cylinderFrame.clone();
		cylinder.position.set(standMesh.position.x, this.height + standHeight, standMesh.position.z);
		cylinder.name = "targetCylinder" + i;
		this.cylinders.push(cylinder);
		frame.add(cylinder);
	}

	this.frame = frame;

	this.name = "tabletarget";

	this.instructions = "Knock " + this.cylindersNeeded + " out of " + this.numCylinders + " cylinders off of the table.";
}

/*
TableTarget.prototype.isHit()
Required target function
Purpose: returns true iff this is intersected within the given arrowRange
	also returns true if the table portion is hit,
	but only is considered complete once all of its necessary cylinders have been hit
Parameters:
	arrowRange (object): the range of coordinates of the arrow that either did or didn't hit the target
*/
TableTarget.prototype.isHit = function (arrowRange) {
	this.hitCylinder = null;

	for (var i in this.cylinders) {
		var xMin = this.cylinders[i].position.x - this.cylinderRadius + this.frame.position.x;
		var xMax = this.cylinders[i].position.x + this.cylinderRadius + this.frame.position.x;
		var yMin = this.cylinders[i].position.y + this.frame.position.y;
		var yMax = this.cylinders[i].position.y + this.cylinderHeight + this.frame.position.y;
		var zMin = this.cylinders[i].position.z - this.cylinderRadius + this.frame.position.z;
		var zMax = this.cylinders[i].position.z + this.cylinderRadius + this.frame.position.z;

		//determine whether any of the coordinates are bad (less strict)
		var xBad = arrowRange.xMaxArrow <= xMin || arrowRange.xMinArrow >= xMax;
		var yBad = arrowRange.yMaxArrow <= yMin || arrowRange.yMinArrow >= yMax;
		var zBad = arrowRange.zMaxArrow <= zMin || arrowRange.zMinArrow >= zMax;

		if (!xBad && !yBad && !zBad) {
			this.hitCylinder = this.cylinders[i];
			this.cylindersNeeded--;
			if (this.cylindersNeeded == 0) {
				this.isComplete = true;
			}
			return true;
		}
	}

	//update the instructions to say no cylinder was hit
	$('#top-instructions').html("Sorry, try again! " + this.cylindersNeeded + (this.cylindersNeeded == 1 ? " cylinder" : " cylinders") + " to go.");


	//detect whether the table was hit - if so, the arrow should still stop, but the target shouldn't increase its "completeness"
	return this.isTableHit(arrowRange);
}

/*
TableTarget.prototype.isTableHit()
Purpose: helper function for isHit()
	returns true iff the table has been hit (including the legs, the tabletop, and each of the cylinder stands)
Parameters:
	arrowRange (object): the range of coordinates of the arrow that either did or didn't hit the table
*/
TableTarget.prototype.isTableHit = function (arrowRange) {
	//check the four legs
	var legRanges = [this.legRange(this.frame.getObjectByName("upperLeftLeg").position),
									 this.legRange(this.frame.getObjectByName("upperRightLeg").position),
									 this.legRange(this.frame.getObjectByName("lowerLeftLeg").position),
									 this.legRange(this.frame.getObjectByName("lowerRightLeg").position)];
	for (var i in legRanges) {
		var xBad = arrowRange.xMaxArrow <= legRanges[i].xMin || arrowRange.xMinArrow >= legRanges[i].xMax;
		var yBad = arrowRange.yMaxArrow <= legRanges[i].yMin || arrowRange.yMinArrow >= legRanges[i].yMax;
		var zBad = arrowRange.zMaxArrow <= legRanges[i].zMin || arrowRange.zMinArrow >= legRanges[i].zMax;
		if (!xBad && !yBad && !zBad) {
			return true;
		}
	}

	//check the tabletop
	var tablePos = this.frame.getObjectByName("tableSurface").position;

	var xMinTable = this.frame.position.x + tablePos.x - 0.5*this.width;
	var xMaxTable = this.frame.position.x + tablePos.x + 0.5*this.width;
	var yMinTable = this.frame.position.y + tablePos.y - 0.5*this.boxThickness;
	var yMaxTable = this.frame.position.y + tablePos.y + 0.5*this.boxThickness;
	var zMinTable = this.frame.position.z + tablePos.z - 0.5*this.depth;
	var zMaxTable = this.frame.position.z + tablePos.z + 0.5*this.depth;

	var xBadTable = arrowRange.xMaxArrow <= xMinTable || arrowRange.xMinArrow >= xMaxTable;
	var yBadTable = arrowRange.yMaxArrow <= yMinTable || arrowRange.yMinArrow >= yMaxTable;
	var zBadTable = arrowRange.zMaxArrow <= zMinTable || arrowRange.zMinArrow >= zMaxTable;

	if (!xBadTable && !yBadTable && !zBadTable) {
		return true;
	}

	//check each of the stands
	return this.isStandHit(arrowRange);
}

/*
TableTarget.prototype.isStandHit()
Purpose: helper for isTableHit()
	returns true iff one of the stands has been hit
Parameters:
	arrowRange (object): the range of coordinates of the arrow that either did or didn't hit the stand
*/
TableTarget.prototype.isStandHit = function (arrowRange) {
	for (var i in this.cylinders) {
		var cylinPos = this.cylinders[i].position;

		var xMin = this.frame.position.x + cylinPos.x - 0.5*this.standSize;
		var xMax = this.frame.position.x + cylinPos.x + 0.5*this.standSize;
		var yMin = this.frame.position.y + cylinPos.y - 0.5*cylinPos.y;
		var yMax = this.frame.position.y + cylinPos.y + 0.5*cylinPos.y;
		var zMin = this.frame.position.z + cylinPos.z - 0.5*this.standSize;
		var zMax = this.frame.position.z + cylinPos.z + 0.5*this.standSize;

		var xBad = arrowRange.xMaxArrow <= xMin || arrowRange.xMinArrow >= xMax;
		var yBad = arrowRange.yMaxArrow <= yMin || arrowRange.yMinArrow >= yMax;
		var zBad = arrowRange.zMaxArrow <= zMin || arrowRange.zMinArrow >= zMax;

		if (!xBad && !yBad && !zBad) {
			return true;
		}
	}

	return false;
}

/*
TableTarget.prototype.legRange()
Purpose: helper for isTableHit()
	returns the range of coordinates for the given leg position, relative to the TableTarget's frame
Parameters:
	legPos (Vector3): the position of the desired leg, relative to the TableTarget's frame
*/
TableTarget.prototype.legRange = function (legPos) {
	return {xMin: legPos.x - 0.5*this.legWidth, xMax: legPos.x + 0.5*this.legWidth,
					yMin: legPos.y, yMax: legPos.y + this.height,
					zMin: legPos.z - 0.5*this.legWidth, zMax: legPos.z + 0.5*this.legWidth};
}

/*
TableTarget.prototype.whenHit()
Required target function
Purpose: when a cylinder on the table is hit, it falls backward off the table
Parameters:
	bow (Bow): used to copy the arrow so it moves with the cylinder
*/
TableTarget.prototype.whenHit = function (bow, quiver) {
	//in case the table has been hit but not a cylinder - do nothing
	if (this.hitCylinder == null) {
		return;
	}

	var target = this;

	//detach the bow's arrow as a child of the bow's frame, and attach it as a child of the hitCylinder's frame
	bow.frame.remove(bow.arrow.frame);
	var arrowPos = bow.arrowWorldPosition();
	bow.arrow.frame.position.set(arrowPos.x - target.frame.position.x - target.hitCylinder.position.x,
															 arrowPos.y - target.frame.position.y - target.hitCylinder.position.y,
															 arrowPos.z - target.frame.position.z - target.hitCylinder.position.z);
	bow.arrow.frame.translateZ(bow.arrow.arrowLength);
	target.hitCylinder.add(bow.arrow.frame);

	//determine which way the hitCylinder travels in the x-direction based on the bow's y-rotation
	var xSign = 0;
	if (bow.frame.rotation.y < 0) {
		xSign = 1;
	} else if (bow.frame.rotation.y > 0) {
		xSign = -1;
	}

	//rotate the hitCylinder so it lies along the ground, after it's been moved to the ground
	//after that's done, put the arrow back in the bow
	var rotationTime = 500;
	target.rotationToGroundTween = new TWEEN.Tween(target.hitCylinder.rotation).to({x: -Math.PI/2}, rotationTime).onComplete(function () {
		//reset the bow's velocity so another arrow isn't added at the spot where it initially hit the hitCylinder in resetBow()
		bow.velocity = 0;

		//make a copy of the arrow to keep attached to the hitCylinder
		var arrow = bow.arrow.frame.clone();
		arrow.position.copy(bow.arrow.frame.position);
		target.hitCylinder.add(arrow);
		target.hitCylinder.remove(bow.arrow.frame);

		//add the bow's arrow back to the bow's frame, placed way off in the distance (the position will get reset in resetBow())
		bow.arrow.frame.position.set(0, 0, 10000);
		bow.frame.add(bow.arrow.frame);

		//now the bow can be reset again
		/*bow.canReset = true;
		if (quiver) {
			quiver.removeArrow();
		}*/
		bow.reset();
	});

	//determine a bunch of information about the hitCylinder's path to the ground:
	//find the velocity of the arrow-hitCylinder system (perfectly inelastic collision) from conservation of momentum
	var velocity = (ARROW_MASS*bow.velocity)/(ARROW_MASS + CYLINDER_MASS);

	//determine how far the system will travel in the y-direction (negative since the system falls down)
	var verticalDistance = -target.hitCylinder.position.y;

	//determine how long the system will take to reach the ground
	var fallTime = Math.abs(Math.sqrt(2*verticalDistance/Y_ACCEL));
	CYLINDER_TIME = fallTime*100 + 2*rotationTime;

	//determine how far the system will move in the negative z-direction
	var horizontalDistance = velocity*fallTime;

	//determine how far to rotate the system around its x-axis as it moves through the air
	var xRotation = bow.velocity/360;

	//determine the final x-component of the system's position
	var xFinal = horizontalDistance*xSign*Math.sin(Math.abs(bow.frame.rotation.y)) + target.hitCylinder.position.x;

	//finally, tween the system to its final position as calculated, rotating as it moves and rotating to the ground after it falls
	var finalPos = {x: xFinal, y: 0, z: -horizontalDistance};
	target.cylinderTween = new TWEEN.Tween(target.hitCylinder.position).to(finalPos, fallTime*100).onUpdate(function () {
		target.hitCylinder.rotateX(-degreesToRadians(xRotation));
	}).onStart(function () {
		//now the bow can't reset
		bow.canReset = false;

		//rotate the system about its y-axis as it falls
		var yRotationTween = new TWEEN.Tween(target.hitCylinder.rotation).to({y: bow.frame.rotation.y}, fallTime*100).start();
	}).onComplete(function () {
		target.hitCylinder.position.y = target.cylinderRadius;
	}).chain(target.rotationToGroundTween).start();

	//update the instructions
	var cylinString = this.cylindersNeeded == 1 ? " cylinder" : " cylinders";
	$('#top-instructions').html("You hit the target! " + this.cylindersNeeded + cylinString + " to go.");
}

/*
TableTarget.prototype.move()
Required target function
Purpose: empty - TableTargets don't move
	it just exists to fulfill the Target API
*/
TableTarget.prototype.move = function () {

}

/*
TableTarget.prototype.stop()
Required target function
Purpose: overrides the onComplete function of the rotationToGround tween
	so the instructions html doesn't get changed after the center advances to the next level
	the target doesn't "stop" because is was never moving, but still implements useful behavior
Parameters:
	bow (Bow): used to copy the arrow and reset the bow (required Target stop() parameter)
*/
TableTarget.prototype.stop = function (bow) {
	var target = this;
	this.rotationToGroundTween.onComplete(function () {
		//reset the bow's velocity so another arrow isn't added at the spot where it initially hit the hitCylinder in resetBow()
		bow.velocity = 0;

		//make a copy of the arrow to keep attached to the hitCylinder
		var arrow = bow.arrow.frame.clone();
		arrow.position.copy(bow.arrow.frame.position);
		target.hitCylinder.add(arrow);
		target.hitCylinder.remove(bow.arrow.frame);

		//add the bow's arrow back to the bow's frame
		bow.arrow.frame.position.set(bow.getArrowX(), 0, 0);
		bow.frame.add(bow.arrow.frame);

		//now the bow can be reset again
		bow.canReset = true;
	});
}

//**********//
//End TableTarget//
//**********//

//**********//
//MovingTarget//
//**********//

/*
MovingTarget()
Purpose: constructs a new MovingTarget object
	the frame contains a box-shaped target (similar to BoxTarget)
	frame origin: the center of the box
Parameters:
	width (number): the width of the box
	height (number): the height of the box
	depth (number): the depth of the box
	posFraction (Vector3): a vector containing the position of the MovingTarget's frame relative to 
		its parent ArcheryCenter frame, proportional to the size of the ArcheryCenter's frame (required Target property)
*/
function MovingTarget (width, height, depth, posFraction) {
	this.isComplete = false;
	this.posFraction = posFraction;
	this.instructions = "Hit the moving target.";

	this.width = width;
	this.height = height;
	this.depth = depth;

	var frame = new THREE.Object3D();

	var boxFrame = new THREE.Object3D();
	var boxGeom = new THREE.BoxGeometry(this.width, this.height, this.depth);
	var boxMat = createMaterial("target");
	var boxMesh = new THREE.Mesh(boxGeom, boxMat);
	boxMesh.name = "movingBoxMesh";
	boxFrame.add(boxMesh);
	boxFrame.name = "movingBox";
	this.box = boxFrame;
	frame.add(boxFrame);

	this.frame = frame;
}

/*
MovingTarget.prototype.isHit()
Required Target function
Purpose: returns true iff the MovingTarget's frame is hit by the arrow with the given position
Parameters:
	arrowPos (Vector3): the position of the arrow relative to the MovingTarget's frame's parent frame (the ArcheryCenter frame)
*/
MovingTarget.prototype.isHit = function (arrowPos) {
	return hitsBox(this, arrowPos, this.width, this.height, this.depth);
}

/*
MovingTarget.prototype.whenHit()
Required Target function
Purpose: defines the behavior of a MovingTarget when it is hit
	the box mesh falls down and backward when hit
Parameters:
	bow (Bow): the Bow that was used to hit the target (used to determine which way the box should fall)
*/
MovingTarget.prototype.whenHit = function (bow) {
	//stop moving
	this.stop();

	//indicate to the user that the target is hit (and complete)
	$('#top-instructions').html("You hit the target!");
	this.isComplete = true;
	this.newBox.getObjectByName("movingBoxMesh").material = textureMaterial("green_target.png");

	var target = this;

	//make the box fall down and backward - similar strategy to the whenHit() for TableTarget:

	//detach the bow's arrow as a child of the bow's frame, and attach it as a child of the newBox's frame
	bow.frame.remove(bow.arrow.frame);
	var arrowPos = bow.arrowWorldPosition();
	bow.arrow.frame.position.set(arrowPos.x - target.frame.position.x - target.newBox.position.x,
															 arrowPos.y - target.frame.position.y - target.newBox.position.y,
															 arrowPos.z - target.frame.position.z - target.newBox.position.z);
	bow.arrow.frame.translateZ(bow.arrow.arrowLength);
	target.newBox.add(bow.arrow.frame);

	//determine a bunch of information about the newBox's path to the ground:

	//determine which way the newBox travels in the x-direction based on the bow's y-rotation
	var xSign = 0;
	if (bow.frame.rotation.y < 0) {
		xSign = 1;
	} else if (bow.frame.rotation.y > 0) {
		xSign = -1;
	}

	//find the velocity of the arrow-newBox system (perfectly inelastic collision) from conservation of momentum
	var velocity = (ARROW_MASS*bow.velocity + MOVING_TARGET_MASS*MOVING_TARGET_SPEED)/(ARROW_MASS + MOVING_TARGET_MASS);

	//determine how far the system will travel in the y-direction (negative since the system falls down)
	var verticalDistance = -(target.frame.position.y + target.newBox.position.y);

	//determine how long the system will take to reach the ground
	var fallTime = Math.abs(Math.sqrt(2*verticalDistance/Y_ACCEL));
	CYLINDER_TIME = fallTime*100;

	//determine how far the system will move in the negative z-direction
	var horizontalDistance = velocity*fallTime;

	//determine the final x-component of the system's position
	var xFinal = horizontalDistance*xSign*Math.sin(Math.abs(bow.frame.rotation.y)) + target.newBox.position.x;

	var finalPos = {x: xFinal, y: verticalDistance, z: target.newBox.position.z - horizontalDistance};
	target.fallTween = new TWEEN.Tween(this.newBox.position).to(finalPos, fallTime*100).onUpdate(function () {
	}).onComplete(function () {
		//reset the bow's velocity so another arrow isn't added at the spot where it initially hit the newBox in resetBow()
		bow.velocity = 0;

		//make a copy of the arrow to keep attached to the newBox
		var arrow = bow.arrow.frame.clone();
		arrow.position.copy(bow.arrow.frame.position);
		target.newBox.add(arrow);
		target.newBox.remove(bow.arrow.frame);

		//add the bow's arrow back to the bow's frame, placed way off in the distance (the position will get reset in resetBow())
		bow.arrow.frame.position.set(0, 0, 10000);
		bow.frame.add(bow.arrow.frame);

		//now the bow can be reset again
		bow.canReset = true;
	}).start();
}

/*
MovingTarget.prototype.move()
Required Target function
Purpose: moves the MovingTarget's frame along a path in 3D-space
*/
MovingTarget.prototype.move = function () {
	//define the path the target moves along
	var points = [new THREE.Vector3(0, 0, 0)];
	for (var i = 0; i < 360; i+=5) {
		points.push(new THREE.Vector3(4.5*i, 300*Math.sin(degreesToRadians(i)), 200*Math.cos(degreesToRadians(i))));
	}

	//create the target's path
	this.path = new THREE.SplineCurve3(points);

	//tween the target so it moves along its path:
	var target = this;
	var time = {t: 0};

	//the time it takes the target to move once along its path
	var moveTime = target.path.getLength()/MOVING_TARGET_SPEED;

	//create a tween to move the target back and forth along its above-determined path
	target.moveTween = new TWEEN.Tween(time).to({t: 1}, moveTime).onUpdate(function () {
		target.box.position.copy(target.path.getPoint(time.t));
	}).onStop(function() {
		//apparently repeated tweens don't actually stop when their stop() method is called,
		//so use this strategy instead:

		//make a new box and put it at the same position the old box was at
		var newBox = target.box.clone();
		newBox.position.copy(target.box.position);
		newBox.name = "newBox";
		target.newBox = newBox;
		target.frame.add(newBox);

		//remove the old box from the target frame
		target.frame.remove(target.box);
	}).repeat(20).yoyo(true).start();
}

/*
MovingTarget.prototype.stop()
Required Target function
Purpose: stops the MovingTarget by stopping its moveTween
Parameters:
	bow (Bow): not used in this method, but required by the Target API
*/
MovingTarget.prototype.stop = function (bow) {
	this.moveTween.repeat(0).yoyo(false).stop();
}

//**********//
//End MovingTarget//
//**********//

/*
hitsBox()
Purpose: returns true iff the arrow with the given position hits the given target
	a helper function for the isHit() methods of the BoxTarget and MovingTarget
Parameters:
	target (Target object): the target to check for collision
	arrowPos (Vector3): the position of the arrow relative to the Target frame's parent frame
	width (number): the width of the box to check (the box may only be a portion of the Target frame)
	height (number): the height of the box
	depth (number): the depth of the box
*/
function hitsBox (target, arrowPos, width, height, depth) {
	var xMin = target.frame.position.x + target.box.position.x - 0.5*width;
	var xMax = target.frame.position.x + target.box.position.x + 0.5*width;
	var yMin = target.frame.position.y + target.box.position.y - 0.5*height;
	var yMax = target.frame.position.y + target.box.position.y + 0.5*height;
	var zMin = target.frame.position.z + target.box.position.z - 0.5*depth;
	var zMax = target.frame.position.z + target.box.position.z + 0.5*depth;
	var xGood = arrowPos.xMinArrow >= xMin && arrowPos.xMinArrow <= xMax || arrowPos.xMaxArrow >= xMax && arrowPos.xMaxArrow <= xMax;
	var yGood = arrowPos.yMinArrow >= yMin && arrowPos.yMinArrow <= yMax || arrowPos.yMaxArrow >= yMax && arrowPos.yMaxArrow <= yMax;
	var zGood = arrowPos.zMinArrow >= zMin && arrowPos.zMinArrow <= zMax || arrowPos.zMaxArrow >= zMax && arrowPos.zMaxArrow <= zMax; 
	return xGood && yGood && zGood;
}

//**********//
//End Targets//
//**********//
