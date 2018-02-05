/*
Katherine Kjeer
2014
event_handlers.js
Controls the behavior associated with each key press the user makes during the game
*/

//******//
//GLOBALS//
//******//

var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

var hwHTML = "Welcome to the Hidden World! Here, the Dragon Shadows train to become the most skilled inhabitants " + 
    					"of the Seven Kingdoms. Click the buttons to tour the Hidden World or train in archery or sword-fighting.";
						 
var hwButtonsHTML = "<button class='btn mybtn' id='tourButton' type='button'>" + 
											"<img class='btnimage' src='Images/newHW.png'alt='hw'>Tour</button>" +
										"<button class='btn mybtn' id='archeryButton' type='button'>" + 
											"<img class='btnimage' src='Images/bowPic.png'alt='bow'>Archery training</button>" + 
						 				"<button class='btn mybtn' id='swordButton' type='button'>" + 
						 				"<img class='btnimage' src='Images/swordPic.png'alt='sword'>Sword training</button>" + 
						 				"<button class='btn mybtn' id='resetButton' type='button'>" +  
      								"<img class='btnimage' src='Images/initialHW.png' alt='reset'>Reset</button>";

var archeryHTML = mobile ? "Welcome to archery training! Drag to aim the bow, swipe in any direction to draw back, and tap the screen to shoot. " : 
									"Welcome to archery training! Move the mouse (or press the <b>arrow keys</b>) to aim the bow, click and hold (or press <b>d</b>) to draw back, and release the mouse (or press <b>r</b>) to shoot. ";
var archeryButtonsHTML = "<button class='btn mybtn' id='startButton' type='button'>" + 
														"<img class='btnimage' src='Images/bowPic.png'alt='bow'>Restart training</button>" + 
													"<button class='btn mybtn' id='backToHWButton' type='button'>" + 
														"<img class='btnimage' src='Images/newHW.png'alt='hw'>Back to the Hidden World</button>";

var str = mobile ? 'swipe' : 'drag the mouse';
var swordHTML = "Welcome to sword training! To play, " + str + " in the direction your sword should move to respond to the teacher's sword. ";

var swordButtonsHTML = "<button class='btn mybtn' id='demoButton' type='button'>" + 
													"<img class='btnimage' src='Images/teacherSword.png'alt='demo'>Play demos</button>" + 
												"<button class='btn mybtn' id='startButton' type='button'>" + 
													"<img class='btnimage' src='Images/studentSword.png'alt='start'>Start training</button>" + 
												"<button class='btn mybtn' id='backToHWButton' type='button'>" + 
														"<img class='btnimage' src='Images/newHW.png'alt='hw'>Back to the Hidden World</button>";

//to determine how far the hiddenWorld can move and rotate in one step
var cameraRotationStep = 5; //in degrees
var cameraMotionStep = 15; //in arbitrary units

//to limit moving/rotating the hiddenWorld
var hwLowerRotationLimit = -4*degreesToRadians(cameraRotationStep);
var hwUpperRotationLimit = 12*degreesToRadians(cameraRotationStep);

//to determine how var the archeryCenter's Bow can move and rotate in one step
var arrowStep = 0.5; //in degrees

//to limit how far the bow can rotate in the x-direction
var MAX_BOW_ROT_X = 0.8726646259971648;; //in radians
var MIN_BOW_ROT_X = -0.6981317007977318 //in radians

//to limit how far the bow can rotate in the y-direction
var MAX_BOW_ROT_Y = 1.483529864195193; //in radians
var MIN_BOW_ROT_Y = -1.483529864195193; //in radians

//the kind of easing the tween animations use
var TWEEN_EASING = TWEEN.Easing.Circular.Out;

//how long it takes to transition between the map, hiddenWorld, archeryCenter, and swordCenter
var worldAppearTime = 2500; //in milliseconds

//to make sure that certain hiddenWorld events can only happen while the user is in the hiddenWorld,
//e.g. the user can't go straight from the map to the archeryCenter or swordCenter
var inHW = false;

var inArcheryCenter = false;
var inSwordCenter = false;

