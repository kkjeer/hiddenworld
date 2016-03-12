/*
Katherine Kjeer
CS 307 Final Project: Journey to the Seven Kingdoms
December 19, 2014
hidden_world_functions.js
Creates a three-dimensional model of the Hidden World.
*/

//globals that define the trees in the hidden world, 
//used to create and place objects within the hidden world 
//(all other trees within the hidden world clone the hwTree)
var hwTree;
var hwTreeHeight;
var hwTreeRadius;

/*
initGlobals()
Purpose: initializes the global tree variables according to boxSize
	so they can be used to create and place other objects within the hidden world
Parameters:
	boxSize (number): the size of the hidden world
*/
function initGlobals (boxSize) {
	hwTreeHeight = 0.85*boxSize;
	hwTreeRadius = 0.03*boxSize;
	hwTree = makeHWTree(hwTreeHeight, hwTreeRadius, "forest_bark", "forest_bark", "leaf_fern_light");
}

/*
makeHiddenWorld()
Purpose: returns an Object3D containing the hidden world model, including:
	a large box that encompasses the user's view (giving the illusion of being surrounded by a forest)
	several forests, each containing several trees (one including a river)
	a group of three hills
	a mountain
	two tents
	an archeryMark (a rotated bow)
	a swordMark (two crossed swords)
	a lake
	a meadow
	a stable
	origin: center of the ground
Parameters:
	boxSize (number): the width, height, and depth of the enclosing box
*/
function makeHiddenWorld (boxSize) {
	initGlobals(boxSize);
	var frame = new THREE.Object3D();

	//containing box
	var box = makeBox(boxSize, "sky.jpg", "forest.jpg", "forest_floor.jpg");
	box.position.set(0, 0.5*boxSize, 0);
	frame.add(box);

	//Upper left forest
	var ulForestWidth = 0.4*boxSize;
	var ulForestHeight = 0.45*boxSize;
	var ulForest = makeUpperLeftForest(ulForestWidth, ulForestHeight);
	ulForest.position.set(-0.5*boxSize, 0, -0.5*boxSize + ulForestHeight);
	frame.add(ulForest);

	//Lower left forest (containing the river)
	var llForestWidth = 0.4*boxSize;
	var llForestHeight = 0.55*boxSize;
	var llForest = makeLowerLeftForest(llForestWidth, llForestHeight, 5, 30, 40);
	llForest.position.set(-0.5*boxSize, 0, 0.5*boxSize - llForestHeight);
	frame.add(llForest);

	//Hills (group of three hills in the southeastern corner)
	var hillRadius = 0.1*boxSize;
	var hills = makeHWHills(0.25*boxSize, hillRadius, "bright_grass");
	hills.position.set(0.5*boxSize, 0, 0.5*boxSize);
	frame.add(hills);

	//Mountain next to the hills
	var mountainRadius = 0.07*boxSize;
	var mountain = makeCone(0, mountainRadius, 0.3*boxSize, 0, 0, "gray_wall");
	mountain.position.set(0.5*boxSize - 3*hillRadius - mountainRadius, 0, 0.5*boxSize - mountainRadius);
	frame.add(mountain);

	//add the tents:
	var tentRadius = 0.1*boxSize;

	//archery tent
	var archeryTent = makeTent(0.25*boxSize, tentRadius, 7*Math.PI/4, "burlap");
	archeryTent.position.set(-0.25*boxSize, 0, -0.5*tentRadius);
	frame.add(archeryTent);

	//sword tent
	var swordTent = archeryTent.clone();
	swordTent.position.set(0, 0, -2*tentRadius);
	frame.add(swordTent);

	//add the archery mark
	var archeryHeight = 0.25*boxSize;
	var archeryWidth = 0.5*tentRadius;
	var archeryMark = makeArcheryMark(archeryHeight, archeryWidth, 0.07*tentRadius, "red_wood");
	archeryMark.name = "archeryMark";
	archeryMark.position.set(-0.25*boxSize + 0.5*archeryWidth, 0.6*archeryHeight, 2*tentRadius);
	frame.add(archeryMark);
	
	//add the sword mark
	var swordMark = makeSwordMark(0.3*boxSize, 0.03*boxSize, 0.003*boxSize);
	swordMark.position.set(0.1*boxSize, 0, 1.5*tentRadius);
	frame.add(swordMark);

	//add the lake
	var lakeX = 0.2*boxSize;
	var lakeZ = 0.15*boxSize;
	var lakeY = 0.005*boxSize;
	var lake = makeLake(lakeX, lakeZ, lakeY, "blue_coral1", 8, 8);
	lake.position.set(-0.5*lakeX, 2*lakeY, 1.5*lakeZ);
	frame.add(lake);

	//add the upper right triangle of trees
	var urForestWidth = 0.4*boxSize;
	var urForestHeight = 0.35*boxSize;
	addTriangleTrees(frame, 10, new THREE.Vector3(0.5*boxSize, 0, -0.5*boxSize),
															new THREE.Vector3(0.5*boxSize, 0, -0.5*boxSize + urForestHeight),
															new THREE.Vector3(0.5*boxSize - urForestWidth, 0, -0.5*boxSize));

	//add the stable
	var stableWidth = 0.23*boxSize;
	var stableHeight = 0.3*boxSize;
	var stableDepth = 0.1*boxSize;
	var stable = makeStable(stableWidth, stableHeight, stableDepth, "rough_wood");
	stable.position.set(0.45*boxSize - 0.5*stableWidth, 0, tentRadius + stableDepth);
	frame.add(stable);

	//add the meadow - a green lake
	var meadowX = 0.5*boxSize - swordTent.position.x - tentRadius;
	var meadowZ = 0.6*boxSize - urForestHeight;
	var meadowY = 0.004*boxSize;
	var meadow = makeLake(meadowX, meadowZ, meadowY, "bright_grass", 6, 6);
	meadow.position.set(0.5*boxSize - meadowX, 2*meadowY, -0.5*boxSize + urForestHeight);
	frame.add(meadow);
	
	return frame;
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
  for (var i = 0; i < numBranches; i++) {
  	//define randomized branch parameters and create the branch
  	var branchLength = (Math.random()*0.2 + 0.2)*treeHeight;
  	var branchRadius = (Math.random()*0.2 + 0.4)*treeRadius;
  	var branchCurvature = (Math.random()*0.2 + 0.2)*branchLength;
  	var numLeaves = Math.floor(Math.random()*2 + 3);
  	var branch = makeBranch(branchLength, branchRadius, branchCurvature, branchImage, numLeaves, leafImage, 0.3);

  	//position and rotate the branch along the cylindrical trunk
  	var branchHeight = (Math.random()*0.2 + 0.6)*treeHeight;
  	branch.position.set(0, branchHeight, 0);
  	branch.rotateY(Math.random()*2*Math.PI - 2*Math.PI);
  	branch.rotateZ(Math.random()*2*Math.PI - 2*Math.PI);
  	treeFrame.add(branch);
  }

	return treeFrame;
} 

/*
makeUpperLeftForest()
Purpose: returns an Object3D containing several trees
	placed in the northwest corner of the hidden world
	origin: lower left corner (aligns with the left edge of the hidden world)
Parameters:
	width (number): the length along the x-axis of the triangle that encloses the forest
	height (number): the length along the z-axis of the triangle that encloses the forest
*/ 
function makeUpperLeftForest (width, height) {
	var frame = new THREE.Object3D();

	//create a curve that defines the border of the forest
	//this curve is not added to the frame in any way, it is just used to place the trees
	var borderPoints = [new THREE.Vector3(0, 0, 0),
												new THREE.Vector3(0.5*width + 2*hwTreeRadius, 0, -0.25*height),
												new THREE.Vector3(0.9*width + 2*hwTreeRadius, 0, -0.65*height),
												new THREE.Vector3(width, 0, -height)];
	var borderCurve = new THREE.CubicBezierCurve3(borderPoints[0], borderPoints[1], borderPoints[2], borderPoints[3]);

	//add trees in the triangular forest
	addTriangleTrees(frame, 6, new THREE.Vector3(0, 0, 0), 
														 new THREE.Vector3(0, 0, -height), 
														 new THREE.Vector3(width, 0, -height));
	//add trees along the border so it's actually apparent that the forest has a curved border
	addBorderTrees(frame, borderCurve, 4);

	return frame;
}