/*
swipeDirections format:
direction of swipe: {current move: [possible next moves]}
example:
'left': {'up': ['left', 'cross']} means
if the user swiped left and the current student position is up, the next move is either left or cross
*/
var swipeDirections = {'left': {'up': ['left', 'cross'], 
																'down': ['left'], 
																'left': ['left'], 
																'right': ['left', 'cross', 'attack', 'parry'], 
																'cross': ['left'],
																'attack': ['left', 'cross'],
																'parry': ['left', 'cross']},

											'right': {'up': ['right'], 
																'down': ['right'], 
																'left': ['right', 'cross', 'attack', 'parry'], 
																'right': ['right'], 
																'cross': ['right', 'parry'],
																'attack': ['right', 'parry'],
																'parry': ['right']},

											'up': {'up': ['up'], 
															'down': ['up', 'cross', 'attack', 'parry'], 
															'left': ['up', 'cross', 'attack'], 
															'right': ['up', 'cross', 'attack'], 
															'cross': ['up', 'attack'],
															'attack': ['up', 'cross', 'parry'],
															'parry': ['up', 'cross', 'attack']},

											'down': {'up': ['down', 'cross', 'attack', 'parry'], 
																'down': ['down'], 
																'left': ['down'], 
																'right': ['down'], 
																'cross': ['down', 'attack', 'parry'],
																'attack': ['down', 'parry'],
																'parry': ['attack', 'down']}};

var oldMouse = new THREE.Vector2();
var currentMouse = new THREE.Vector2();

//******//
//END GLOBALS//
//******//

//******//
//For determining which functions are bound to which events, depending on the current world//
//******//

/*
hiddenWorldEvents()
Purpose: binds the functions corresponding to hiddenWorld key presses to the keydown event
*/
function hiddenWorldEvents () {
	document.removeEventListener('keydown');
	document.removeEventListener('mousemove');
	document.removeEventListener('mousedown');
	document.removeEventListener('mouseup');
	if (!mobile) {
		document.removeEventListener('keydown', archeryKeyDown);
		document.addEventListener('keydown', hwKeyDown, false);
	}
	hwButtons();
}

function hwKeyDown (event) {
	exploreHW(event);
}

function exploreHW (event) {
	event.preventDefault();
	var code = event.keyCode;
	var letter = String.fromCharCode(code);
	switch (code) {
		//up
		case 38:
			hiddenWorld.explore("moveUpDown", 2*cameraMotionStep);
			break;

		//down
		case 40:
			hiddenWorld.explore("moveUpDown", -2*cameraMotionStep);
			break;

		//left
		case 37:
			hiddenWorld.explore("moveLeftRight", 2*cameraMotionStep);
			break;

		//right
		case 39:
			hiddenWorld.explore("moveLeftRight", -2*cameraMotionStep);
			break;
		default:
			switch (letter) {
				case 'u':
				case 'U':
					hiddenWorld.explore("rotateUpDown", -degreesToRadians(2*cameraRotationStep));
					break;
				case 'd':
				case 'D':
					hiddenWorld.explore("rotateUpDown", degreesToRadians(2*cameraRotationStep));
					break;
				case 'l':
				case 'L':
					hiddenWorld.explore("rotateLeftRight", -degreesToRadians(2*cameraRotationStep));
					break;
				case 'r':
				case 'R':
					hiddenWorld.explore("rotateLeftRight", degreesToRadians(2*cameraRotationStep));
			}
	}
}

function hiddenWorldSwipe () {
	$('#scene-div').swipe({
		swipeLeft: function (event, direction, distance, duration, fingerCount) {
			hiddenWorld.explore("left", -degreesToRadians(2*cameraRotationStep));
		},
		swipeRight: function (event, direction, distance, duration, fingerCount) {
			hiddenWorld.explore("right", degreesToRadians(2*cameraRotationStep));
		},
		swipeUp: function (event, direction, distance, duration, fingerCount) {
			hiddenWorld.explore("up", 2*cameraMotionStep);
		},
		swipeDown: function (event, direction, distance, duration, fingerCount) {
			hiddenWorld.explore("down", 2*cameraMotionStep);
		}
	});
}