/*
makeLowerLeftForest()
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
function makeLowerLeftForest (width, height, numPoints, oscillation, radius) {
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
	var mesh = new THREE.Mesh(geom, mat);

	//rotate the river so it lines up with the western and southern edges of the hidden world
	var angle = new THREE.Vector3(width, 0, 0).angleTo(riverEnd);
	mesh.rotateY(-angle);

	//rotate the river so it oscillates in the xz-plane instead of the xy-plane, and add it to the frame
	mesh.rotateX(Math.PI/2);
	frame.add(mesh);
	//End River

	addTriangleTrees(frame, 8, new THREE.Vector3(hwTreeRadius, 0, radius + hwTreeRadius + oscillation), 
														 new THREE.Vector3(width-radius-hwTreeRadius-oscillation, 0, height - hwTreeRadius),
														 new THREE.Vector3(hwTreeRadius, 0, height - hwTreeRadius));

	return frame;
}

/*
addTriangleTrees()
Purpose: adds numTrees trees at random points within the triangle defined by a, b, and c
	helper for makeUpperLeftForest() and makeLowerLeftForest()
Parameters:
	frame (Object3D): the frame to add the trees to
	numTrees (integer): the number of trees to add
	a (Vector3): one point on the triangle to add the trees within
	b (Vector3): one point on the triangle to add the trees within
	c (Vector3): one point on the triangle to add the trees within
*/
function addTriangleTrees (frame, numTrees, a, b, c) {
	var points = randomPointsInTriangle(a, b, c, numTrees);
	for (var i = 0; i < points.length; i++) {
		//clone the hwTree
		var tree = hwTree.clone();

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
	helper for makeUpperLeftForest() and makeLowerLeftForest()
Parameters:
	frame (Object3D): the frame to add the trees to
	borderCurve (Curve): the curve the trees are placed along
	numBorderTrees (integer): the number of trees to add
*/
function addBorderTrees (frame, borderCurve, numBorderTrees) {
	var curvePoints = borderCurve.getSpacedPoints(numBorderTrees + 1);
	for (var i = 1; i <= numBorderTrees; i++) {
		var tree = hwTree.clone();
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
function addQuadTrees (frame, numInnerTrees, minX, maxX, minZ, maxZ) {
	for (var j = 0; j < numInnerTrees; j++) {
		var innerTree = hwTree.clone();
		var treeX = randomInRange(minX, maxX);
		var treeZ = randomInRange(minZ, maxZ);
		innerTree.position.set(treeX, 0, treeZ);
		innerTree.rotateY(Math.random()*2*Math.PI);
		frame.add(innerTree);
	}
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

	//define the function that creates the vectors on the lake surface
  radialWave = function (u, v) {
  	//x and z both lie within a width*height rectangle
    var x = u*width;
    var z = v*height;

    //adjust the z-coordinate so it is bounded by two sine curves, offset by 0.5*height
    var zRange = Math.sin(u*Math.PI)*height/2;
    //var zRange = (height)*Math.sqrt(1 - (x - 0.5*width)*(x - 0.5*width)/(width*width)) - 0.5*height;
    var zMin = 0.5*height - zRange;
    var zMax = 0.5*height + zRange;
    if (z < zMin) {
    	z = zMin;
    }
    if (z > zMax) {
    	z = zMax;
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

  return frame;
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