/*
archeryEvents()
Purpose: binds the functions corresponding to archeryCenter key presses to the keydown event
*/
function archeryEvents () {
	inArcheryCenter = true;
	document.removeEventListener('mousemove');
	document.removeEventListener('mousedown');
	document.removeEventListener('mouseup');
	if (mobile) {
		archeryMobileEvents();
	} else {
		archeryMouseEvents();
		document.removeEventListener('keydown', hwKeyDown);
		document.addEventListener('keydown', archeryKeyDown, false);
	}
}

/*
swordEvents()
Purpose: binds the functions corresponding to swordCenter key presses to the keydown event
*/
function swordEvents () {
	inSwordCenter = true;
	document.removeEventListener('keydown');
	document.removeEventListener('mousemove');
	document.removeEventListener('mousedown');
	document.removeEventListener('mouseup');
	document.removeEventListener('click');
	fancySwordSwipe();
}

//******//
//Event handlers for each world//
//******//

function hwButtons (event) {
	$('.mybtn').unbind('click');
	$('.mybtn').click(function () {
		$(this).blur();
	});

	$('#tourButton').click(function () {
		$(this).prop('disabled', true);
		$('#archeryButton').prop('disabled', true);
		$('#swordButton').prop('disabled', true);
		hiddenWorld.tour();
	});

	$('#archeryButton').click(function () {
		fromHWToCenter(archeryCenter,
										 function () {
											$('#top-instructions').html(archeryHTML);
											$('#top-buttons').html(archeryButtonsHTML);
											archeryButtons();
											if (archeryCenter.finished) {
												$('#startButton').prop('disabled', false);
												$('#top-instructions').html('Click <b>Restart training</b> to replay archery training');
											}
										}, archeryEvents);
	});

	$('#swordButton').click(function () {
		fromHWToCenter(swordCenter,
										 function () {
										 	var str = mobile ? 'swipe' : 'drag the mouse';
											$('#top-instructions').html(swordHTML);
											$('#top-buttons').html(swordButtonsHTML);
											swordButtons();
										}, swordEvents);
	});

	$('#resetButton').click(function () {
		$('#tourButton').prop('disabled', false);
		$('#archeryButton').prop('disabled', false);
		$('#swordButton').prop('disabled', false);
		TWEEN.removeAll();
		hiddenWorld.reset();
	});
}

function archeryButtons (event) {
	$('.mybtn').unbind('click');
	$('.mybtn').click(function () {
		$(this).blur();
	});

	$('#startButton').prop('disabled', true);

	$('#startButton').click(function () {
		$(this).prop('disabled', true);
		if (archeryCenter.finished) {
			if (mobile) {
				resetArcheryCenter();
				archeryMouseEvents();
			} else {
				setTimeout(function () {
					resetArcheryCenter();
					archeryMouseEvents();
				}, 1500);
			}
		}
	})

	$('#backToHWButton').click(function () {
		fromCenterToHW(archeryCenter);
	});
}

function swordButtons (event) {
	$('.mybtn').unbind('click');
	$('.mybtn').click(function () {
		$(this).blur();
	});

	$('#demoButton').click(function () {
		if (swordCenter.canPlayDemos) {
			swordCenter.playDemos();
		}
	});

	$('#startButton').click(function () {
		if (swordCenter.canPressSpace) {
			swordCenter.teacherSword.canMove = true;
			swordCenter.studentSword.canMove = true;
			swordCenter.canPlayDemos = false;
			swordCenter.canPressSpace = false;
			$('#top-instructions').html('Choose the correct response to the teacher\'s sword move.');
			swordCenter.teacherMove();
		}
	});

	$('#backToHWButton').click(function () {
		swordCenter.reset();
		fromCenterToHW(swordCenter);
	});
}

function archeryMouseEvents (event) {
	function mouseMove (event) {
		if (!inArcheryCenter)
			return;

		if (!(archeryCenter.bow.canRelease && archeryCenter.finished == false)) {
			return;
		}

		var minX = archeryCenter.bowMinX;
		var maxX = archeryCenter.bowMaxX;
		var minY = 0;//$('#top-instructions').height() + $('#scene-div').height() - archeryCenter.bowMaxY;
		var maxY = $('#top-instructions').height() + $('#scene-div').height() - archeryCenter.bowMinY;
		if (event.pageX < minX || event.pageX > maxX || event.pageY < minY || event.pageY > maxY) {
			return;
		}

		oldMouse.x = currentMouse.x;
		oldMouse.y = currentMouse.y;
		currentMouse.x = event.pageX;
		currentMouse.y = event.pageY;
		//left
		if (currentMouse.x < oldMouse.x && archeryCenter.bow.frame.rotation.y <= MAX_BOW_ROT_Y - degreesToRadians(arrowStep)) {
			archeryCenter.bow.frame.rotateY(degreesToRadians(arrowStep));
		} 
		//right
		else if (currentMouse.x > oldMouse.x && archeryCenter.bow.frame.rotation.y >= MIN_BOW_ROT_Y + degreesToRadians(arrowStep)) {
			archeryCenter.bow.frame.rotateY(-degreesToRadians(arrowStep));
		}
		//up
		if (currentMouse.y < oldMouse.y && archeryCenter.bow.frame.rotation.x <= MAX_BOW_ROT_X - degreesToRadians(arrowStep)) {
			archeryCenter.bow.frame.rotateX(degreesToRadians(arrowStep));
		} 
		//down
		else if (currentMouse.x > oldMouse.x && archeryCenter.bow.frame.rotation.y >= MIN_BOW_ROT_Y + degreesToRadians(arrowStep)) {
			archeryCenter.bow.frame.rotateX(-1.5*degreesToRadians(arrowStep));
		}
	}
	$('#scene-div').mousemove(mouseMove);

	function mouseDown (event) {
		if (!inArcheryCenter)
			return;

		if (archeryCenter.bow.canRelease && archeryCenter.finished == false) {
			archeryCenter.bow.drawArrow();
		}
	}
	$('#scene-div').mousedown(mouseDown);
	
	function mouseUp (event) {
		if (!inArcheryCenter)
			return;

		if (archeryCenter.bow.canRelease && archeryCenter.finished == false) {
			archeryCenter.releaseArrow();
		}
	}
	$('#scene-div').mouseup(mouseUp);

	function click (event) {
		if (!inArcheryCenter)
			return;

		if (archeryCenter.finished == false && archeryCenter.bow.canReset) {
			archeryCenter.resetBow();
		}
	}
	$('#scene-div').click(click);
}

function archeryMobileEvents (event) {
	//vmousemove --> move bow
	$('#scene-div').on('vmousemove', function (event) {
		event.preventDefault();
		if (!(archeryCenter.bow.canRelease && archeryCenter.finished == false)) {
			return;
		}

		var minX = archeryCenter.bowMinX;
		var maxX = archeryCenter.bowMaxX;
		var minY = $('#top-instructions').height() + $('#scene-div').height() - archeryCenter.bowMaxY;
		var maxY = $('#top-instructions').height() + $('#scene-div').height() - archeryCenter.bowMinY;
		if (event.pageX < minX || event.pageX > maxX || event.pageY < minY || event.pageY > maxY) {
			return;
		}

		oldMouse.x = currentMouse.x;
		oldMouse.y = currentMouse.y;
		currentMouse.x = event.pageX;
		currentMouse.y = event.pageY;
		//left
		if (currentMouse.x < oldMouse.x && archeryCenter.bow.frame.rotation.y <= MAX_BOW_ROT_Y - degreesToRadians(arrowStep)) {
			archeryCenter.bow.frame.rotateY(degreesToRadians(arrowStep));
		} 
		//right
		else if (currentMouse.x > oldMouse.x && archeryCenter.bow.frame.rotation.y >= MIN_BOW_ROT_Y + degreesToRadians(arrowStep)) {
			archeryCenter.bow.frame.rotateY(-degreesToRadians(arrowStep));
		}
		//up
		if (currentMouse.y < oldMouse.y && archeryCenter.bow.frame.rotation.x <= MAX_BOW_ROT_X - degreesToRadians(arrowStep)) {
			archeryCenter.bow.frame.rotateX(degreesToRadians(arrowStep));
		} 
		//down
		else if (currentMouse.x > oldMouse.x && archeryCenter.bow.frame.rotation.y >= MIN_BOW_ROT_Y + degreesToRadians(arrowStep)) {
			archeryCenter.bow.frame.rotateX(-degreesToRadians(arrowStep));
		}
	});
	
	//tap --> release arrow
	$('#scene-div').on('tap', function (event) {
		if (archeryCenter.bow.canRelease && archeryCenter.finished == false) {
			archeryCenter.releaseArrow();
		}
	});

	//swipe (in any direction) --> draw arrow
	$('#scene-div').swipe({
		swipeLeft: function (event, direction, distance, duration, fingerCount) {
			if (archeryCenter.bow.canRelease && archeryCenter.finished == false) {
				archeryCenter.bow.drawArrow();
			}
		},
		swipeRight: function (event, direction, distance, duration, fingerCount) {
			if (archeryCenter.bow.canRelease && archeryCenter.finished == false) {
				archeryCenter.bow.drawArrow();
			}
		},
		swipeUp: function (event, direction, distance, duration, fingerCount) {
			if (archeryCenter.bow.canRelease && archeryCenter.finished == false) {
				archeryCenter.bow.drawArrow();
			}
		},
		swipeDown: function (event, direction, distance, duration, fingerCount) {
			if (archeryCenter.bow.canRelease && archeryCenter.finished == false) {
				archeryCenter.bow.drawArrow();
			}
		},
	});
}

/*
archeryKeyDown()
Purpose: associates various functions of the archeryCenter with the keys that the user can press during archery training
Parameters:
	event (event): the event triggered by the key press
*/
function archeryKeyDown (event) {
	event.preventDefault();
	var code = event.keyCode;
	var ch = String.fromCharCode(code).toLowerCase();
	switch (ch) {
		//draw the arrow back
		case 'd':
			if (archeryCenter.bow.canRelease && archeryCenter.finished == false) {
				archeryCenter.bow.incrementArrow();
			}
			break;

		//release the arrow
		case 'r':
			if (archeryCenter.bow.canRelease && archeryCenter.finished == false) {
				archeryCenter.releaseArrow();
			}
			break;

		//aim the bow using the arrow keys
		default:
			adjustBow(event);
	}
}

/*
adjustBow()
Purpose: rotates the archeryCenter's Bow up, down, left or right using the arrow keys
Parameters:
	event (event): the event triggered by the key press
*/
function adjustBow (event) {
	event.preventDefault();
	if (archeryCenter.finished == true) {
		return;
	}
	var code = event.keyCode;
	switch (code) {
		//up - positive x-rotation
		case 38:
			if (archeryCenter.bow.frame.rotation.x <= MAX_BOW_ROT_X - degreesToRadians(arrowStep)) {
				archeryCenter.bow.frame.rotateX(2*degreesToRadians(arrowStep));
			}
			break;

		//down - negative x-rotation
		case 40:
			if (archeryCenter.bow.frame.rotation.x >= MIN_BOW_ROT_X + degreesToRadians(arrowStep)) {
				archeryCenter.bow.frame.rotateX(-2*degreesToRadians(arrowStep));
			}
			break;

		//left - positive y-rotation
		case 37:
			if (archeryCenter.bow.frame.rotation.y <= MAX_BOW_ROT_Y - degreesToRadians(arrowStep)) {
				archeryCenter.bow.frame.rotateY(2*degreesToRadians(arrowStep));
			}
			break;

		//right - negative y-rotation
		case 39:
			if (archeryCenter.bow.frame.rotation.y >= MIN_BOW_ROT_Y + degreesToRadians(arrowStep)) {
				archeryCenter.bow.frame.rotateY(-2*degreesToRadians(arrowStep));
			}
			break;
	}
}

function fancySwordSwipe (event) {
	$("#scene-div").swipe({
    swipeLeft: function (event, direction, distance, duration, fingerCount) {
    	if (!inSwordCenter)
    		return;

    	var moves = swipeDirections.left[swordCenter.currentStudentDirection];
    	if (moves.length == 1) {
    		swordCenter.studentMove(moves[0]);
    	} else {
    		var moved = false;
    		for (var m in moves) {
    			if (swordCenter.correctDirection == moves[m]) {
    				swordCenter.studentMove(moves[m]);
    				moved = true;
    			}
    		}
    		if (!moved) {
    			swordCenter.studentMove(moves[0]);
    		}
    	}
    },
    swipeRight: function (event, direction, distance, duration, fingerCount) {
    	if (!inSwordCenter)
    		return;
    	
    	var moves = swipeDirections.right[swordCenter.currentStudentDirection];
    	if (moves.length == 1) {
    		swordCenter.studentMove(moves[0]);
    	} else {
    		var moved = false;
    		for (var m in moves) {
    			if (swordCenter.correctDirection == moves[m]) {
    				swordCenter.studentMove(moves[m]);
    				moved = true;
    			}
    		}
    		if (!moved) {
    			swordCenter.studentMove(moves[0]);
    		}
    	}
    },
    swipeUp: function (event, direction, distance, duration, fingerCount) {
    	if (!inSwordCenter)
    		return;
    	
    	var moves = swipeDirections.up[swordCenter.currentStudentDirection];
    	if (moves.length == 1) {
    		swordCenter.studentMove(moves[0]);
    	} else {
    		var moved = false;
    		for (var m in moves) {
    			if (swordCenter.correctDirection == moves[m]) {
    				swordCenter.studentMove(moves[m]);
    				moved = true;
    			}
    		}
    		if (!moved) {
    			swordCenter.studentMove(moves[0]);
    		}
    	}
    },
    swipeDown: function (event, direction, distance, duration, fingerCount) {
    	if (!inSwordCenter)
    		return;
    	
    	var moves = swipeDirections.down[swordCenter.currentStudentDirection];
    	if (moves.length == 1) {
    		swordCenter.studentMove(moves[0]);
    	} else {
    		var moved = false;
    		for (var m in moves) {
    			if (swordCenter.correctDirection == moves[m]) {
    				swordCenter.studentMove(moves[m]);
    				moved = true;
    			}
    		}
    		if (!moved) {
    			swordCenter.studentMove(moves[0]);
    		}
    	}
    },
  });
}

//******//
//For moving between the hiddenWorld and the two training centers (archeryCenter and swordCenter)
//******//

/*
fromHWToCenter()
Purpose: animates moving from the hiddenWorld to the given center (e.g. archeryCenter or swordCenter)
	after the animation is done, the hiddenWorld will be in the backViewPosition 
	and the center's frame will be in the inViewPosition
Parameters:
	center: (ArcheryCenter or SwordCenter): the center to move to
	htmlFunction (function): the function to execute after the animation completes
		(modifies the top-instructions html based on the given center)
	eventFunction (function): the function to run that binds the center's events to the keydown event
*/
function fromHWToCenter (center, htmlFunction, eventFunction) {
	//make the center visible
	center.frame.traverse(function (object) {object.visible = true;});

	//stop animating things within the Hidden World
	hiddenWorld.stopAnimation();

	$('#top-instructions').html('');
	$('#top-buttons').html('');

	//create a tween to move the hiddenWorld out of view
	var finalPosHW = {x: frontViewPosition.x, y: frontViewPosition.y, z: frontViewPosition.z};
	var tweenHW = new TWEEN.Tween(hiddenWorld.frame.position).to(finalPosHW, 0.25*worldAppearTime);
	tweenHW.onComplete(function () {
		hiddenWorld.frame.traverse(function (object) {object.visible = false;});
		backgroundMesh.visible = false;
	});

	//create a tween to move the center into view
	var finalPosCenter = {x: inViewPosition.x, y: inViewPosition.y, z: inViewPosition.z};
	var tweenCenter = new TWEEN.Tween(center.frame.position).to(finalPosCenter, worldAppearTime);
	tweenCenter.easing(TWEEN_EASING);
	tweenCenter.onComplete(function () {
		$(htmlFunction);
		$(eventFunction);
	});

	//after the hiddenWorld is moved out of the way, start moving the center
	tweenHW.chain(tweenCenter);

	//start the whole process
	tweenHW.start();

	inHW = false;
}

/*
fromCenterToHW()
Purpose: animates moving from the given center (e.g. archeryCenter or swordCenter) back to the hiddenWorld
	after the animation is done, the center's frame will be in the backViewPosition 
	and the hiddenWorld will be in the hwPosition
Parameters:
	center: (ArcheryCenter or SwordCenter): the center to move away from
*/
function fromCenterToHW (center) {
	inArcheryCenter = false;
	inSwordCenter = false;

	//make the hiddenWorld visible
	hiddenWorld.frame.traverse(function (object) {object.visible = true;});

	$('#top-instructions').html('');
	$('#top-buttons').html('');

	//create a tween to move the center out of view (to the back)
	var finalPosCenter = {x: backViewPosition.x, y: backViewPosition.y, z: backViewPosition.z};
	var tweenCenter = new TWEEN.Tween(center.frame.position).to(finalPosCenter, 0.2*worldAppearTime)
	tweenCenter.onComplete(function () {
		center.frame.traverse(function (object) {object.visible = false;});
		backgroundMesh.visible = true;
	});

	//create a tween to move the hiddenWorld into view
	var finalPosHW = {x: hwPosition.x, y: hwPosition.y, z: hwPosition.z};
	var tweenHW = new TWEEN.Tween(hiddenWorld.frame.position).to(finalPosHW, worldAppearTime);
	tweenHW.onStart(function () {
		hiddenWorld.reset();
	});
	tweenHW.easing(TWEEN_EASING);
	tweenHW.onComplete(function () {
		$('#top-instructions').html(hwHTML);
		$('#top-buttons').html(hwButtonsHTML);
		hwButtons();
	});

	//after the center is moved out of the way, start moving the hiddenWorld
	tweenCenter.chain(tweenHW);

	inHW = true;

	//start the whole process
	tweenCenter.start();
	hiddenWorldEvents();
}

//******//
//To reset the archeryCenter//
//******//

/*
resetArcheryCenter()
Purpose: resets the global archeryCenter back to its original state so the user can restart archery training
*/
function resetArcheryCenter () {
	//remove the current archeryCenter from the scene
	scene.remove(archeryCenter.frame);

	//remake the archeryCenter the way it was initially:
	//reset the targets (they were changed during the training)
	archeryTargets = [new BoxTarget(0.5*sceneParams.hwSize, 0.15*sceneParams.hwSize, 
                                    0.15*sceneParams.hwSize, 0.1*sceneParams.hwSize, 
                                    "target", new THREE.Vector3(0, 0, -0.25)),
                      new TableTarget(0.22*sceneParams.hwSize, 0.4*sceneParams.hwSize, 0.05*sceneParams.hwSize, 
                                      5, new THREE.Vector3(0.05, 0, -0.25)),
                      new MovingTarget(0.1*sceneParams.hwSize, 0.1*sceneParams.hwSize, 0.1*sceneParams.hwSize,
                                        new THREE.Vector3(-0.4, 0.5, -0.25))];

	//reset the bow
	var archeryBow = new Bow(0.25*sceneParams.hwSize, 0.06*sceneParams.hwSize, 0.009*sceneParams.hwSize, "red_wood", true);

	//reset the whole center
  archeryCenter = new ArcheryCenter(sceneParams.hwSize, archeryBow, archeryTargets[0]);

  //place the archeryCenter in view and add it to the scene
  archeryCenter.frame.position.copy(inViewPosition); 
  scene.add(archeryCenter.frame);

  //reset the top instructions with the welcome to archery training
  $('#top-instructions').html(archeryHTML);
}
