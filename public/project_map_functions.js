//******GLOBALS******//

//to tell when to invoke the event handler in textureMaterial()
var numTexturesToLoad = 0;
var texturesLoaded = 0;

//global textured materials (to avoid loading the same texture multiple times)
//for now, using hardcoded file names to load the textures
//fix this later
var mapMaterialGlobal = textureMaterial("parchment.jpg");
var burlapMaterialGlobal = textureMaterial("burlap.png");
var qaeoMaterialGlobal = textureMaterial("Qae'o.png");
var riverMaterialGlobal = textureMaterial("blue_coral1.png");
var grayMaterialGlobal = textureMaterial("gray_wall.png");
var blackMaterialGlobal = textureMaterial("black_marble.png");
var cricelonMaterialGlobal = textureMaterial("blue_fire.png");
var grassMaterialGlobal = textureMaterial("bright_grass.png");
var woodMaterialGlobal = textureMaterial("rough_wood.png");
var treeMaterialGlobal = textureMaterial("forest_bark.jpg");
var leafMaterialGlobal = textureMaterial("leaf_fern_light.jpg");
var redWoodMaterialGlobal = textureMaterial("red_wood.png");
var darkWoodMaterialGlobal = textureMaterial("dark_wood.png");
var blueJayMaterialGlobal = textureMaterial("blue_jay_feather.png");
var globalMaterials = {"Qae'o": qaeoMaterialGlobal,
                       "blue_coral1": riverMaterialGlobal,
                       "gray_wall": grayMaterialGlobal,
                       "black_marble": blackMaterialGlobal,
                       "blue_fire": cricelonMaterialGlobal,
                       "bright_grass": grassMaterialGlobal,
                       "rough_wood": woodMaterialGlobal,
                       "forest_bark": treeMaterialGlobal,
                       "leaf_fern_light": leafMaterialGlobal,
                       "parchment": mapMaterialGlobal,
                       "burlap": burlapMaterialGlobal,
                       "red_wood": redWoodMaterialGlobal,
                       "dark_wood": darkWoodMaterialGlobal,
                       "blue_jay_feather": blueJayMaterialGlobal};

//these are the points from certain kingdoms that other kingdoms depend upon
var lohorPoints1;
var lohorCurve1;
var faeroPoints1;
var faeroPoints2;
var faeroPoints4;
var faeroCurve4;
var tyazPoints4;

//the curve to define the Lohor-Faero river - makeFaero() needs access to this curve
var riverBezierPoints;

//chose to have a global tree so makeTree() only needs to be called once - all the other trees clone globalTree
var globalTree;

//widths and heights of common letters - used to place accents and apostrophes within text labels
//making these global reduces the number of calls to makeTextMesh(), reducing the render time of the scene
var eWidth;
var eHeight;
var oWidth;
var oHeight;
var iWidth;
var iHeight;
var spaceWidth;

//the width of a space divided by the height of a space
//computed once and hardcoded to avoid having to make extraneous calls to makeTextMesh()
var spacePro = 0.1374785725822948; 

//locations of hidden world entrances relative to a planar map background
var hwPositions = {};

//******//
//END GLOBALS//
//******//

//******//
//Material and Color Functions
//******//

/*
createMaterial()
Purpose: returns either a material with a texture-mapped image or
  a MeshFaceMaterial with colors ranging between two given colors
Parameters:
geom (THREE.Geometry) the geometry to create the material for
image (string or array)
  if a string, it's treated as the name of the image to texture-map
  otherwise, treated as a array where image[0] is the starting color, image[1] is the ending color, and image[2] is the index mode
*/
/*function createMaterial (geom, image) {
  if (typeof sceneIndex != "number") {
    sceneIndex = 0;
  }
  if (typeof image == "string") {
    //var mat = textureMaterial(image);
    var mat = globalMaterials[image];
    if (mat == undefined) {
      mat = textureMaterial(image + ".png");
    }
  } else if (image.constructor == Array) {
    var mat = multicoloredMaterial(new THREE.Color(image[0]), new THREE.Color(image[1]), Math.floor(geom.faces.length/10));
    //var indexFunction = chooseIndexingFunction(geom, Math.floor(geom.faces.length/10), Math.floor(geom.faces.length/10), image[2]);
    //indexFunction();
  } else {
    var mat = new THREE.MeshPhongMaterial({color: image, ambient: image});
  }
  return mat;
}*/

/*
multicoloredMaterial()
Purpose: returns a MeshFaceMaterial comprised of numColors interpolated between startColor and endColor
Parameters:
startColor (THREE.Color) - the color at one end of the color range
endColor (THREE.Color) - the color at the other end of the color range
numColors (integer) - the number of different colored materials to make
*/
function multicoloredMaterial (startColor, endColor, numColors) {
  console.log('inside multicoloredMaterial');
  //create the material using an array of MeshPhongMaterials and MeshFaceMaterial
  var mats = [];

  //find the ranges of hue, saturation and light to create all the colored materials
  //from the start color and the end color
  var startHSL = startColor.getHSL();
  var endHSL = endColor.getHSL();
  var hueDifference = Math.abs(endHSL.h - startHSL.h);
  var saturationDifference = Math.abs(endHSL.s - startHSL.s);
  var lightnessDifference = Math.abs(endHSL.l - startHSL.l);

  //define the step size taken in setting up the colors
  var hueStep = hueDifference/numColors;
  var saturationStep = saturationDifference/numColors;
  var lightnessStep = lightnessDifference/numColors;

  //populate the leafMats array with materials whose colors range from leafStartColor to leafEndColor
  for (var i = 0; i < numColors; i++) {
    var colorStep = new THREE.Color();
    colorStep.setHSL(startHSL.h + i*hueStep, startHSL.s + i*saturationStep, startHSL.l + (1-i)*lightnessStep);
    if (colorStep.getHSL().l <= 0) {
      colorStep.setHSL(colorStep.getHSL().h, colorStep.getHSL().s, 0.01);
    }
    mats.push(new THREE.MeshPhongMaterial({color: colorStep, ambient: colorStep, side: THREE.DoubleSide}));
  }

  console.log('mats: ' + mats);
  return new THREE.MeshFaceMaterial(mats);
}

/*
randomColorInRange()
Purpose: returns a random color in the range of startColor and endColor
  used to generate a random color for the stem in makeLeaf()
Parameters:
startColor (THREE.Color) - the color at one end of the range
endColor (THREE.Color) - the color and the other end of the range
*/
function randomColorInRange (startColor, endColor) {
  var startHSL = startColor.getHSL();
  var endHSL = endColor.getHSL();
  var hueDifference = Math.abs(endHSL.h - startHSL.h);
  var saturationDifference = Math.abs(endHSL.s - startHSL.s);
  var lightnessDifference = Math.abs(endHSL.l - startHSL.l);

  //create a random color in the range of startColor and endColor
  var hue = Math.random()*hueDifference + startHSL.h; //range: startHSL.h to endHSL.h
  var saturation = Math.random()*saturationDifference + startHSL.s; //range: startHSL.s to endHSL.s
  var lightness = 0.75*Math.random()*lightnessDifference + endHSL.l; //range: endHSL.l to 0.75*lightnessDifference
  var color = new THREE.Color();
  color.setHSL(hue, saturation, lightness);

  return color;
}

//******//
//End Material and Color Functions
//******//

//******//
//Material Indexing Functions//
//******//

/*
indexMaterialSmoothly()
Purpose: smoothly assigns material indices in increasing order
Parameters:
geom (THREE.Geometry) - the geometry to assign material indices to
numColors (integer) - the number of colors used in the material 
*/
function indexMaterialSmoothly (geom, numColors) {
  for (var i = 0; i < numColors; i++) {
    for (var j = i*geom.faces.length/numColors; j < (i+1)*geom.faces.length/numColors; j++) {
      geom.faces[j].materialIndex = i;
    }
  }
}

/*
indexMaterialSemiRandomly()
Purpose: partitions the faces into numPartitions sections, and randomly assigns 
  the material indices in each partition to the corresponding partition of numColors
Parameters:
geom (THREE.Geometry) - the geometry to assign material indices to
numColors (integer) - the number of colors used in the material
numPartitions (integer) - the number of partitions to divide the geometry's faces into
*/
function indexMaterialSemiRandomly (geom, numColors, numPartitions) {
  for (var p = 0; p < numPartitions; p++) {
    for (var f = p*geom.faces.length/numPartitions; f < (p+1)*geom.faces.length/numPartitions; f++) {
      var index = Math.floor(Math.random()*numColors/numPartitions) + p*numColors/numPartitions;
      geom.faces[f].materialIndex = index;
    }
  }
}

/*
indexMaterialRandomly()
Purpose: completely randomly assigns material indices
Parameters:
geom (THREE.Geometry) - the geometry to assign material indices to
numColors (integer) - the number of colors used in the material
*/
function indexMaterialRandomly (geom, numColors) {
  for (var j = 0; j < geom.faces.length; j++) {
    var index = Math.floor(Math.random()*numColors);
    geom.faces[j].materialIndex = index;
  }
}

/*
chooseIndexingFunction()
Purpose: selects one of the above functions to use when assigning material indices
  behaves as follows according to the index parameter:
    if the index is a string, it is treated as the name of the desired function, so returns
    the function given by getIndexingFunctionByName
    if the index parameter is undefined or outside the range [0, 1], returns a random function
    otherwise, returns the function at the floor of the index parameter
Parameters:
geom (THREE.Geometry) - the geometry to assign material indices to
numColors (integer) - the number of colors used in the material
numPartitions (integer) - the number of partitions to divide the geometry's faces into
index (string or number) - used to select which function to return (see Purpose)
*/
function chooseIndexingFunction (geom, numColors, numPartitions, index) {
  //store all the indexing functions in an array to choose from
  var functions = [
    function () {
      indexMaterialSmoothly(geom, numColors);
    },
    function () {
      indexMaterialSemiRandomly(geom, numColors, numPartitions);
    },
    function () {
      indexMaterialRandomly(geom, numColors);
    }];

    //if the index is a string, treat it as the name of the desired function
    if (typeof index == "string") {
      return getIndexingFunctionByName(geom, numColors, numPartitions, index);
    }

    //otherwise, return the function at located at index in the functions array
    if (index == undefined || index < 0) {
      index = Math.floor(Math.random()*functions.length);
    } else {
      index = Math.floor(index*functions.length);
    }
    return functions[index];
}

/*
getIndexingFunctionByName()
Purpose: returns the function corresponding to the given name parameter
  prints an error message if the given name does not have a function associated with it
  in this case, the desired material will be a single color
Parameters:
geom (THREE.Geometry) - the geometry to assign material indices to
numColors (integer) - the number of colors used in the material
numPartitions (integer) - the number of partitions to divide the geometry's faces into
name (string) - used to select which function to return (see Purpose)
*/
function getIndexingFunctionByName (geom, numColors, numPartitions, name) {
  switch (name) {
    case 'smooth':
      return function () {indexMaterialSmoothly(geom, numColors)};
    case 'semi-random':
      return function () {indexMaterialSemiRandomly(geom, numColors, numPartitions)};
    case 'random':
      return function () {indexMaterialRandomly(geom, numColors)};
    default:
      console.log('Error in getIndexingFunctionByName: no function with name ' + name + '. Material will be a single color.');
  }
}

//******//
//End Material Indexing Functions//
//******//

//******//
//General Map Functions//
//******//

function makePlaneMap (params) {
  var object = {};

  var frame = new THREE.Object3D();

  //add the image of the map as a planary background
  var mapGeom = new THREE.PlaneGeometry(mapParams.mapWidth, mapParams.mapHeight);
  var mapMat = textureMaterial("map.png");
  var mapMesh = new THREE.Mesh(mapGeom, mapMat);
  mapMesh.name = "map";
  frame.add(mapMesh);

  //var lohorEntrance = makeHiddenWorldEntrance(params);
  //lohorEntrance.position.set()
  return object;
}

/*
makeMap()
Purpose: returns an Object3D containing the map background, all seven kingdoms, and a "The Seven Kingdoms" title
Origin: center of the planar background
*/
function makeMap (params) {
  //immediately set up the globals so all the helper functions can use them
  modifyGlobals(params);

  var frame = new THREE.Object3D();

  //add the parchment background
  var background = makeBackground(params);
  frame.add(background);

  //add Lohor
  var lohor = makeLohor(params, false);
  lohor.position.set(-0.5*params.mapWidth, (0.5 - params.lohorHeight)*params.mapHeight, 0);
  frame.add(lohor);

  //add Faero
  var faero = makeFaero(params, false);
  faero.position.set(-0.5*params.mapWidth + params.faeroPosition*params.mapWidth, (0.5 - params.faeroHeight)*params.mapHeight, 0);
  frame.add(faero);

  //add Dasíl
  var dasil = makeDasil(params, false);
  dasil.position.set(-0.5*params.mapWidth + params.dasilPosition*params.mapWidth, (0.5 - params.dasilHeight)*params.mapHeight, 0);
  frame.add(dasil);

  //add Gonaw
  var gonaw = makeGonaw(params, false);
  gonaw.position.set(-0.5*params.mapWidth, -0.5*params.mapHeight, 0);
  frame.add(gonaw);

  //add Tyaz
  var tyaz = makeTyaz(params, false);
  tyaz.position.set(-0.5*params.mapWidth + params.tyazPosition*params.mapWidth, -0.5*params.mapHeight, 0);
  frame.add(tyaz);

  //add Mittiere
  var mittiere = makeMittiere(params, false);
  mittiere.position.set(0.5*params.mapWidth, (-0.5 + params.bejeiHeight)*params.mapHeight, 0);
  frame.add(mittiere);

  //add Bejéi
  var bejei = makeBejei(params, false);
  var bejeiWidth = 1 - params.tyazWidth - params.tyazPosition;
  bejei.position.set(0.5*params.mapWidth - bejeiWidth*params.mapWidth, -0.5*params.mapHeight, 0);
  frame.add(bejei);

  //add the Seven Kingdoms title
  var title = makeTitleText(params, "The Seven Kingdoms");
  var dimensions = getTextDimensions(title);
  title.position.set(-0.5*dimensions.x, 0.5*params.mapHeight + 0.2*dimensions.y, 0);
  frame.add(title);

  return frame;
}

/*
makeBackground()
Purpose: returns an Object3D containing a planar background and two nested cylinder "scrolls"
Origin: center of the plane
*/
function makeBackground (params) {
  var frame = new THREE.Object3D();

  var planeGeom = new THREE.PlaneGeometry(params.mapWidth, params.mapHeight, 64, 64);
  var plane = new THREE.Mesh(planeGeom, mapMaterialGlobal);
  frame.add(plane);

  var leftCylinder = makeNestedCylinders(params);
  leftCylinder.position.set(-params.mapWidth/2, 0, 0.8*params.cylinderRadius);
  leftCylinder.rotateY(Math.PI/2);
  frame.add(leftCylinder);

  var rightCylinder = makeNestedCylinders(params);
  rightCylinder.position.set(params.mapWidth/2, 0, 0.8*params.cylinderRadius);
  rightCylinder.rotateY(Math.PI/2);
  frame.add(rightCylinder);

  return frame;
}

/*
makeNestedCylinders()
Purpose: returns an Object3D containing several cylindrical lathes, nested inside each other
  used to create the "scrolls" at each end of the map
Origin: common center of every cylindrical lathe
*/
function makeNestedCylinders (params) {
  var frame = new THREE.Object3D();

  var radius = params.cylinderRadius;
  var height = params.mapHeight;
  var radiusStep = (params.cylinderFinalRadius - params.cylinderRadius)/params.numCylinders;
  var heightStep = (params.cylinderFinalHeight - params.mapHeight)/params.numCylinders;
  for (var i = 0; i < params.numCylinders; i++) {
    radius += radiusStep;
    height += heightStep;
    var points = [new THREE.Vector3(radius, 0, -height/2), new THREE.Vector3(radius, 0, height/2)];
    var geom = new THREE.LatheGeometry(points, 32);
    var mesh = new THREE.Mesh(geom, mapMaterialGlobal);
    mesh.rotateX(-Math.PI/2);
    frame.add(mesh);
  }

  return frame;
}

/*
modifyGlobals()
Purpose: sets all the global variables to their correct values so other functions can use them
*/
function modifyGlobals (params) {
  //lohorPoints1
  var maxLohorWidth = params.lohorWidth*params.mapWidth; //the maximum fraction of the total map width that Lohor can take up
  var maxLohorWidth1 = 0.9*maxLohorWidth; //the width reached by the first inflection point of the first border curve
  var maxLohorHeight = params.lohorHeight*params.mapHeight; //the maximum fraction of the total map height that Lohor can take up
  var maxLohorHeight1 = 0.45*maxLohorHeight; //the height reached by the first inflection point of the first border curve
  var maxLohorHeight2 = 0.9*maxLohorHeight; //the maximum height reached by the first border curve
  lohorPoints1 = [new THREE.Vector3(0, 0, 0), 
                      new THREE.Vector3(1.25*maxLohorWidth1, 0.75*maxLohorHeight1, 0), 
                      new THREE.Vector3(0.4*maxLohorWidth1, 0.75*maxLohorHeight2, 0), 
                      new THREE.Vector3(maxLohorWidth, maxLohorHeight2, 0)];
  lohorCurve1 = new THREE.CubicBezierCurve3(lohorPoints1[0], lohorPoints1[1], lohorPoints1[2], lohorPoints1[2]);

  //faeroPoints1, faeroPoints2, faeroPoints4
  var maxFaeroWidth = params.faeroWidth*params.mapWidth;
  var maxFaeroHeight = params.faeroHeight*params.mapHeight;
  var pointFaeroLohor = lohorCurve1.getPoint(0.3);
  pointFaeroLohor.setX(pointFaeroLohor.x - params.faeroPosition*params.mapWidth);
  pointFaeroLohor.setY(pointFaeroLohor.y - ((1 - params.faeroHeight)*params.mapHeight - (1 - params.lohorHeight)*params.mapHeight));
  //faeroPoints1
  faeroPoints1 = [new THREE.Vector3(0, 0, 0), pointFaeroLohor];
  var pointSouthEast = new THREE.Vector3(-0.55*pointFaeroLohor.x, 0.45*pointFaeroLohor.y, 0);
  //faeroPoints2
  faeroPoints2 = [new THREE.Vector3(0, 0, 0), pointSouthEast];
  var pointEast = new THREE.Vector3(0.8*pointSouthEast.x, 0.45*maxFaeroHeight, 0);
  //faeroPoints4
  faeroPoints4 = [pointEast,
                  new THREE.Vector3(0.7*maxFaeroWidth, 0.8*maxFaeroHeight, 0),
                  new THREE.Vector3(0.75*maxFaeroWidth, 0.5*maxFaeroHeight, 0),
                  new THREE.Vector3(maxFaeroWidth, maxFaeroHeight, 0)];
  faeroCurve4 = new THREE.CubicBezierCurve3(faeroPoints4[0], faeroPoints4[1], faeroPoints4[2], faeroPoints4[3]);

  //tyazPoints4
  var maxTyazWidth = params.tyazWidth*params.mapWidth;
  var halfwayFaeroPoint = findLinePoint(faeroPoints2, 0.5);
  halfwayFaeroPoint.setX(halfwayFaeroPoint.x - (params.tyazPosition*params.mapWidth - params.faeroPosition*params.mapWidth));
  halfwayFaeroPoint.setY(halfwayFaeroPoint.y + ((1 - params.faeroHeight)*params.mapHeight));
  var faeroOrigin = new THREE.Vector3(params.faeroPosition*params.mapWidth - params.tyazPosition*params.mapWidth, 
                                        (1 - params.faeroHeight)*params.mapHeight, 0);
  var pointNorthEast = new THREE.Vector3(0.65*maxTyazWidth, 0.95*halfwayFaeroPoint.y, 0);
  var bejeiNorthEast = new THREE.Vector3(0.9*maxTyazWidth, 0.85*faeroOrigin.y, 0);
  tyazPoints4 = [pointNorthEast,
                     new THREE.Vector3(0.65*maxTyazWidth, 0.97*faeroOrigin.y, 0),
                     new THREE.Vector3(0.75*maxTyazWidth, 0.9*faeroOrigin.y, 0),
                     bejeiNorthEast];

  //riverBezierPoints
  var maxLohorWidth = params.lohorWidth*params.mapWidth;
  var maxFaeroWidth = params.faeroWidth*params.mapWidth;
  var riverLength = params.riverLohorExtension*maxLohorWidth + params.riverFaeroExtension*maxFaeroWidth;
  riverBezierPoints = [new THREE.Vector3(0, 0, 0),
                      new THREE.Vector3(0.25*riverLength, -0.5*params.riverCurvature, 0),
                      new THREE.Vector3(0.75*riverLength, -0.5*params.riverCurvature, 0),
                      new THREE.Vector3(riverLength, 0, 0)];
  riverBezierCurve = new THREE.CubicBezierCurve3(riverBezierPoints[0], riverBezierPoints[1], riverBezierPoints[2], riverBezierPoints[3]);

  //eWidth and eHeight
  var e = makeLandmarkText(params, "e");
  eWidth = getTextDimensions(e).x
  eHeight = getTextDimensions(e).y;

  //oWidth and oHeight
  var o = makeLandmarkText(params, "o");
  oWidth = getTextDimensions(o).x;
  oHeight = getTextDimensions(o).y;

  //iWidth and iHeight
  var i = makeLandmarkText(params, "i");
  iWidth = getTextDimensions(i).x;
  iHeight = getTextDimensions(i).y;

  //spaceWidth
  var space = makeLandmarkText(params, "_");
  spaceWidth = getTextDimensions(space).x;

  //globalTree
  globalTree = makeTree(params.treeHeight*params.mapHeight, params.treeRadius*params.mapWidth, 
                        params.treeImage, params.branchImage, params.leafImage, params.index);
}

//******//
//End General Map Functions//
//******//

//******//
//Kingdom Functions//
//In addition to the objects listed in each kingdom function's header description,
//each kingdoms contains a title, a Hidden World entrance, and borders (except Gonaw and Mittiere)
//******//

/*
makeLohor()
Purpose: returns an Object3D containing the Lohor-Faero river, Xelai's hometown, Saiol, Inozette, and several trees
Origin: southwestern tip (the origin of the first border curve)
*/
function makeLohor (params) {
  var lohorFrame = new THREE.Object3D();

  var maxLohorWidth = params.lohorWidth*params.mapWidth; //the maximum fraction of the total map width that Lohor can take up
  var maxLohorWidth1 = 0.9*maxLohorWidth; //the width reached by the first inflection point of the first border curve

  var maxLohorHeight = params.lohorHeight*params.mapHeight; //the maximum fraction of the total map height that Lohor can take up
  var maxLohorHeight1 = 0.45*maxLohorHeight; //the height reached by the first inflection point of the first border curve
  var maxLohorHeight2 = 0.9*maxLohorHeight; //the maximum height reached by the first border curve

  //******BORDER******//
  //lohorborder1
  //the main part of the border
  lohorPoints1 = [new THREE.Vector3(0, 0, 0), 
                      new THREE.Vector3(1.25*maxLohorWidth1, 0.75*maxLohorHeight1, 0), 
                      new THREE.Vector3(0.4*maxLohorWidth1, 0.75*maxLohorHeight2, 0), 
                      new THREE.Vector3(maxLohorWidth, maxLohorHeight2, 0)];
  var lohorbordercurve1 = new THREE.CubicBezierCurve3(lohorPoints1[0], lohorPoints1[1], lohorPoints1[2], lohorPoints1[3]);
  var lohorborder1 = makeBorderMesh(params, lohorbordercurve1);
  lohorFrame.add(lohorborder1);

  //lohorborder2
  //the little curve at the very top that finishes the border
  var lohorPoints2 = [new THREE.Vector3(maxLohorWidth, maxLohorHeight2, 0), 
                      new THREE.Vector3(1.09*maxLohorWidth, 1.03*maxLohorHeight2, 0), 
                      new THREE.Vector3(0.9*maxLohorWidth, 1.15*maxLohorHeight2, 0), 
                      new THREE.Vector3(maxLohorWidth, 0.98*maxLohorHeight, 0)]
  var lohorbordercurve2 = new THREE.CubicBezierCurve3(lohorPoints2[0], lohorPoints2[1], lohorPoints2[2], lohorPoints2[3]);
  var lohorborder2 = makeBorderMesh(params, lohorbordercurve2);
  lohorFrame.add(lohorborder2);
  //******END BORDER******//

  //title
  var lohorTitle = makeKingdomText(params, "Lohor");
  var lohorTitleDimensions = getTextDimensions(lohorTitle);
  lohorTitle.position.set(maxLohorWidth - lohorTitleDimensions.x - 1.1*params.riverRadius - params.riverLohorExtension*maxLohorWidth, 
                          maxLohorHeight - 1.2*lohorTitleDimensions.y, 0);
  lohorFrame.add(lohorTitle);

  //river
  var river = makeRiver(params);
  river.position.set((1 - params.riverLohorExtension)*maxLohorWidth, maxLohorHeight, 0);
  lohorFrame.add(river);

  //Hidden World entrance
  var hiddenWorld = makeHiddenWorldEntrance(params);
  hiddenWorld.position.set(params.lohorHiddenWorldX*maxLohorWidth, params.lohorHiddenWorldY*maxLohorHeight, 0);
  hwPositions.lohor = new THREE.Vector3(-0.5*params.mapWidth + hiddenWorld.position.x, 
                                        0.5*params.mapWidth - maxLohorHeight + hiddenWorld.position.y, 0);
  lohorFrame.add(hiddenWorld);

  //Xelai's hometown marker
  var xelaiHometown = makeXelaiHometown(params);
  var pointOnBorder = lohorCurve1.getPoint(0.1);
  xelaiHometown.position.set(pointOnBorder.x, params.xelaiHometownY*maxLohorHeight, 0);
  var borderDerivative = lohorbordercurve1.getTangent(0.3);
  var xelaiHometownAngle = Math.atan(borderDerivative.y);
  xelaiHometown.rotateZ(xelaiHometownAngle);
  lohorFrame.add(xelaiHometown);

  //Saiol marker
  var saiolFrame = new THREE.Object3D();
  var saiolDot = makeDotMesh(params);
  saiolFrame.add(saiolDot);
  var saiolText = makeLandmarkText(params, "Saiol");
  saiolText.position.set(-0.5*getTextDimensions(saiolText).x, -params.landmarkDotRadius - 1.5*getTextDimensions(saiolText).y, 0);
  saiolFrame.add(saiolText);
  saiolFrame.position.set(params.cylinderRadius, 0.95*maxLohorHeight, 0);
  saiolFrame.rotateZ(degreesToRadians(40));
  lohorFrame.add(saiolFrame);

  //Inozette
  var inozette = makeInozette(params);
  inozette.position.set(params.cylinderRadius + params.inozetteX*maxLohorWidth, params.inozetteY*maxLohorHeight, 0);
  lohorFrame.add(inozette);

  //trees near the Lohor-Faero border (on the Lohor side)
  var t = params.lohorTreeStart;
  var treeSpacing = 0.6*params.treeHeight*params.mapHeight;
  for (var i = 0; i < params.numLohorTrees; i++) {
    var tree = globalTree.clone();
    var treePoint = lohorbordercurve1.getPoint(t);
    tree.position.set(treePoint.x - 8*params.treeRadius*params.mapWidth, treePoint.y, 0);
    lohorFrame.add(tree);
    t += (params.treeHeight*params.mapHeight + treeSpacing)/lohorbordercurve1.getLength();
  }

  return lohorFrame;
}

/*
makeFaero()
Purpose: returns an Object3D containing Riv'an's clearing, Éo'gon, Xelai's capture forest, and several trees
Origin: southern tip (origin of the first and second border curves)
*/
function makeFaero (params) {
  //to ensure that the lohorPoints1 are set correctly
  //makeLohor(params, false);

  var faeroFrame = new THREE.Object3D();

  var maxFaeroWidth = params.faeroWidth*params.mapWidth;
  var maxFaeroHeight = params.faeroHeight*params.mapHeight;

  //******BORDER******//
  //faeroborder1
  //line from the southern point of Faero to the Lohor-Faero border
  var pointFaeroLohor = lohorCurve1.getPoint(0.3);
  pointFaeroLohor.setX(pointFaeroLohor.x - params.faeroPosition*params.mapWidth);
  pointFaeroLohor.setY(pointFaeroLohor.y - ((1 - params.faeroHeight)*params.mapHeight - (1 - params.lohorHeight)*params.mapHeight));
  faeroPoints1 = [new THREE.Vector3(0, 0, 0), pointFaeroLohor];
  var faerobordercurve1 = new THREE.SplineCurve3(faeroPoints1);
  var faeroborder1 = makeBorderMesh(params, faerobordercurve1);
  faeroFrame.add(faeroborder1);

  //faeroborder2
  //line from the southern point of Faero to some point in the southeastern part of Faero
  //pointSouthEast is defined in terms of the pointFaeroLohor used in the first border curve
  var pointSouthEast = new THREE.Vector3(-0.55*pointFaeroLohor.x, 0.45*pointFaeroLohor.y, 0);
  faeroPoints2 = [new THREE.Vector3(0, 0, 0), pointSouthEast];
  var faerobordercurve2 = new THREE.SplineCurve3(faeroPoints2);
  var faeroborder2 = makeBorderMesh(params, faerobordercurve2);
  faeroFrame.add(faeroborder2);

  //faeroborder3
  //line from the southeastern part of Faero to some point in the east part of Faero
  //pointEast is defined in terms of pointSouthEast and maxFaeroHeight
  var pointEast = new THREE.Vector3(0.8*pointSouthEast.x, 0.45*maxFaeroHeight, 0);
  var faeroPoints3 = [pointSouthEast, pointEast];
  var faerobordercurve3 = new THREE.SplineCurve3(faeroPoints3);
  var faeroborder3 = makeBorderMesh(params, faerobordercurve3);
  faeroFrame.add(faeroborder3);

  //faeroborder4
  //curve from pointEast to the northeast corner of Faero
  faeroPoints4 = [pointEast,
                  new THREE.Vector3(0.7*maxFaeroWidth, 0.8*maxFaeroHeight, 0),
                  new THREE.Vector3(0.75*maxFaeroWidth, 0.5*maxFaeroHeight, 0),
                  new THREE.Vector3(maxFaeroWidth, maxFaeroHeight, 0)];
  var faerobordercurve4 = new THREE.CubicBezierCurve3(faeroPoints4[0], faeroPoints4[1], faeroPoints4[2], faeroPoints4[3]);
  var faeroborder4 = makeBorderMesh(params, faerobordercurve4);
  faeroFrame.add(faeroborder4);

  //curves to smoothly join the border segments:
  //add a curve to smoothly join faeroborder1 and faeroborder2
  var smooth12 = makeSmoothJoin(params, [faeroPoints1[1], faeroPoints1[0]], faeroPoints2);
  faeroFrame.add(smooth12);

  //add a curve to smoothly join faeroborder2 and faeroborder3
  var smooth23 = makeSmoothJoin(params, faeroPoints2, faeroPoints3);
  faeroFrame.add(smooth23);

  //add a curve to smoothly join faeroborder3 and faeroborder4
  var smooth34 = makeSmoothJoin(params, faeroPoints3, faeroPoints4);
  faeroFrame.add(smooth34);

  //******END BORDER******//

  //title
  //place the title so it is centered within the portion of Faero enclosed by the river:
  var faeroTitle = makeKingdomText(params, "Faero");
  var faeroTitleDimensions = getTextDimensions(faeroTitle);
  var riverLength = params.riverLohorExtension*params.lohorWidth*params.mapWidth + params.riverFaeroExtension*maxFaeroWidth;
  //the distance in the x-direction from maxLohorWidth to the origin of Faero
  var faeroOriginX = params.faeroPosition*params.mapWidth - params.lohorWidth*params.mapWidth; 
  var riverLengthInFaero = riverLength - params.riverLohorExtension*params.lohorWidth*params.mapWidth;
  faeroTitle.position.set(0.5*riverLengthInFaero - faeroOriginX - 0.5*faeroTitleDimensions.x, 
                          maxFaeroHeight - 1.2*faeroTitleDimensions.y, 0);
  faeroFrame.add(faeroTitle);

  //Hidden World entrance
  var hiddenWorld = makeHiddenWorldEntrance(params);
  hiddenWorld.position.set(-faeroOriginX + params.faeroHiddenWorldX*maxFaeroWidth, params.faeroHiddenWorldY*maxFaeroHeight, 0);
  faeroFrame.add(hiddenWorld);

  //Rivan's clearing marker
  var rivanClearing = makeRivanClearing(params);
  var faeroTitleX = faeroTitle.position.x + 0.5*getTextDimensions(faeroTitle).x;
  var pointOnRiver = riverBezierCurve.getPoint(0.5);
  rivanClearing.position.set(faeroTitleX, 
                            maxFaeroHeight + pointOnRiver.y - params.riverRadius - 1.5*params.riverOscillation, 0);
  faeroFrame.add(rivanClearing);

  //Eogon
  var eogon = makeEogon(params);
  var eogonReference = faerobordercurve4.getPoint(params.eogonStartT);
  eogon.position.set(eogonReference.x - params.eogonX*maxFaeroWidth, eogonReference.y, 0);
  eogon.rotateZ(degreesToRadians(params.eogonRotationZ));
  faeroFrame.add(eogon);

  //Xelai's capture forest
  var xelaiCapture = makeXelaiCaptureForest(params);
  xelaiCapture.position.set(-faeroOriginX + params.xelaiCaptureX*maxFaeroWidth, params.xelaiCaptureY*maxFaeroHeight, 0);
  faeroFrame.add(xelaiCapture);

  //trees next to the Faero-Mittiere border (on the Mittiere side)
  var tree1 = globalTree.clone();
  var treePoint1 = faerobordercurve3.getPoint(0.75);
  tree1.position.set(treePoint1.x + 10*params.treeRadius*params.mapWidth, treePoint1.y, 0);
  faeroFrame.add(tree1);

  var tree2 = globalTree.clone();
  var treePoint2 = faerobordercurve3.getPoint(0.35);
  tree2.position.set(treePoint2.x + 10*params.treeRadius*params.mapWidth, treePoint2.y, 0);
  faeroFrame.add(tree2);

  return faeroFrame;
}

/*
makeDasil()
Purpose: returns an Object3D containing Qanser, Oqra, the stone house, Aregae's Mountain, and several trees
Origin: southern tip (the origin of the first and second border curves)
*/
function makeDasil (params) {
  var dasilFrame = new THREE.Object3D();

  var maxDasilWidth = (1 - params.dasilPosition)*params.mapWidth;
  var maxDasilHeight = params.dasilHeight*params.mapHeight;

  //******BORDER******//
  //dasilborder1
  //line from the southern tip of Dasil to the Faero-Dasil border
  var pointDasilFaero = faeroCurve4.getPoint(0.25)
  pointDasilFaero.setX(pointDasilFaero.x - (params.dasilPosition*params.mapWidth - params.faeroPosition*params.mapWidth));
  pointDasilFaero.setY(pointDasilFaero.y - ((1 - params.dasilHeight)*params.mapHeight - (1 - params.faeroHeight)*params.mapHeight));
  var dasilPoints1 = [new THREE.Vector3(0, 0, 0), pointDasilFaero];
  var dasilbordercurve1 = new THREE.SplineCurve3(dasilPoints1);
  var dasilborder1 = makeBorderMesh(params, dasilbordercurve1);
  dasilFrame.add(dasilborder1);

  //dasilborder2
  //curve from the southern tip of Dasil to the eastern edge of the map
  var dasilPoints2 = [new THREE.Vector3(0, 0, 0),
                      new THREE.Vector3(0.55*maxDasilWidth, 0.3*maxDasilHeight, 0),
                      new THREE.Vector3(0.8*maxDasilWidth, 0.15*maxDasilHeight, 0),
                      new THREE.Vector3(maxDasilWidth, 0.17*maxDasilHeight, 0)];
  var dasilbordercurve2 = new THREE.CubicBezierCurve3(dasilPoints2[0], dasilPoints2[1], dasilPoints2[2], dasilPoints2[3]);
  var dasilborder2 = makeBorderMesh(params, dasilbordercurve2);
  dasilFrame.add(dasilborder2);

  //curves to smoothly join the border segments:
  //add a curve to smoothly join dasilborder1 and dasilborder2
  var smooth12 = makeSmoothJoin(params, [dasilPoints1[1], dasilPoints1[0]], dasilPoints2);
  dasilFrame.add(smooth12);
  //******END BORDER******//

  //title
  var dasilTitleFrame = new THREE.Object3D();
  var dasilTitle = makeKingdomText(params, "Dasil");
  dasilTitleFrame.add(dasilTitle);
  var dasilTitleDimensions = getTextDimensions(dasilTitle);
  var das = makeKingdomText(params, "Das");
  var dasWidth = getTextDimensions(das).x;
  var i = makeKingdomText(params, "i");
  var i_Width = getTextDimensions(i).x;
  var accent = makeAccent(params, params.kingdomTitleColor);
  accent.position.set(dasWidth + 4*i_Width, dasilTitleDimensions.y, 0);
  dasilTitleFrame.add(accent);
  dasilTitleFrame.position.set(maxDasilWidth - dasilTitleDimensions.x - 0.5*params.cylinderRadius, 
                                maxDasilHeight - 1.7*dasilTitleDimensions.y, 0);
  dasilFrame.add(dasilTitleFrame);

  //Hidden World entrance
  //the position of Dasil's HW entrance doesn't depend on any Dasil HW parameters, 
  //because it is located pretty much at the origin of Dasil
  var hiddenWorld = makeHiddenWorldEntrance(params);
  hiddenWorld.position.set(-0.5*params.hiddenWorldWidth*params.mapWidth, 0.5*params.hiddenWorldWidth*params.mapWidth, 0);
  dasilFrame.add(hiddenWorld);

  //the distance in the x-direction from maxLohorWidth + maxFaeroWidth to the origin of Dasil
  var dasilOriginX = (params.dasilPosition - params.lohorWidth - params.faeroWidth)*params.mapWidth;
  //the distance in the y-direction from the origin of Dasil to the end of dasilborder2
  var dasilOriginY = dasilPoints2[3].y;

  //Qanser
  var qanser = makeQanser(params);
  qanser.position.set(-dasilOriginX + params.qanserX*maxDasilWidth, dasilOriginY + params.qanserY*maxDasilHeight, 0);
  var dasilDerivative = dasilbordercurve2.getTangent(0.3);
  var qanserAngle = Math.atan(dasilDerivative.y);
  qanser.rotateZ(qanserAngle);
  dasilFrame.add(qanser);

  //Oqra
  var oqraFrame = new THREE.Object3D();
  var oqraDot = makeDotMesh(params);
  oqraFrame.add(oqraDot);
  var oqraText = makeLandmarkText(params, "Oqra");
  oqraText.position.set(1.5*params.landmarkDotRadius, -params.landmarkDotRadius, 0);
  oqraFrame.add(oqraText);
  oqraFrame.position.set(-dasilOriginX + params.oqraX*maxDasilWidth, dasilOriginY + params.oqraY*maxDasilHeight, 0);
  dasilFrame.add(oqraFrame);

  //Stone House
  var stoneHouse = makeStoneHouse(params, dasilbordercurve2);
  dasilFrame.add(stoneHouse);

  //trees near the Dasíl-Mittiere border (on the Mittiere side)
  var tree1 = globalTree.clone();
  var treePoint1 = dasilbordercurve1.getPoint(0.95);
  tree1.position.set(treePoint1.x, treePoint1.y - 1.75*params.treeHeight*params.mapHeight, 0);
  dasilFrame.add(tree1);

  var tree2 = globalTree.clone();
  tree2.position.set(tree1.position.x - 5*params.treeRadius*params.mapWidth, 
                      tree1.position.y - 1.5*params.treeHeight*params.mapHeight, 0);
  dasilFrame.add(tree2);

  //Aregae's Mountain
  var aregaeMt = makeAregaeMountain(params);
  aregaeMt.position.set(params.aregaeMountainX*maxDasilWidth, params.aregaeMountainY*maxDasilHeight, 0);
  dasilFrame.add(aregaeMt);

  return dasilFrame;
}

/*
makeGonaw()
Purpose: returns an Object3D containing Danéosay, Merilonen, and Lamsíl
Origin: southwestern corner
  Gonaw has no borders - its borders are made in Lohor, Faero and Tyaz
*/
function makeGonaw (params) {
  var gonawFrame = new THREE.Object3D();

  //determine the maximum width and height of Gonaw
  var maxTyazWidth = params.tyazWidth*params.mapWidth;
  var bejeiWidth = 1 - params.tyazWidth - params.tyazPosition; //percentage of mapWidth that Bejei can take up
  var maxBejeiWidth = bejeiWidth*params.mapWidth; //maximum width of Bejei (along the southern edge) 
  var maxGonawWidth = params.mapWidth - maxTyazWidth - maxBejeiWidth;
  var maxGonawHeight = (1 - params.lohorHeight)*params.mapHeight;

  //title
  var gonawTitle = makeKingdomText(params, "Gonaw");
  var gonawTitleDimensions = getTextDimensions(gonawTitle);

  //find a point on the Lohor-Gonaw border, used to set the position of the gonaw title
  var pointOnLohor = lohorCurve1.getPoint(0.05);
  pointOnLohor.setY(pointOnLohor.y + (1 - params.lohorHeight)*params.mapHeight);

  //find the slope at a point on the Lohor-Gonaw border, used to set the z-rotation of the gonaw title
  var lohorSlope = lohorCurve1.getTangent(0.1);
  var theta = Math.atan(lohorSlope.y);

  gonawTitle.position.set(pointOnLohor.x, pointOnLohor.y - 1.2*gonawTitleDimensions.y, 0);
  gonawTitle.rotateZ(theta);
  gonawFrame.add(gonawTitle);

  //Hidden World entrance
  var hiddenWorld = makeHiddenWorldEntrance(params);
  hiddenWorld.position.set(params.gonawHiddenWorldX*maxGonawWidth, params.gonawHiddenWorldY*maxGonawHeight, 0);
  gonawFrame.add(hiddenWorld);

  //Danéosay
  var daneosay = makeDaneosay(params);
  daneosay.position.set(params.daneosayX*maxGonawWidth, params.daneosayY*maxGonawHeight, 0);
  gonawFrame.add(daneosay);

  //Merilonen
  var merilonen = makeMerilonen(params);
  merilonen.position.set(params.merilonenX*maxGonawWidth, params.merilonenY*maxGonawHeight, 0);
  gonawFrame.add(merilonen);

  //Lamsíl
  var lamsil = makeLamsil(params);
  lamsil.position.set(params.lamsilX*maxGonawWidth, params.lamsilY*maxGonawHeight, 0);
  gonawFrame.add(lamsil);

  return gonawFrame;
}

/*
makeTyaz()
Purpose: returns an Object3D containing the Cricelon, the Tyaz castle, and Qa'i's forest
Origin: southwestern corner (the origin of the first border curve)
*/
function makeTyaz (params) {
  var tyazFrame = new THREE.Object3D();

  var maxTyazWidth = params.tyazWidth*params.mapWidth;

  //******BORDER******//
  //tyazborder1
  //curve from the southwestern corner of Tyaz to the southern point of Faero
  var faeroOrigin = new THREE.Vector3(params.faeroPosition*params.mapWidth - params.tyazPosition*params.mapWidth, 
                                        (1 - params.faeroHeight)*params.mapHeight, 0);
  var tyazPoints1 = [new THREE.Vector3(0, 0, 0),
                     new THREE.Vector3(0.5*maxTyazWidth, 0.8*faeroOrigin.y, 0),
                     new THREE.Vector3(-0.6*maxTyazWidth, 0.6*faeroOrigin.y, 0),
                     faeroOrigin];
  var tyazbordercurve1 = new THREE.CubicBezierCurve3(tyazPoints1[0], tyazPoints1[1], tyazPoints1[2], tyazPoints1[3]);
  var tyazborder1 = makeBorderMesh(params, tyazbordercurve1);
  tyazFrame.add(tyazborder1);

  //tyazborder2
  //line from the halfway point of the second Faero border curve to just east of the Cricelon (cricelonPoint)
  var halfwayFaeroPoint = findLinePoint(faeroPoints2, 0.5);
  halfwayFaeroPoint.setX(halfwayFaeroPoint.x - (params.tyazPosition*params.mapWidth - params.faeroPosition*params.mapWidth));
  halfwayFaeroPoint.setY(halfwayFaeroPoint.y + ((1 - params.faeroHeight)*params.mapHeight));
  var cricelonPoint = new THREE.Vector3(0.5*maxTyazWidth, 0.95*faeroOrigin.y, 0); //formerly 0.65 for the x coefficient
  var tyazPoints2 = [halfwayFaeroPoint, cricelonPoint];
  var tyazbordercurve2 = new THREE.SplineCurve3(tyazPoints2);
  var tyazborder2 = makeBorderMesh(params, tyazbordercurve2);
  tyazFrame.add(tyazborder2);

  //tyazborder3
  //line from the cricelonPoint to a point in the northeast of Tyaz
  var pointNorthEast = new THREE.Vector3(0.65*maxTyazWidth, 0.95*halfwayFaeroPoint.y, 0); //formerly 0.8 for the x coefficient
  var tyazPoints3 = [cricelonPoint, pointNorthEast];
  var tyazbordercurve3 = new THREE.SplineCurve3(tyazPoints3);
  var tyazborder3 = makeBorderMesh(params, tyazbordercurve3);
  tyazFrame.add(tyazborder3);

  //tyazborder4
  //curve from pointNorthEast to the northeastern corner of Bejei (bejeiNorthEast)
  var bejeiNorthEast = new THREE.Vector3(0.9*maxTyazWidth, 0.85*faeroOrigin.y, 0);
  tyazPoints4 = [pointNorthEast,
                     new THREE.Vector3(0.65*maxTyazWidth, 0.97*faeroOrigin.y, 0),
                     new THREE.Vector3(0.75*maxTyazWidth, 0.9*faeroOrigin.y, 0),
                     bejeiNorthEast];
  var tyazbordercurve4 = new THREE.CubicBezierCurve3(tyazPoints4[0], tyazPoints4[1], tyazPoints4[2], tyazPoints4[3]);
  var tyazborder4 = makeBorderMesh(params, tyazbordercurve4);
  tyazFrame.add(tyazborder4);

  //tyazborder5
  //curve from bejeiNorthEast to the southeastern corner of Tyaz
  var pointSouthEast = new THREE.Vector3(maxTyazWidth, 0, 0);
  var tyazPoints5 = [bejeiNorthEast,
                     new THREE.Vector3(0.75*maxTyazWidth, 0.7*bejeiNorthEast.y, 0),
                     new THREE.Vector3(0.8*maxTyazWidth, 0.25*bejeiNorthEast.y, 0),
                     pointSouthEast];
  var tyazbordercurve5 = new THREE.CubicBezierCurve3(tyazPoints5[0], tyazPoints5[1], tyazPoints5[2], tyazPoints5[3]);
  var tyazborder5 = makeBorderMesh(params, tyazbordercurve5);
  tyazFrame.add(tyazborder5);

  //curves to smoothly join the border segments:
  //add a curve to smoothly join tyazborder2 and tyazborder3
  var smooth23 = makeSmoothJoin(params, tyazPoints2, tyazPoints3);
  tyazFrame.add(smooth23);

  //add a curve to smoothly join tyazborder3 and tyazborder4
  var smooth34 = makeSmoothJoin(params, tyazPoints3, tyazPoints4);
  tyazFrame.add(smooth34);
  //******END BORDER******//

  //title
  var tyazTitle = makeKingdomText(params, "Tyaz");
  var tyazTitleDimensions = getTextDimensions(tyazTitle);
  tyazTitle.position.set(faeroOrigin.x + 0.05*tyazTitleDimensions.x, faeroOrigin.y - 1.2*tyazTitleDimensions.y, 0);
  tyazFrame.add(tyazTitle);

  //The Cricelon
  var cricelon = makeCricelon(params);
  cricelon.position.set(params.cricelonTyazExtension*maxTyazWidth, 0, 0);
  tyazFrame.add(cricelon);

  //Hidden World entrance
  //the y-coordinate of the HW entrance does not depend on a Tyaz HW parameter,
  //but on a point on tyazborder1 (the curve from the southwest of Tyaz to the origin of Faero)
  var hiddenWorld = makeHiddenWorldEntrance(params);
  var hwReferencePoint = tyazbordercurve1.getPoint(0.95);
  hiddenWorld.position.set(params.tyazHiddenWorldX*maxTyazWidth, hwReferencePoint.y - 1.2*params.hiddenWorldHeight*params.mapHeight, 0);
  tyazFrame.add(hiddenWorld);

  //Tyaz castle
  var castle = makeTyazCastle(params);
  castle.position.set(params.tyazCastleX*maxTyazWidth, params.tyazCastleY*halfwayFaeroPoint.y, 0);
  castle.rotateZ(degreesToRadians(params.tyazCastleRotation));
  tyazFrame.add(castle);

  //Qa'i forest
  var qai = makeQaiForest(params);
  qai.position.set(params.qaiX*maxTyazWidth, params.qaiY*faeroOrigin.y, 0);
  tyazFrame.add(qai);

  return tyazFrame;
}

/*
makeMittiere()
Purpose: returns an Object3D containing Zorocy's hills
Origin: southeastern corner of Mittiere
  this is different from the other kingdoms, because having the origin in the southwest corner
  makes Mittiere very difficult to place in the map
  no borders (all defined in Dasil, Faero, Tyaz, and Bejei)
*/
function makeMittiere (params) {
  var mittiereFrame = new THREE.Object3D();

  var maxMittiereWidth = (1 - params.faeroPosition)*params.mapWidth;
  var maxMittiereHeight = (1 - params.dasilHeight - params.bejeiHeight)*params.mapHeight;

  //title
  var mittiereTitle = makeKingdomText(params, "Mittiere");
  var mittiereTitleDimensions = getTextDimensions(mittiereTitle);
  mittiereTitle.position.set(-mittiereTitleDimensions.x - 0.5*params.cylinderRadius, maxMittiereHeight + 0.9*mittiereTitleDimensions.y, 0);
  mittiereFrame.add(mittiereTitle);

  //Hidden World entrance
  var hiddenWorld = makeHiddenWorldEntrance(params);
  hiddenWorld.position.set(-params.mittiereHiddenWorldX*maxMittiereWidth, params.mittiereHiddenWorldY*maxMittiereHeight, 0);
  mittiereFrame.add(hiddenWorld);

  //Zorocy's hills
  var zorocy = makeZorocyHills(params);
  zorocy.position.set(-0.6*params.cylinderRadius, 0, 0);
  mittiereFrame.add(zorocy);

  return mittiereFrame;
}

/*
makeBejei()
Purpose: returns an Object3D containing the Bejei-Mittiere border,
  Cömor, the Thorn Room, Melengtha, and Yarro
Origin: southwester corner of Bejei (NOT the origin of any Bejei border curve)
*/
function makeBejei (params) {
  var bejeiFrame = new THREE.Object3D();

  //needed to adjust the x-coordinate of pointNorthEast
  //the difference between Bejei's origin and Tyaz's origin is maxTyazWidth
  var maxTyazWidth = params.tyazWidth*params.mapWidth;
  var bejeiWidth = 1 - params.tyazWidth - params.tyazPosition; //percentage of mapWidth that Bejei can take up
  var maxBejeiWidth = bejeiWidth*params.mapWidth; //maximum width of Bejei (along the southern edge)
  var maxBejeiHeight = params.bejeiHeight*params.mapHeight;

  //******BORDER******//
  //bejeiborder1
  //curve from the northwestern corner of Bejei to the rightmost endpoint of the hump in the Bejei-Mittiere border
  var pointNorthWest = new THREE.Vector3(tyazPoints4[3].x - maxTyazWidth, tyazPoints4[3].y, tyazPoints4[3].z);
  var bejeiPoints1 = [pointNorthWest,
                      new THREE.Vector3(0.1*maxBejeiWidth, 1.1*maxBejeiHeight, 0),
                      new THREE.Vector3(0.12*maxBejeiWidth, 1.6*maxBejeiHeight, 0), //formerly 1.8 for the y-coefficient, changed to make more room in Mittiere
                      new THREE.Vector3(0.3*maxBejeiWidth, 1.1*maxBejeiHeight, 0)];
  var bejeibordercurve1 = new THREE.CubicBezierCurve3(bejeiPoints1[0], bejeiPoints1[1], bejeiPoints1[2], bejeiPoints1[3]);
  var bejeiborder1 = makeBorderMesh(params, bejeibordercurve1);
  bejeiFrame.add(bejeiborder1);

  //bejeiborder2
  //curve from the rightmost hump point to the eastern edge of the map
  var bejeiPoints2 = [bejeiPoints1[3],
                      new THREE.Vector3(0.33*maxBejeiWidth, 0.95*maxBejeiHeight, 0),
                      new THREE.Vector3(0.55*maxBejeiWidth, 0.9*maxBejeiHeight, 0),
                      new THREE.Vector3(maxBejeiWidth, maxBejeiHeight, 0)];
  var bejeibordercurve2 = new THREE.CubicBezierCurve3(bejeiPoints2[0], bejeiPoints2[1], bejeiPoints2[2], bejeiPoints2[3]);
  var bejeiborder2 = makeBorderMesh(params, bejeibordercurve2);
  bejeiFrame.add(bejeiborder2);
  //******END BORDER******//

  //title
  var bejeiTitleFrame = new THREE.Object3D();
  var bejeiTitle = makeKingdomText(params, "Bejei");
  bejeiTitleFrame.add(bejeiTitle);
  var bejeiTitleDimensions = getTextDimensions(bejeiTitle);
  var bej = makeKingdomText(params, "Bej");
  var bejWidth = getTextDimensions(bej).x;
  var e = makeKingdomText(params, "e");
  var e_Width = getTextDimensions(e).x;
  var accent = makeAccent(params, params.kingdomTitleColor);
  accent.position.set(bejWidth + 1.5*e_Width, iHeight, 0);
  bejeiTitleFrame.add(accent);
  var pointOnBejeiBorder = bejeibordercurve2.getPoint(0.55);
  bejeiTitleFrame.position.set(maxBejeiWidth - bejeiTitleDimensions.x - 0.6*params.cylinderRadius, 
                                pointOnBejeiBorder.y - 1.7*bejeiTitleDimensions.y, 0);
  bejeiFrame.add(bejeiTitleFrame);

  //Hidden World entrance
  var hiddenWorld = makeHiddenWorldEntrance(params);
  hiddenWorld.position.set(params.bejeiHiddenWorldX*maxBejeiWidth, params.bejeiHiddenWorldY*maxBejeiHeight, 0);
  bejeiFrame.add(hiddenWorld);

  //Cömor
  var comor = makeComor(params);
  comor.position.set(maxBejeiWidth - params.cylinderRadius, 0.1*maxBejeiHeight, 0);
  bejeiFrame.add(comor);

  //Thorn Room
  var thornRoom = makeThornRoom(params);
  thornRoom.position.set(params.thornRoomX*maxBejeiWidth, params.thornRoomY*maxBejeiHeight, 0);
  thornRoom.rotateZ(degreesToRadians(params.thornRoomRotation));
  bejeiFrame.add(thornRoom);

  //Melengtha
  var melengtha = makeMelengtha(params);
  melengtha.position.set(params.melengthaX*maxBejeiWidth, params.melengthaY*maxBejeiHeight, 0);
  bejeiFrame.add(melengtha);

  //Yarro
  var yarro = makeYarro(params);
  yarro.position.set(pointNorthWest.x, pointNorthWest.y, 0);
  yarro.rotateZ(degreesToRadians(params.yarroRotationZ));
  bejeiFrame.add(yarro);

  return bejeiFrame;
}

//******//
//Objects within kingdoms//
//******//

//******Part 0: Hidden World (used in all kingdoms)******//

/*
makeHiddenWorldEntrance()
Purpose: returns an Object3D containing an X to mark the Hidden World entrance in each kingdom
Origin: bottom left corner of the "X"
*/
function makeHiddenWorldEntrance (params) {
  var hwFrame = new THREE.Object3D();

  var maxHWWidth = params.hiddenWorldWidth*params.mapWidth;
  var maxHWHeight = params.hiddenWorldHeight*params.mapHeight;

  var leftPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(maxHWWidth, maxHWHeight, 0)];
  var leftGeom = new THREE.TubeGeometry(new THREE.SplineCurve3(leftPoints), 64, params.hiddenWorldRadius, 32, false);
  var leftMat = createMaterial(leftGeom, params.hiddenWorldImage);
  var leftMesh = new THREE.Mesh(leftGeom, leftMat);

  var rightPoints = [new THREE.Vector3(maxHWWidth, 0), new THREE.Vector3(0, maxHWHeight, 0)];
  var rightGeom = new THREE.TubeGeometry(new THREE.SplineCurve3(rightPoints), 64, params.hiddenWorldRadius, 32, false);
  var rightMat = createMaterial(leftGeom, params.hiddenWorldImage);
  var rightMesh = new THREE.Mesh(rightGeom, rightMat);

  hwFrame.add(leftMesh);
  hwFrame.add(rightMesh);

  hwFrame.name = "hiddenWorldEntrance";

  return hwFrame;
}

//******Part 1: Lohor******//

/*
makeXelaiHometown()
Purpose: returns an Object3D containing a dot and the "Xelai's Hometown" text
Origin: center of the dot
  the "Xelai's" text is centered above the dot, and the "Hometown" text is centered below the dot
*/
function makeXelaiHometown (params) {
  var frame = new THREE.Object3D();

  var dot = makeDotMesh(params);
  frame.add(dot);

  var xelaiApostrophe = makeXelaiApostrophe(params);
  var xelaiTextFrame = xelaiApostrophe.frame;
  xelaiTextFrame.position.set(-0.4*getTextDimensions(xelaiApostrophe.mesh).x, 1.5*params.landmarkDotRadius, 0);
  frame.add(xelaiTextFrame);

  var hometownText = makeLandmarkText(params, "Hometown");
  hometownText.position.set(-0.4*getTextDimensions(hometownText).x, -getTextDimensions(hometownText).y - 1.5*params.landmarkDotRadius, 0);
  frame.add(hometownText);

  return frame;
}

/*
makeRiver()
Purpose: returns a 3D oscillating curve for the Lohor-Faero river
Origin: leftmost point of the river (the point starting in Lohor)
*/
function makeRiver (params) {
  var maxLohorWidth = params.lohorWidth*params.mapWidth;
  var maxFaeroWidth = params.faeroWidth*params.mapWidth;
  var riverLength = params.riverLohorExtension*maxLohorWidth + params.riverFaeroExtension*maxFaeroWidth;

  var riverCurve = makeOscillatingCurve(riverBezierCurve, riverLength, params.numRiverPoints, params.riverOscillation);
  var riverGeom = new THREE.TubeGeometry(riverCurve, 64, params.riverRadius, 64, false);
  var riverMat = createMaterial(riverGeom, params.riverImage);
  if (typeof params.riverImage == "string") {
    riverMat.map.repeat.set(params.riverRepeatX, params.riverRepeatY);
    riverMat.map.needsUpdate = true;
  }
  var riverMesh = new THREE.Mesh(riverGeom, riverMat);
  return riverMesh;
}

/*
makeInozette()
Purpose: returns an Object3D containing the "Inozette" text surrounded by two horizontal lines, with one conical mountain on either side
Origin: the bottom left corner of the left mountain
*/
function makeInozette (params) {
  var inozetteFrame = new THREE.Object3D();

  //create the two conical mountains that sit on either side of the Inozette mountain pass
  var mountain1 = makeCone(0, params.inozetteRadius*params.mapWidth, params.inozetteHeight*params.mapHeight, 
                            0, params.sceneIndex, params.inozetteImage);
  var mountain2 = mountain1.clone();

  //frame containing the text label and two lines surrounding the text
  //origin: the left endpoint of the bottom line
  var inozetteTextFrame = new THREE.Object3D();
  //the actual text
  var inozetteText = makeLandmarkText(params, "Inozette");
  var lineLength = 1.2*getTextDimensions(inozetteText).x;
  var lineSpacing = 2;
  inozetteText.position.set(0.5*(lineLength - getTextDimensions(inozetteText).x), lineSpacing*params.borderRadius, 0);
  inozetteTextFrame.add(inozetteText);
  //the horizontal lines above and below the text
  var lineTop = makeBorderMesh(params, new THREE.SplineCurve3([new THREE.Vector3(0, 0, 0), 
                                                              new THREE.Vector3(lineLength, 0, 0)]));
  var lineBottom = makeBorderMesh(params, new THREE.SplineCurve3([new THREE.Vector3(0, 0, 0), 
                                                              new THREE.Vector3(lineLength, 0, 0)]));
  lineTop.position.set(0, getTextDimensions(inozetteText).y + 2*lineSpacing*params.borderRadius, 0);
  inozetteTextFrame.add(lineTop);
  inozetteTextFrame.add(lineBottom);

  //add the mountains to the inozetteFrame
  mountain1.position.set(params.inozetteRadius*params.mapWidth, 0, 0);
  inozetteFrame.add(mountain1);
  mountain2.position.set(3*params.inozetteRadius*params.mapWidth + params.landmarkSize + (2*lineSpacing + 2)*params.borderRadius,
                          0.33*params.inozetteHeight*params.mapHeight, 0);
  inozetteFrame.add(mountain2);

  //add the textFrame to the overall inozetteFrame
  inozetteTextFrame.position.set(params.inozetteRadius*params.mapWidth + params.borderRadius, 
                                  params.inozetteHeight*params.mapHeight + params.borderRadius, 0);
  var coneAngle = Math.atan((params.inozetteRadius*params.mapWidth)/(params.inozetteHeight*params.mapHeight));
  var textAngle = -(Math.PI/2 - coneAngle);
  inozetteTextFrame.rotateZ(textAngle);
  inozetteFrame.add(inozetteTextFrame);

  return inozetteFrame;
}

//******Part 2: Faero******//

/*
makeRivanClearing()
Purpose: returns an Object3D containing a dot and the "Riv'an's Clearing" text
Origin: center of the dot
  the text is below the dot
*/
function makeRivanClearing (params) {
  var frame = new THREE.Object3D();

  //add the dot
  var dot = makeDotMesh(params);
  frame.add(dot);

  //create the text frame containing the text "Riv'an's":
  var rivanTextFrame = new THREE.Object3D();
  var rivanText = makeLandmarkText(params, "Riv an s");
  rivanTextFrame.add(rivanText);

  //the first apostrophe
  var riv = makeLandmarkText(params, "Riv");
  var rivWidth = getTextDimensions(riv).x;
  var v = makeLandmarkText(params, "v");
  var vHeight = getTextDimensions(v).y
  var apostrophe1 = makeApostrophe(params, params.landmarkColor);
  apostrophe1.position.set(rivWidth, vHeight, 0);
  rivanTextFrame.add(apostrophe1);

  //the second apostrophe
  var riv_an = makeLandmarkText(params, "Riv an");
  var riv_anWidth = getTextDimensions(riv_an).x;
  var apostrophe2 = makeApostrophe(params, params.landmarkColor);
  apostrophe2.position.set(riv_anWidth, vHeight, 0);
  rivanTextFrame.add(apostrophe2);

  //add the "Riv'an's" frame to the overall frame
  rivanTextFrame.position.set(-0.6*getTextDimensions(rivanText).x, -getTextDimensions(rivanText).y - 1.5*params.landmarkDotRadius, 0);
  frame.add(rivanTextFrame);

  //create and add the "Clearing" text
  var clearingText = makeLandmarkText(params, "Clearing");
  clearingText.position.set(-0.6*getTextDimensions(clearingText).x, 
                            rivanTextFrame.position.y - getTextDimensions(clearingText).y - 1.5*params.landmarkDotRadius, 0);
  frame.add(clearingText);

  return frame;
}

/*
makeEogon()
Purpose: returns an Object3D that contains a dot, the "Éo'gon" text, and a meadow
Origin: bottom right corner of the meadow
  NOT the center of the dot like usual - this makes it easier to place in Faero
*/
function makeEogon (params) {
  var eogonFrame = new THREE.Object3D();

  //create and add the dot
  var dot = makeDotMesh(params);
  dot.position.set(-0.5*params.eogonWidth*params.mapWidth, params.eogonHeight*params.mapHeight + params.landmarkDotRadius, 0);
  eogonFrame.add(dot);

  //frame containing the text label for Éogon
  var eogonTextFrame = new THREE.Object3D();
  var eogonText = makeLandmarkText(params, "Eo gon");
  eogonTextFrame.add(eogonText);

  //add the accent to the eogonTextFrame
  var cap_E = makeLandmarkText(params, "E");
  var cap_EWidth = getTextDimensions(cap_E).x;
  var cap_EHeight = getTextDimensions(cap_E).y
  var accent = makeAccent(params, params.landmarkColor);
  accent.position.set(0.5*cap_EWidth, cap_EHeight, 0);
  eogonTextFrame.add(accent);

  //add the apostrophe to the eogonTextFrame
  var apostrophe = makeApostrophe(params, params.landmarkColor);
  apostrophe.position.set(cap_EWidth + oWidth + 0.5*spaceWidth, oHeight, 0);
  eogonTextFrame.add(apostrophe);

  //add the eogonTextFrame to the eogonFrame
  eogonTextFrame.position.set(dot.position.x - 0.4*getTextDimensions(eogonText).x, dot.position.y + params.landmarkDotRadius, 0);
  eogonTextFrame.rotateZ(degreesToRadians(params.eogonTextRotationZ));
  eogonFrame.add(eogonTextFrame);

  //create and add the meadow
  var meadow = makeMeadow(params, params.eogonWidth*params.mapWidth, params.eogonHeight*params.mapHeight, params.eogonCurvature);
  meadow.position.set(-params.eogonWidth*params.mapWidth, 0, 0);
  eogonFrame.add(meadow);

  return eogonFrame;
}

/*
makeXelaiCaptureForest()
Purpose: returns an Object3D containing a dot, the "Xelai's Capture" text, and four trees surrounding the text
Origin: center of the dot
  the text is below the dot
*/
function makeXelaiCaptureForest (params) {
  var xelaiCaptureFrame = new THREE.Object3D();

  //add the dot
  var dot = makeDotMesh(params);
  xelaiCaptureFrame.add(dot);

  //add the "Xelai's" text
  var xelaiApostrophe = makeXelaiApostrophe(params);
  var xelaiFrame = xelaiApostrophe.frame;
  xelaiFrame.position.set(-0.5*getTextDimensions(xelaiApostrophe.mesh).x, 
                          -params.landmarkDotRadius - getTextDimensions(xelaiApostrophe.mesh).y, 0);
  xelaiCaptureFrame.add(xelaiFrame);

  //add the "Capture" text
  var captureText = makeLandmarkText(params, "Capture");
  captureText.position.set(-0.5*getTextDimensions(captureText).x, xelaiFrame.position.y - getTextDimensions(captureText).y, 0);
  xelaiCaptureFrame.add(captureText);

  //make the trees
  var topTree = globalTree.clone();
  var bottomTree = topTree.clone();
  var leftTree = topTree.clone();
  var rightTree = topTree.clone();

  //add the top tree
  topTree.position.set(xelaiFrame.position.x + 0.25*getTextDimensions(captureText).x, params.landmarkDotRadius, 0);
  xelaiCaptureFrame.add(topTree);

  //add the bottom tree
  bottomTree.position.set(captureText.position.x + 0.65*getTextDimensions(captureText).x, 
                          captureText.position.y - 0.25*getTextDimensions(captureText).y - params.treeHeight*params.mapHeight, 0);
  xelaiCaptureFrame.add(bottomTree);

  //add the left tree
  leftTree.position.set(captureText.position.x - 0.25*getTextDimensions(captureText).x,
                        captureText.position.y + 0.5*params.treeHeight*params.mapHeight, 0);
  xelaiCaptureFrame.add(leftTree);

  //add the right tree
  rightTree.position.set(captureText.position.x + 1.25*getTextDimensions(captureText).x,
                          captureText.position.y + 0.5*params.treeHeight*params.mapHeight, 0);
  xelaiCaptureFrame.add(rightTree);

  return xelaiCaptureFrame;
}

//******Part 3: Dasil******//

/*
makeQanser()
Purpose: returns an Object3D containing a dot and the "Qansér" text
Origin: center of the dot
  the text is to the right of the dot
*/
function makeQanser (params) {
  var qanserFrame = new THREE.Object3D();

  //the dot for Qanser
  var qanserDot = makeDotMesh(params);
  qanserFrame.add(qanserDot);

  //the Qanser text
  var qanserText = makeLandmarkText(params, "Qanser");
  qanserText.position.set(1.5*params.landmarkDotRadius, -params.landmarkDotRadius, 0);
  qanserFrame.add(qanserText);

  //the accent
  var qans = makeLandmarkText(params, "Qans");
  var qansWidth = getTextDimensions(qans).x;
  var accent = makeAccent(params, params.landmarkColor);
  accent.position.set(1.5*params.landmarkDotRadius + qansWidth + eWidth, 0.75*eHeight, 0);
  qanserFrame.add(accent);

  return qanserFrame;
}

/*
makeStoneHouse()
Purpose: returns an Object3D containing the "Stone House" text and several tree, 
  rotated to match the curvature of the Dasíl-Mittiere border
Origin: matches up with the origin of Dasíl, the dot is offset by the x-coordinate of dasilBorder at params.stoneHouseStart
Parameters:
params (object) - general scene parameters
dasilBorder (THREE.Curve) - the border between Dasíl and Mittiere, used to place and rotate the letters and trees
*/
function makeStoneHouse (params, dasilBorder) {
  var stoneHouseFrame = new THREE.Object3D();

  var dasilLength = dasilBorder.getPoint(1).x;
  var stoneHousePoint = dasilBorder.getPoint(params.stoneHouseStart);

  var dot = makeDotMesh(params);
  dot.position.set(stoneHousePoint.x, stoneHousePoint.y + 0.5*params.landmarkSize + params.landmarkDotRadius, 0);
  stoneHouseFrame.add(dot);

  //same strategy as adding the letters to the Cricelon
  var stoneHouseLetters = ["S", "t", "o", "n", "e", "_", "H", "o", "u", "s", "e"];
  var t = params.stoneHouseStart + params.landmarkDotRadius/dasilLength;
  for (var i in stoneHouseLetters) {
    //create a 3D text mesh from the current letter
    var letterMesh = makeLandmarkText(params, stoneHouseLetters[i]);

    //find the point on the Dasíl border where the letter will be placed
    //and the derivative at that point - used to rotate the letter
    var borderPoint = dasilBorder.getPoint(t);
    var borderDerivative = dasilBorder.getTangent(t);

    //position the letter at the point on the border
    letterMesh.position.set(borderPoint.x, borderPoint.y + params.borderRadius, 0);

    //increment the t-value by the percentage of the dasilLength that the current letter takes up
    t += getTextDimensions(letterMesh).x/dasilLength;

    //rotate the letter to match the slope of the Cricelon at the current point
    //same strategy as rotating the Gonaw title to match the Lohor-Gonaw border slope
    var angle = Math.atan(borderDerivative.y);
    letterMesh.rotateZ(angle);

    //add the letter to the stone house frame - if it's not an _
    if (stoneHouseLetters[i] != "_") {
      stoneHouseFrame.add(letterMesh);
    }
  }

  //add all the trees above the stone house label
  var treeT = params.stoneHouseTreeStart;
  var stoneHouseTree = globalTree.clone();
  for (var j = 0; j < params.numStoneHouseTrees; j++) {
    var tree = stoneHouseTree.clone();
    var borderPoint = dasilBorder.getPoint(treeT);
    var borderDerivative = dasilBorder.getTangent(treeT); 
    tree.position.set(borderPoint.x, borderPoint.y + params.borderRadius + params.landmarkSize, 0);

    treeT += 3*(2*params.treeRadius*params.mapWidth + 2*0.5*params.treeRadius*params.mapWidth*Math.sin(Math.PI/4))/dasilLength;

    var angle = Math.atan(borderDerivative.y);
    tree.rotateZ(angle);

    stoneHouseFrame.add(tree); 
  }

  return stoneHouseFrame;
}

/*
makeAregaeMountain()
Purpose: returns an Object3D containing a dot, the "Aregae's Mountain" text, and a conical mountain
Origin: center of the dot
*/
function makeAregaeMountain (params) {
  var frame = new THREE.Object3D();

  //add the dot
  var dot = makeDotMesh(params);
  frame.add(dot);

  //make the frame containing the "Aregae's" text
  var aregaeTextFrame = new THREE.Object3D();
  var aregaeText = makeLandmarkText(params, "Aregae s");
  aregaeTextFrame.add(aregaeText);

  //add the apostrophe
  var aregae = makeLandmarkText(params, "Aregae");
  var aregaeWidth = getTextDimensions(aregae).x;
  var apostrophe = makeApostrophe(params, params.landmarkColor);
  apostrophe.position.set(aregaeWidth, eHeight, 0);
  aregaeTextFrame.add(apostrophe);

  //add the "Aregae's" text frame to the overall frame
  aregaeTextFrame.position.set(1.5*params.landmarkDotRadius, 0.5*getTextDimensions(aregaeText).y, 0);
  frame.add(aregaeTextFrame);

  //make and add the "Mountain" text
  var mountainText = makeLandmarkText(params, "Mountain");
  mountainText.position.set(aregaeTextFrame.position.x + 0.25*getTextDimensions(aregaeText).x, 
                            aregaeTextFrame.position.y - 1.25*getTextDimensions(mountainText).y, 0);
  frame.add(mountainText);

  //make and add the mountain
  var mountain = makeCone(0, params.aregaeMountainRadius*params.mapWidth, params.aregaeMountainHeight*params.mapHeight, 
                            0, params.index, params.aregaeMountainImage);
  mountain.scale.z = 0.6;
  mountain.position.set(mountainText.position.x + 0.5*getTextDimensions(mountainText).x, 
                        mountainText.position.y - 0.5*getTextDimensions(mountainText).y - params.aregaeMountainHeight*params.mapHeight, 0);
  frame.add(mountain);

  return frame;
}

//******Part 4: Gonaw******//

/*
makeDaneosay()
Purpose: returns an Object3D that contains a 3D elliptical-curve background and the "Danéosay" text
Origin: the left endpoint of the elliptical background
*/
function makeDaneosay (params) {
  var daneosayFrame = new THREE.Object3D();

  //Danéosay text label
  var daneosayTextFrame = new THREE.Object3D();
  var daneosayText = makeLandmarkText(params, "Daneosay");
  daneosayTextFrame.add(daneosayText);
  //add the accent
  var dan = makeLandmarkText(params, "Dan");
  var danWidth = getTextDimensions(dan).x;
  var accent = makeAccent(params, params.landmarkColor);
  accent.position.set(danWidth + eWidth, eHeight, 0);
  daneosayTextFrame.add(accent);

  //define the width and height of the surrounding shape based on the text size
  var shapeWidth = 1.3*getTextDimensions(daneosayText).x;
  var shapeHeight = 3*getTextDimensions(daneosayText).y;

  //add the text to the overall frame
  daneosayTextFrame.position.set(0.5*(shapeWidth - getTextDimensions(daneosayText).x), 
                                -0.5*getTextDimensions(daneosayText).y, 
                                0);
  daneosayFrame.add(daneosayTextFrame);

  //elliptical border
  var ellipseCurve = new THREE.EllipseCurve(0, 0, 0.5*shapeWidth, 0.5*shapeHeight, 0, 2.5*Math.PI, true);
  var points = [];
  for (var i = 0; i <= 41; i++) {
    var point = ellipseCurve.getPoint(i/30);
    points.push(new THREE.Vector3(point.x, point.y, 0));
  }
  var ellipseGeom = new THREE.TubeGeometry(new THREE.SplineCurve3(points), 64, 2, 64, false);
  var ellipseMat = createMaterial(ellipseGeom, params.daneosayImage);
  var ellipseMesh = new THREE.Mesh(ellipseGeom, ellipseMat);
  ellipseMesh.position.set(0.5*shapeWidth, 0, 0);
  daneosayFrame.add(ellipseMesh);

  return daneosayFrame;
}

/*
makeMerilonen()
Purpose: returns an Object3D containing the oscillating lake border and the "Merilonen" text
Origin: the left endpoint of the lake
*/
function makeMerilonen (params) {
  var merilonenFrame = new THREE.Object3D();

  //create the text label for Merilonen
  var merilonenText = makeLandmarkText(params, "Merilonen");

  //define the width and height of the surrounding shape based on the text size
  var shapeWidth = 1.2*getTextDimensions(merilonenText).x;
  var shapeHeight = 3*getTextDimensions(merilonenText).y;

  //add the merilonenText to the overall frame
  merilonenText.position.set(0.5*(shapeWidth - getTextDimensions(merilonenText).x),
                                  -0.5*getTextDimensions(merilonenText).y, 0);
  merilonenFrame.add(merilonenText);

  //frame containing the oscillating lake border
  var lakeFrame = new THREE.Object3D();

  var bezierPoints = [new THREE.Vector3(0, 0, 0),
                      new THREE.Vector3(0, 0.75*shapeHeight, 0),
                      new THREE.Vector3(shapeWidth, 0.75*shapeHeight, 0),
                      new THREE.Vector3(shapeWidth, 0, 0)];
  var bezierCurveM = new THREE.CubicBezierCurve3(bezierPoints[0], bezierPoints[1], bezierPoints[2], bezierPoints[3]);
  var lakeCurve = makeOscillatingCurve(bezierCurveM, shapeWidth, 0.5*params.numMerilonenPoints, params.merilonenOscillation);
  var lakeGeom = new THREE.TubeGeometry(lakeCurve, 64, params.merilonenTubeRadius, 64, false);
  var lakeMat = createMaterial(lakeGeom, params.merilonenImage);
  var lakeMesh = new THREE.Mesh(lakeGeom, lakeMat);

  var lakeMeshBottom = lakeMesh.clone();
  lakeMeshBottom.rotateX(Math.PI);

  lakeFrame.add(lakeMesh);
  lakeFrame.add(lakeMeshBottom);

  merilonenFrame.add(lakeFrame);

  return merilonenFrame;
}

/*
makeLamsil()
Purpose: returns an Object3D containing a dot, the "Lamsíl" text, and three trees surrounding the text
Origin: center of the dot
*/
function makeLamsil (params) {
  var lamsilFrame = new THREE.Object3D();

  //add the dot
  var dot = makeDotMesh(params);
  lamsilFrame.add(dot);

  //add the "Lamsíl" text frame:
  //add the actual text to the text frame
  var lamsilTextFrame = new THREE.Object3D();
  var lamsilText = makeLandmarkText(params, "Lamsil");
  lamsilTextFrame.add(lamsilText);

  //add the accent to the text frame
  var lams = makeLandmarkText(params, "Lams");
  var lamsWidth = getTextDimensions(lams).x;
  var accent = makeAccent(params, params.landmarkColor);
  accent.position.set(lamsWidth + iWidth, iHeight, 0);
  lamsilTextFrame.add(accent);

  //add the lamsilTextFrame to the overall lamsilFrame
  lamsilTextFrame.position.set(1.5*params.landmarkDotRadius, -0.5*getTextDimensions(lamsilText).y, 0);
  lamsilFrame.add(lamsilTextFrame);

  //add the trees surrounding the text
  var upperTree = globalTree.clone();
  var middleTree = upperTree.clone();
  var lowerTree = upperTree.clone();

  //add the upper tree
  upperTree.position.set(lamsilTextFrame.position.x + 0.3*getTextDimensions(lamsilText).x, 
                        1.15*getTextDimensions(lamsilText).y, 0);
  lamsilFrame.add(upperTree);

  //add the middle tree
  middleTree.position.set(lamsilTextFrame.position.x + getTextDimensions(lamsilText).x + 10*params.treeRadius*params.mapWidth, 
                            -0.5*params.treeHeight*params.mapHeight, 0);
  lamsilFrame.add(middleTree);

  //add the lower tree
  lowerTree.position.set(lamsilTextFrame.position.x + 0.5*getTextDimensions(lamsilText).x, 
                          -1.15*getTextDimensions(lamsilText).y - params.treeHeight*params.mapHeight, 0);
  lamsilFrame.add(lowerTree);

  return lamsilFrame;
}

//******Part 5: Tyaz******//

/*
makeCricelon()
Purpose: returns an Object3D containing the Cricelon river, the "The Cricelon text" arranged on top of the river, and the "Lanaö dies" marker
Origin: bottom point of the Cricelon (the point that touches the southern border of Tyaz)
  rotated so that that the upper endpoint will line up with the eastern edge of the map
  (once the Cricelon is placed at the appropriate position relative to Tyaz)
*/
function makeCricelon (params) {
  //define two separate frames to assist with rotation
  //contains both the river and the landmark, rotated so the upper endpoint is appropriately place
  var cricelonFrame = new THREE.Object3D();
  //contains the river and the landmark, not rotated
  var cricelonInnerFrame = new THREE.Object3D();

  //define dimensions needed to create the Cricelon:
  //widths of surrounding kingdoms
  var maxTyazWidth = params.tyazWidth*params.mapWidth;
  var bejeiWidth = 1 - params.tyazWidth - params.tyazPosition; //percentage of mapWidth that Bejei can take up
  var maxBejeiWidth = bejeiWidth*params.mapWidth; //maximum width of Bejei (along the southern edge) 
  var maxGonawWidth = params.mapWidth - maxTyazWidth - maxBejeiWidth;

  //height and width of the actual Cricelon
  var maxCricelonHeight = params.cricelonHeight*params.mapHeight;
  var maxCricelonWidth = params.mapWidth - maxGonawWidth - params.cricelonTyazExtension*maxTyazWidth;

  //find the distance between the start and end points of the Cricelon (used to add the letters and set up the control points)
  var cricelonStart = new THREE.Vector3(0, 0, 0);
  var cricelonEnd = new THREE.Vector3(maxCricelonWidth, maxCricelonHeight, 0);
  var cricelonLength = cricelonStart.distanceTo(cricelonEnd);

  //create the underlying Bezier curve that makes the overall shape of the Cricelon
  var bezierPoints = [new THREE.Vector3(0, 0, 0),
                      new THREE.Vector3(0.35*cricelonLength, 1*params.cricelonCurvature, 0), //formerly 0.25 x
                      new THREE.Vector3(0.65*cricelonLength, 0.8*params.cricelonCurvature, 0), //formerly 0.75 x, 0.6 y
                      new THREE.Vector3(cricelonLength, 0, 0)];
  var bezierCurveCricelon = new THREE.CubicBezierCurve3(bezierPoints[0], bezierPoints[1], bezierPoints[2], bezierPoints[3]);

  //use the Bezier curve to make a curve that follows the Bezier curve while oscillating
  var cricelonCurve = makeOscillatingCurve(bezierCurveCricelon, cricelonLength, params.numCricelonPoints, params.cricelonOscillation);

  //create the Cricelon geometry, material and mesh, and add it to the Cricelon inner frame
  var cricelonGeom = new THREE.TubeGeometry(cricelonCurve, 64, params.cricelonRadius, 64, false);
  var cricelonMat = createMaterial(cricelonGeom, params.cricelonImage);
  if (typeof params.cricelonImage == "string") {
    cricelonMat.map.repeat.set(params.cricelonRepeatX, params.cricelonRepeatY);
    cricelonMat.map.needsUpdate = true;
  }
  var cricelonMesh = new THREE.Mesh(cricelonGeom, cricelonMat);
  cricelonInnerFrame.add(cricelonMesh);

  //add the landmark text
  //the space is represented by "_" since TextGeometry won't support a single " " in most fonts 
  var cricelonLetters = ["T", "h", "e", "_", "C", "r", "i", "c", "e", "l", "o", "n"];
  var t = params.cricelonLandmarkStart;
  for (var i in cricelonLetters) {
    //create a 3D text mesh from the current letter
    var letterMesh = makeLandmarkText(params, cricelonLetters[i]);

    //find the point on the Cricelon where the letter will be placed
    //and the derivative at that point - used to rotate the letter
    var cricelonPoint = bezierCurveCricelon.getPoint(t);
    var cricelonDerivative = bezierCurveCricelon.getTangent(t);

    //position the letter at the point on the Cricelon, offset in the z-direction so it sits on top of the Cricelon
    letterMesh.position.set(cricelonPoint.x, 
                            cricelonPoint.y - 0.75*params.cricelonRadius, 
                            params.cricelonRadius);

    //increment the t-value by the percentage of the cricelonLength that the current letter takes up
    t += getTextDimensions(letterMesh).x/cricelonLength;

    //rotate the letter to match the slope of the Cricelon at the current point
    //same strategy as rotating the Gonaw title to match the Lohor-Gonaw border slope
    var angle = Math.atan(cricelonDerivative.y);
    letterMesh.rotateZ(angle);

    //add the letter to the inner Cricelon frame - if it's not an _
    if (cricelonLetters[i] != "_") {
      cricelonInnerFrame.add(letterMesh);
    }
  }

  //add the Lanäo dies marker
  var lanao = makeLanao(params);
  var lanaoPoint = cricelonCurve.getPoint(params.lanaoStart);
  lanao.position.set(lanaoPoint.x, lanaoPoint.y + 1.5*params.cricelonRadius, 0);
  var lanaoSlope = bezierCurveCricelon.getTangent(params.lanaoStart).y;
  lanao.rotateZ(Math.atan(lanaoSlope));
  cricelonInnerFrame.add(lanao);

  //determine how far to rotate the Cricelon so that its endpoint lines up with the eastern edge of the map
  //the angle of z-rotation (in radians) is the angle between the endpoint of the straight Cricelon
  //and the cricelonEnd (maxCricelonWidth, maxCricelonHeight)
  var theta = bezierPoints[3].angleTo(cricelonEnd);
  cricelonInnerFrame.rotateZ(theta);
  cricelonFrame.add(cricelonInnerFrame);

  return cricelonFrame;
}

/*
makeTyazCastle()
Purpose: returns an Object3D containing a dot, the "Castle" text, and a castle
Origin: center of the dot
  the text is to the right of the dot, and the castle is to the left of the dot
*/
function makeTyazCastle (params) {
  var castleFrame = new THREE.Object3D();

  //add the castle dot
  var castleDot = makeDotMesh(params);
  castleFrame.add(castleDot);

  //add the "Castle" text
  var castleText = makeLandmarkText(params, "Castle");
  castleText.position.set(1.5*params.landmarkDotRadius, -params.landmarkDotRadius, 0);
  castleFrame.add(castleText);

  //add the actual castle
  var castle = makeCastle(params.tyazCastleRadius*params.mapWidth, params.tyazCastleHeight*params.mapHeight, 
                              params.tyazCastleImage, params.numTyazCastleRings, 
                              params.tyazCastleBottomFraction, params.tyazCastleTopHeightFraction, params.sceneIndex);
  castle.position.set(-1.5*params.landmarkDotRadius - params.tyazCastleRadius*params.mapWidth, -params.landmarkDotRadius, 0);
  castleFrame.add(castle);

  return castleFrame;
}

/*
makeQaiForest()
Purpose: returns an Object3D containing a dot, the "Qa'i" text and three trees surrounding the text
Origin: center of the dot
*/
function makeQaiForest (params) {
  var qaiFrame = new THREE.Object3D();

  //add the dot
  var dot = makeDotMesh(params);
  qaiFrame.add(dot);

  //"Qa'i" text frame:
  //add the actual "Qa'i" text
  var qaiTextFrame = new THREE.Object3D();
  var qaiText = makeLandmarkText(params, "Qa i");
  qaiTextFrame.add(qaiText);

  //add the apostrophe
  var qa = makeLandmarkText(params, "Qa");
  var qaWidth = getTextDimensions(qa).x;
  var apostrophe = makeApostrophe(params, params.landmarkColor);
  //assuming for simplicity that the height of an "o" is roughly the same as the height of an "a", scaled for more accurate placement
  apostrophe.position.set(qaWidth + 0.25*spaceWidth, 0.9*oHeight, 0); 
  qaiTextFrame.add(apostrophe);

  //add the qaiTextFrame to the overall qaiFrame
  qaiTextFrame.position.set(params.landmarkDotRadius, 0.5*getTextDimensions(qaiText).y, 0);
  qaiFrame.add(qaiTextFrame);

  //add the trees surrounding the text 
  var upperTree = globalTree.clone();
  var middleTree = upperTree.clone();
  var lowerTree = upperTree.clone();

  upperTree.position.set(qaiTextFrame.position.x + 0.5*getTextDimensions(qaiText).x,
                          qaiTextFrame.position.y + 1.15*getTextDimensions(qaiText).y, 0);
  qaiFrame.add(upperTree);

  middleTree.position.set(qaiTextFrame.position.x + 1.5*getTextDimensions(qaiText).x,
                          qaiTextFrame.position.y - 0.5*params.treeHeight*params.mapHeight, 0);
  qaiFrame.add(middleTree);

  lowerTree.position.set(qaiTextFrame.position.x + 0.5*getTextDimensions(qaiText).x,
                          qaiTextFrame.position.y - 1.15*getTextDimensions(qaiText).y - params.treeHeight*params.mapHeight, 0);
  qaiFrame.add(lowerTree);

  return qaiFrame;
}

/*
makeLanao()
Purpose: returns an Object3D containing a dot and the "Lanaö dies" text
Origin: lower left corner of the "dies" text (not the center of the dot as usual)
  this makes it easier to place within the Cricelon
*/
function makeLanao (params) {
  var lanaoFrame = new THREE.Object3D();

  //"dies" text
  var diesText = makeLandmarkText(params, "dies");
  lanaoFrame.add(diesText);

  //create the "Lanaö" text - contained within a frame
  var lanaoTextFrame = new THREE.Object3D();
  var lanaoText = makeLandmarkText(params, "Lanao");
  lanaoTextFrame.add(lanaoText);

  //add the umlaut to the lanaoTextFrame
  var lanaWidth = getTextDimensions(lanaoText).x - oWidth;
  var umlaut = makeUmlaut(params, params.landmarkColor);
  umlaut.position.set(lanaWidth + 0.25*oWidth, 1.1*oHeight, 0);
  lanaoTextFrame.add(umlaut);

  //add the lanaoTextFrame to the overall lanaoFrame
  var lanaoXOffset = 0.5*(getTextDimensions(lanaoText).x - getTextDimensions(diesText).x);
  lanaoTextFrame.position.set(-lanaoXOffset, 1.5*getTextDimensions(diesText).y, 0);
  lanaoFrame.add(lanaoTextFrame);

  //the dot
  var dot = makeDotMesh(params);
  dot.position.set(lanaoTextFrame.position.x - params.landmarkDotRadius, lanaoTextFrame.position.y, 0);
  lanaoFrame.add(dot);

  return lanaoFrame;
}

//******Part 6: Mittiere******//

/*
makeZorocyHills()
Purpose: returns an Object3D containing the "Zorocy's Hills" text, and four hills arranged in two groups
Origin: bottom right of the bottom right hill
*/
function makeZorocyHills (params) {
  var zorocyFrame = new THREE.Object3D();

  //define the radius and height for typing simplicity
  var radius = params.hillRadius*params.mapWidth;
  var height = params.hillHeight*params.mapHeight;

  //"Zorocy's" text
  var zorocyTextFrame = new THREE.Object3D();
  var zorocyText = makeLandmarkText(params, "Zorocy s");
  zorocyTextFrame.add(zorocyText);

  //add the apostrophe
  var zorocy = makeLandmarkText(params, "Zorocy");
  var zorocyWidth = getTextDimensions(zorocy).x
  var apostrophe = makeApostrophe(params, params.landmarkColor);
  apostrophe.position.set(zorocyWidth, params.landmarkSize, 0);
  zorocyTextFrame.add(apostrophe);

  //"Hills" text
  var hillsText = makeLandmarkText(params, "Hills");

  //create the four hills
  var lowerRightHill = makeHill(params.hillHeight*params.mapHeight, params.hillRadius*params.mapWidth, params.hillImage);
  var lowerLeftHill = lowerRightHill.clone();
  var uppperRightHill = lowerRightHill.clone();
  var upperLeftHill = lowerRightHill.clone();

  //frame to hold the two lower hills
  //origin: bottom right of the right hill
  var lowerHillGroup = new THREE.Object3D();
  lowerHillGroup.add(lowerRightHill);
  lowerLeftHill.position.set(-1.25*radius, 0, 0);
  lowerHillGroup.add(lowerLeftHill);

  //frame to hold the two upper hills
  //origin: bottom right of the right hill
  var upperHillGroup = new THREE.Object3D();
  upperHillGroup.add(uppperRightHill);
  var upperLeftOffsetX = 1.25*radius;
  var upperLeftOffsetY = 0.2*height;
  upperLeftHill.position.set(-upperLeftOffsetX, -upperLeftOffsetY, 0);
  upperHillGroup.add(upperLeftHill);

  //add both hill groups
  zorocyFrame.add(lowerHillGroup);
  upperHillGroup.position.set(-2*radius, 1.15*height, 0);
  zorocyFrame.add(upperHillGroup);

  //determine how far to rotate the two texts so they align with the hills
  var angle = Math.atan(upperLeftOffsetY/upperLeftOffsetX);

  //add the "Zorocy's" text
  zorocyTextFrame.position.set(upperHillGroup.position.x + upperLeftHill.position.x - radius, upperHillGroup.position.y + height, 0);
  zorocyTextFrame.rotateZ(angle);
  zorocyFrame.add(zorocyTextFrame);

  //add the "Hills" text
  hillsText.position.set(upperHillGroup.position.x, upperHillGroup.position.y + 0.75*radius, 0);
  hillsText.rotateZ(angle);
  zorocyFrame.add(hillsText);

  return zorocyFrame;
}

//******Part 7: Bejei******//

/*
makeYarro()
Purpose: returns an Object3D containing the "Yarro" text and a meadow
Origin: bottom left corner of the meadow
  this makes it easier to place relative to the curved Bejei-Mittiere border
  the text sits directly above the meadow
*/
function makeYarro (params) {
  var yarroFrame = new THREE.Object3D();

  //add the meadow
  var meadow = makeMeadow(params, params.yarroMeadowWidth*params.mapWidth, 
                          params.yarroMeadowHeight*params.mapHeight, params.yarroMeadowCurvature);
  yarroFrame.add(meadow);

  //add the "Yarro" text
  var yarroText = makeLandmarkText(params, "Yarro");
  var yarroOffsetX = 0.5*(params.yarroMeadowWidth*params.mapWidth - getTextDimensions(yarroText).x);
  yarroText.position.set(yarroOffsetX, params.yarroMeadowHeight*params.mapHeight, 0);
  yarroFrame.add(yarroText);

  //add the trees:
  //left top tree
  var leftTopTree = globalTree.clone();
  leftTopTree.position.set(yarroText.position.x + 0.3*getTextDimensions(yarroText).x, 
                            yarroText.position.y + 1.15*getTextDimensions(yarroText).y, 0);
  yarroFrame.add(leftTopTree);

  //right top tree
  var rightTopTree = globalTree.clone();
  rightTopTree.position.set(yarroText.position.x + 0.9*getTextDimensions(yarroText).x, 
                            yarroText.position.y + 1.15*getTextDimensions(yarroText).y, 0);
  yarroFrame.add(rightTopTree);

  //right tree
  var rightTree = globalTree.clone();
  rightTree.position.set(params.yarroMeadowWidth*params.mapWidth + 8*params.treeRadius*params.mapWidth, 
                          0.5*params.yarroMeadowHeight*params.mapHeight, 0);
  yarroFrame.add(rightTree);

  return yarroFrame;
}

/*
makeThornRoom()
Purpose: returns an Object3D containing a dot, the "Thorn Room" text, and a box marking the thorn room
Origin: center of the dot
  the text sits below and to the right of the dot, and the box sits above the dot
*/
function makeThornRoom (params) {
  var thornFrame = new THREE.Object3D();

  //add the dot
  var dot = makeDotMesh(params);
  thornFrame.add(dot);

  //add the box representing the room
  var boxGeom = new THREE.BoxGeometry(params.thornRoomSize, params.thornRoomSize, params.thornRoomSize);
  var boxMat = createMaterial(boxGeom, params.thornRoomImage);
  var box = new THREE.Mesh(boxGeom, boxMat);
  box.position.set(0, params.landmarkDotRadius + 1.25*params.thornRoomSize, 0);
  thornFrame.add(box);

  //add the "Thorn" text
  var thorn = makeLandmarkText(params, "Thorn");
  thorn.position.set(params.landmarkDotRadius, 0, 0);
  thornFrame.add(thorn);

  //add the "Room" text
  var room = makeLandmarkText(params, "Room");
  room.position.set(params.landmarkDotRadius + 0.5*getTextDimensions(thorn).x,  -1.1*getTextDimensions(room).y, 0);
  thornFrame.add(room);

  return thornFrame;
}

/*
makeMelengtha()
Purpose: returns an Object3D containing a dot, the "Melengtha" text, and the Melengtha castle
Origin: center of the dot
  the text extends to the right of the dot, while the castle extends to the left
*/
function makeMelengtha (params) {
  var melengthaFrame = new THREE.Object3D();

  //add the dot
  var melengthaDot = makeDotMesh(params);
  melengthaFrame.add(melengthaDot);

  //add the "Melengtha" text
  var melengthaText = makeLandmarkText(params, "Melengtha");
  melengthaText.position.set(1.5*params.landmarkDotRadius, 0, 0);
  melengthaFrame.add(melengthaText);

  //add the castle
  var castle = makeCastle(params.melengthaRadius*params.mapWidth, params.melengthaHeight*params.mapHeight, 
                              params.melengthaImage, params.numMelengthaRings, 
                              params.melengthaBottomFraction, params.melengthaTopHeightFraction, params.index);
  castle.position.set(-1.5*params.landmarkDotRadius - params.melengthaRadius*params.mapWidth, 0, 0);
  castle.rotateY(Math.PI);
  melengthaFrame.add(castle);

  return melengthaFrame;
}

/*
makeComor()
Purpose: returns an Object3D containing a dot and the "Cömor" text
Origin: center of the dot
*/
function makeComor (params) {
  var comorFrame = new THREE.Object3D();

  //add the dot
  var comorDot = makeDotMesh(params);
  comorFrame.add(comorDot);

  //add the text
  var comorText = makeLandmarkText(params, "Comor");
  comorText.position.set(-getTextDimensions(comorText).x, 2*params.landmarkDotRadius, 0);
  comorFrame.add(comorText);

  //add the umlaut
  var c = makeLandmarkText(params, "C");
  var cWidth = getTextDimensions(c).x;
  var umlaut = makeUmlaut(params, params.landmarkColor);
  umlaut.position.set(comorText.position.x + cWidth + 0.25*oWidth, comorText.position.y + oHeight, 0);
  comorFrame.add(umlaut);

  return comorFrame;
}

//******End Objects within kingdoms******//

//******//
//Helper methods for objects within kingdoms://
//******//

//******//
//Methods specific to the map parameters//
//******//

/*
makeXelaiApostrophe()
Purpose: returns an Object3D containing the text "Xelai's"
  used to create the labels for "Xelai's Hometown" and "Xelai's Capture"
Origin: bottom left corner of the "X" in "Xelai"
Parameters:
  params (object) - general scene parameters
*/
function makeXelaiApostrophe (params) {
  var xelaiTextFrame = new THREE.Object3D();
  var xelaiText = makeLandmarkText(params, "Xelai s");
  xelaiTextFrame.add(xelaiText);

  var s = makeLandmarkText(params, "s");
  var sWidth = getTextDimensions(s).x;
  var apostrophe = makeApostrophe(params, params.landmarkColor);
  apostrophe.position.set(getTextDimensions(xelaiText).x - sWidth - 0.5*spaceWidth, iHeight, 0);
  xelaiTextFrame.add(apostrophe);

  return {frame: xelaiTextFrame, mesh: xelaiText};
}

//******//
//Generic objects (could be used outside the map)
//******//

/*
makeOscillatingCurve()
Purpose: returns a SplineCurve3 that follows along a given curve while oscillating in the y-direction
  used to create the Lohor-Faero river, the Cricelon, and Merilonen
Origin: not a mesh or a frame, but the curve starts at (0, 0, 0) and ends at (curveLength, 0, 0) (extends along the x-axis)
Parameters:
bezierCurve (THREE.Curve) - the curve that the oscillating curve follows
curveLength (number) - the maximum x-coordinate of the curve (not the arc length of the curve)
numPoints (integer) - the number of points to use for the curve (more points == more oscillations)
oscillation (number) - the magnitude of each oscillation
*/
function makeOscillatingCurve (bezierCurve, curveLength, numPoints, oscillation) {
  var points = [];
  points.push(new THREE.Vector3(0, 0, 0));
  for (var i = 1; i < numPoints; i++) {
    var bezierP = bezierCurve.getPoint(i/numPoints);
    var sign;
    if (i % 2 == 0) {
      sign = 1;
    } else {
      sign = -1;
    }
    points.push(new THREE.Vector3(bezierP.x, bezierP.y + sign*oscillation, 0));
  }
  points.push(new THREE.Vector3(curveLength, 0, 0));

  return new THREE.SplineCurve3(points);
}

/*
makeTree()
Purpose: returns a tree comprised of a cylindrical trunk and four branches, pointing downwards on either side of the trunk
Origin: back center of the trunk
Parameters:
treeHeight (number) - the height of the trunk
treeRadius (number) - the radius of the trunk
treeImage (string or array) - used to create the material
branchImage (string or array) - used to create the material for each branch
leafImage (string or array) - used to create the material for each leaf
sceneIndex (integer) - index of the scene to render after creating the material
*/
function makeTree (treeHeight, treeRadius, treeImage, branchImage, leafImage, sceneIndex) {
  var frame = new THREE.Object3D();
  var treeFrame = new THREE.Object3D();

  //create and add the cylindrical trunk
  var trunkGeom = new THREE.CylinderGeometry(treeRadius, treeRadius, treeHeight, 64, 64);
  var trunkMat = createMaterial(treeImage);
  var trunkMesh = new THREE.Mesh(trunkGeom, trunkMat);
  trunkMesh.position.set(0, 0.5*treeHeight, 0);
  treeFrame.add(trunkMesh);
  treeFrame.add(trunkMesh);

  //determine the parameters used to create the branches
  var branchLength = 0.4*treeHeight;
  var branchRadius = 0.8*treeRadius;
  var branchCurvature = (Math.random()*0.2 + 0.2)*branchLength;
  var numLeaves = Math.floor(Math.random() + 5);

  //create the four branches
  //branchLength, branchRadius, branchCurvature, branchImage, numLeaves, leafImage, 0.3
  var upperLeftBranch = makeBranch(branchLength, branchRadius, branchCurvature, branchImage, numLeaves, leafImage, 0.6);
  var lowerLeftBranch = upperLeftBranch.clone();
  var upperRightBranch = upperLeftBranch.clone();
  var lowerRightBranch = upperLeftBranch.clone();

  //add the upper left branch
  upperLeftBranch.position.set(-treeRadius, treeHeight, 0);
  upperLeftBranch.rotateZ(3*Math.PI/4);
  treeFrame.add(upperLeftBranch);

  //add the upper right branch
  upperRightBranch.position.set(treeRadius, treeHeight, 0);
  upperRightBranch.rotateZ(-3*Math.PI/4);
  treeFrame.add(upperRightBranch);

  //add the lower left branch
  lowerLeftBranch.position.set(-treeRadius, 0.5*treeHeight, 0);
  lowerLeftBranch.rotateZ(3*Math.PI/4);
  treeFrame.add(lowerLeftBranch);

  //add the lower right branch
  lowerRightBranch.position.set(treeRadius, 0.5*treeHeight, 0);
  lowerRightBranch.rotateZ(-3*Math.PI/4);
  treeFrame.add(lowerRightBranch);

  treeFrame.position.set(0, 0, treeRadius);
  frame.add(treeFrame);

  return frame;
}

/*
makeBranch()
Purpose: returns a curved branch using a BezierCurve and a TubeRadialGeometry
Origin: bottom center of the branch (where the radius is biggest)
  points up along the y-axis
Parameters:
branchLength (number) - the length (height along y-axis) of the branch
branchRadius (number) - the radius at the bottom of the branch (also the maximum radius of the branch)
image (string or array) - used to create the material
numLeaves (integer) - the number of leaves to add to the branch
leafImage (string or array) - used to create the material for each leaf
*/
function makeBranch (branchLength, branchRadius, branchCurvature, image, numLeaves, leafImage, leafHeightFraction) {
  var branchFrame = new THREE.Object3D();

  //define the branch curvature in the x and z-directions
  var xCurvature = (Math.random() + 0.5)*branchCurvature; //range: 0.5*branchCurvature to 1.5*branchCurvature
  var zCurvature = (Math.random() + 0.5)*branchCurvature; //range: 0.5*branchCurvature to 1.5*branchCurvature

  //make the curve that defines the branch
  var branchPoints = [new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(randomSign()*(Math.random()*0.25 + 0.25)*xCurvature, 
                                      (Math.random()*0.25 + 0.25)*branchLength, 
                                      randomSign()*(Math.random()*0.25 + 0.25)*zCurvature),
                    new THREE.Vector3(randomSign()*(Math.random()*0.25 + 0.25)*xCurvature, 
                                      (Math.random()*0.25 + 0.5)*branchLength, 
                                      randomSign()*(Math.random()*0.25 + 0.25)*zCurvature),
                    new THREE.Vector3(randomSign()*(Math.random()*0.25 + 0.25)*xCurvature, 
                                      branchLength, 
                                      randomSign()*(Math.random()*0.25 + 0.25)*zCurvature)];
  var branchCurve = new THREE.CubicBezierCurve3(branchPoints[0], branchPoints[1], branchPoints[2], branchPoints[3]);

  //set up the linearly decreasing branch radius function
  //the actual curve is used to position the leaves
  var branchRadii = [branchRadius, 0.15*branchRadius];
  var branchRadiusCurve = splineCurveFromYValues(branchRadii);

  //create the branch geometry using TubeRadialGeometry
  var branchGeom = new THREE.TubeRadialGeometry(branchCurve, 64, branchRadii, 64, false);

  //create the branch material and mesh
  var branchMat = createMaterial(image);
  //can't set the material indices of TubeRadialGeometry apparently
  var branchMesh = new THREE.Mesh(branchGeom, branchMat);
  branchFrame.add(branchMesh);

  //add the leaves
  var leafH = leafHeightFraction || 0.6;
  var averageLeafHeight = leafH*branchLength;
  var averageLeafCurvature = 0.8*averageLeafHeight;
  var averageLeafZCurvature = 0.1*averageLeafHeight;
  var start_t = Math.random()*0.2 + 0.1; //range: 0.1 to 0.3
  var end_t = Math.random()*0.1 + 0.8 //range: 0.8 to 0.9
  var theLeaf = makeLeaf(averageLeafHeight, averageLeafCurvature, averageLeafZCurvature, leafImage);
  for (var i = 0; i < numLeaves; i++) {
    //make the leaf, with randomized parameters (within range)
    var leafHeight = (Math.random()*0.5 + 0.75)*averageLeafHeight; //range: 0.75*averageLeafHeight to 1.25*averageLeafHeight
    var leafCurvature = (Math.random()*0.5 + 0.75)*averageLeafCurvature;
    var leafZCurvature = (Math.random()*0.5 + 0.75)*averageLeafZCurvature;
    //var leaf = makeLeaf(leafHeight, leafCurvature, leafZCurvature, leafImage);
    var leaf = theLeaf.clone();

    //place the leaf on the branch
    var t = start_t + i*(end_t - start_t)/numLeaves;
    var branchR = branchRadiusCurve.getPoint(t).y;
    var signX = randomSign();
    var signZ = randomSign();
    var leafPoint = branchCurve.getPoint(t);
    leaf.position.set(leafPoint.x + signX*branchR, leafPoint.y, leafPoint.z + signZ*branchR);
    branchFrame.add(leaf);
  }

  return branchFrame;
}

/*
makeLeaf()
Purpose: returns a leaf including the main leaf made from a BezierSurface, and a stem made from a BezierCurve and a TubeRadialGeometry
  the stem uses randomized points and color
  the leaf is oriented so that it is pointing along the tangent at the end of the stem curve
  used to create all the trees
Origin: bottom of the stem
Parameters:
leafHeight (number) - the height of the leaf, from the bottom to the tip
leafCurvature (number) - the maximum curvature of the leaf in the x-direction (i.e. the maximum width of the leaf)
zCurvature (number) - the curvature of the leaf in the z-direction
image (string or array) - used to create the material
*/
function makeLeaf (leafHeight, leafCurvature, zCurvature, image) {
  var leafFrame = new THREE.Object3D();

  //the control points used to create the Bezier surface
  var leafPoints = [   //bottom row
                        [[0, 0, 0], 
                        [0, 0, 0], 
                        [0, 0, 0], 
                        [0, 0, 0]],
                        //second-to-bottom row
                        [[-leafCurvature, 0.2*leafHeight, -zCurvature], 
                        [0, 0, 0],  
                        [0, 0, 0],  
                        [leafCurvature, 0.2*leafHeight, -zCurvature]],
                        //second-to-top row
                        [[-0.05*leafCurvature, 0.7*leafHeight, zCurvature], 
                        [0, 0, 0],  
                        [0, 0, 0],  
                        [0.05*leafCurvature, 0.7*leafHeight, zCurvature]],
                        //top row
                        [[0, leafHeight, -zCurvature], 
                        [0, leafHeight, -zCurvature],  
                        [0, leafHeight, -zCurvature], 
                        [0, leafHeight, -zCurvature]] ];
  //the geometry - a Bezier surface from the above control points
  var leafGeom = new THREE.BezierSurfaceGeometry(leafPoints, 10, 10);

  //create the leaf material and mesh
  var leafMat = createMaterial(image);

  //choose the indexing function to adjust the leafGeom
  if (image.constructor == Array) {
    var fcn = chooseIndexingFunction(leafGeom, 50, 5, image[2]);
    fcn();
  }
  var leafMesh = new THREE.Mesh(leafGeom, leafMat);

  //create the stem:
  //create the Bezier curve that defines the stem
  var stemHeight = (Math.random()*0.3 + 0.5)*leafHeight;
  var stemXCurvature = (Math.random()*0.25 + 0.5)*leafCurvature;
  var stemZCurvature = (Math.random()*0.5 + 0.5)*leafCurvature;
  var stemPoints = [new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(randomSign()*(Math.random()*0.25 + 0.25)*stemXCurvature, 
                                      (Math.random()*0.25 + 0.25)*stemHeight, 
                                      randomSign()*(Math.random()*0.25 + 0.25)*stemZCurvature),
                    new THREE.Vector3(randomSign()*(Math.random()*0.25 + 0.25)*stemXCurvature, 
                                      (Math.random()*0.25 + 0.5)*stemHeight, 
                                      randomSign()*(Math.random()*0.25 + 0.25)*stemZCurvature),
                    new THREE.Vector3(randomSign()*(Math.random()*0.25 + 0.25)*stemXCurvature, 
                                      stemHeight, 
                                      randomSign()*(Math.random()*0.25 + 0.25)*stemZCurvature)];
  var stemCurve = new THREE.CubicBezierCurve3(stemPoints[0], stemPoints[1], stemPoints[2], stemPoints[3]);

  //create a linearly decreasing function for the radius of the stem
  var stemMaxRadius = (0.05*Math.random() + 0.035)*leafCurvature;
  var stemMinRadius = 0.25*stemMaxRadius;
  var stemRadii = [stemMaxRadius, stemMinRadius];

  //create the stem geometry using TubeRadialGeometry and the decreasing radii
  var stemGeom = new THREE.TubeRadialGeometry(stemCurve, 64, stemRadii, 64, false);

  //create a random color in the range of leafStartColor and leafEndColor
  if (typeof image == "string") {
    var leafStartColor = new THREE.Color(0x7CFC00);
    var leafEndColor = new THREE.Color(0x006400);
    var stemColor = randomColorInRange(leafEndColor, leafEndColor);
  } else if (image.constructor == Array) {
    var stemColor = randomColorInRange(new THREE.Color(image[0]), new THREE.Color(image[1]));
  } else {
    var leafColor = new THREE.Color(image);
    var hsl = leafColor.getHSL();
    var stemColor = new THREE.Color;
    var stemLightness = hsl.l >= 0.1 ? hsl.l - 0.1 : hsl.l + 0.1;
    stemColor.setHSL(hsl.h, hsl.s, stemLightness);
  }

  //create the stem material and mesh using the random color
  var stemMat = new THREE.MeshPhongMaterial({color: stemColor, ambient: stemColor});
  var stemMesh = new THREE.Mesh(stemGeom, stemMat);

  //add the stem to the leafFrame
  leafFrame.add(stemMesh);

  //add the leaf to the leafFrame:
  //position the leaf at the end of the stem
  var stemEnd = stemCurve.getPoint(1);
  leafMesh.position.set(stemEnd.x, stemEnd.y, stemEnd.z);

  //orient the leaf to point along the tangent vector at the end of the stem
  var stemTangent = stemCurve.getTangent(1);
  var axis = new THREE.Vector3();
  axis.crossVectors(leafMesh.up, stemTangent).normalize();
  var radians = Math.acos(leafMesh.up.dot(stemTangent));
  leafMesh.quaternion.setFromAxisAngle(axis, radians);
  leafFrame.add(leafMesh);

  return leafFrame;
}

/*
makeMeadow()
Purpose: returns a meadow made from a BezierSurface
  overall, shaped like a rectangle
  used in makeEogon() and makeYarro()
Origin: bottom left corner of the meadow surface
  offset by curvature in the z-direction
Parameters:
params (object) - general scene parameters
  fields used: index, meadowImage, meadowRepeatX, meadowRepeatY
width (number) - the width of the meadow
height (number) - the height of the meadow
curvature (number) - the curvature of the meadow in the z-direction
*/
function makeMeadow (params, width, height, curvature) {
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
  var mat = createMaterial(params.meadowImage);
  var mesh = new THREE.Mesh(geom, mat);

  //offset the mesh by curvature in the z-direction
  mesh.position.set(0, 0, curvature);
  meadowFrame.add(mesh);

  return meadowFrame;
}

/*
makeHill()
Purpose: returns a bell-shaped hill made from a LatheGeometry, using a BezierCurve
  used in makeZorocyHills()
Origin: bottom right of the hill
Parameters:
height (number) - the height of the hill
radius (number) - the radius of the bottom of the hill
image (string or array) - used to create the material
sceneIndex (integer) - the index of the scene to render after making the material
*/
function makeHill (height, radius, image, sceneIndex) {
  var hillFrame = new THREE.Object3D();

  //define the Bezier curve used to create the hill
  var controlPoints = [new THREE.Vector3(radius, 0, 0),
                    new THREE.Vector3(0.4*radius, 0, 0.1*height),
                    new THREE.Vector3(0.6*radius, 0, 1*height),
                    new THREE.Vector3(0, 0, height)];
  var hillCurve = new THREE.CubicBezierCurve3(controlPoints[0], controlPoints[1], controlPoints[2], controlPoints[3]);

  //copy points from the Bezier curve to the array of points used to create the LatheGeometry
  var lathePoints = [];
  for (var i = 0; i <= 1; i += 0.1) {
    lathePoints.push(hillCurve.getPoint(i));
  } 

  //create the geometry, material, and mesh
  var latheGeom = new THREE.LatheGeometry(lathePoints, 32);
  var mat = createMaterial(image);
  var mesh = new THREE.Mesh(latheGeom, mat);

  //center the hill on the bottom right corner
  mesh.position.set(-radius, 0, 0);
  mesh.rotateX(-Math.PI/2);
  hillFrame.add(mesh);

  return hillFrame;
}

/*
makeCastle()
Purpose: returns a castle comprised of nested rings of cones
  used to make Melengtha and the castle in Tyaz
Origin: bottom center of the main cone
Parameters:
radius (number) - the radius of the main cone of the castle
height (number) - the height of the main cone of the castle
image (string or array) - used to make the material (see makeCone())
topperBottomFraction (number) - the fraction of the castle radius that each crag takes up
topperHeightFraction (number) - the fraction of each crag height that the topper of crag takes (see makeCone())
sceneIndex (integer) - the index of the scene to render after making the material
*/
function makeCastle (radius, height, image, numRings, topperBottomFraction, topperHeightFraction, sceneIndex) {
  var mountainFrame = new THREE.Object3D();

  //the main cone of the castle
  var base = makeCone(0, radius, height, topperHeightFraction, sceneIndex, image);
  mountainFrame.add(base);

  //create each ring of cones surrounding the main cone
  var numCrags = 8;
  for (var i = 0; i < numRings; i++) {
    //the radius of the circle on which each of the crags on the ring sits
    var r = (numRings - i)*radius/(numRings + 1);
    //the radius of each crag
    var cragRadius = Math.PI*r/numCrags;
    //the height of each crag
    var cragHeight = 0.5*(i + 1)*height/(numRings + 1) + 0.5*height;

    //add each crag in a circle to the mountainFrame, sitting on the circumference of a circle of radius r
    for (var j = 0; j < numCrags; j++) {
      var crag = makeCone(topperBottomFraction*cragRadius, cragRadius, cragHeight, topperHeightFraction, sceneIndex, image);
      var angle = j*2*Math.PI/numCrags;
      var x = -r*Math.cos(angle);
      var z = -r*Math.sin(angle);
      crag.position.set(x, 0, z);
      mountainFrame.add(crag);
    }
  }

  return mountainFrame;
}

/*
makeCone()
Purpose: returns a mesh comprised of two cones: a main (bottom) cone and a pointed top "hat" cone
Origin: bottom center of the main cone
Parameters:
radiusTop (number) - the radius of the top of the main cone
radiusBottom (number) - the radius of the bottom of the main cone
height (number) - the height of the main cone
topperHeightFraction (number) - the height of the top cone as a percentage of the height of the main cone
sceneIndex (integer) - the index of the scene to render after making the material
image (string or array) - either:
  the name of the image to texture-map or:
  an array containing the start color, the end color, and the indexing mode used to create a multicolored material
*/
function makeCone (radiusTop, radiusBottom, height, topperHeightFraction, sceneIndex, image) {
  var coneFrame = new THREE.Object3D();

  //geometries
  var coneGeom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32, 32, false);
  var topperGeom = new THREE.CylinderGeometry(0, radiusTop, topperHeightFraction*height, 8, 8, false);

  var coneMat = createMaterial(image);

  //main part of cone
  var coneMesh = new THREE.Mesh(coneGeom, coneMat);
  coneMesh.position.set(0, 0.5*height, 0);
  coneMesh.rotateY(Math.PI);
  coneFrame.add(coneMesh);

  //pointed topper section of the cone
  var topperMesh = new THREE.Mesh(topperGeom, coneMat);
  topperMesh.position.set(0, height + 0.5*topperHeightFraction*height, 0);
  topperMesh.rotateY(Math.PI);
  coneFrame.add(topperMesh);

  return coneFrame;
}

//******//
//Text functions//
//******//

/*
makeTitleText()
Purpose: returns a text mesh used for the title of the map
Origin: bottom left corner of the text
Parameters:
params (object) - general scene parameters
text (string) - text the mesh displays
matType (string) - the type of material to use
  if matType is 'single', returns a text mesh with a single-colored MeshPhongMaterial
  otherwise, returns a text mesh with a texture-mapped image
*/
function makeTitleText (params, text) {
  if (params.titleMaterial == 'single') {
    return makeSingleColorText(text, params.titleSize, params.titleColor);
  }
  return makeTextMesh(params, text, {size: params.titleSize, textImage: params.titleImage});
}

/*
makeKingdomText()
Purpose: returns a text mesh used for the title of each kingdom
Origin: bottom left corner of the text
Parameters:
params (object) - general scene parameters
text (string) - text the mesh displays
matType (string) - the type of material to use
  if matType is 'single', returns a text mesh with a single-colored MeshPhongMaterial
  otherwise, returns a text mesh with a texture-mapped image
*/
function makeKingdomText (params, text) {
  if (params.kingdomTitleMaterial == 'single') {
    return makeSingleColorText(text, params.kingdomTitleSize, params.kingdomTitleColor);
  }
  return makeTextMesh(params, text, {size: params.kingdomTitleSize, textImage: params.textImage});
}

/*
makeLandmarkText()
Purpose: returns a text mesh used for the landmarks in the kingdoms
Origin: bottom left corner of the text
Parameters:
params (object) - general scene parameters
text (string) - text the mesh displays
matType (string) - the type of material to use
  if matType is 'single', returns a text mesh with a single-colored MeshPhongMaterial
  otherwise, returns a text mesh with a texture-mapped image
*/
function makeLandmarkText (params, text) {
  if (params.landmarkMaterial == 'single') {
    return makeSingleColorText(text, params.landmarkSize, params.landmarkColor);
  }
  return makeTextMesh(params, text, {size: params.landmarkSize, textImage: params.landmarkImage});
}

/*
makeTextMesh()
Purpose: returns a text mesh with a texture-mapped image
Origin: bottom left corner of the mesh
Parameters:
params (object) - general scene parameters
text (string) - the text the mesh displays
options_p (object) - contains the fields size and textImage (the size of the text and the image to texture-map, respectively)
*/
function makeTextMesh (params, text, options_p) {
  var options = {
    size: 7,
    height: 0.5,
    weight: 'normal',
    font: 'helvetiker',
    style: 'normal',
    bevelThickness: 0.5,
    bevelSize: 0.25,
    bevelSegments: 3,
    bevelEnabled: true,
    curveSegments: 12,
    steps: 1
  };
  options.font = params.font || "helvetiker";
  options.size = options_p.size;
  var geom = new THREE.TextGeometry(text, options);
  geom.computeBoundingBox();
  var mat = new THREE.MeshBasicMaterial({color: 0x124568});
  var mesh = new THREE.Mesh(geom, mat);
  return mesh;
}

/*
makeSingleColorText()
Purpose: returns a text mesh with a single-colored MeshPhongMaterial
Origin: bottom left corner of the text
Parameters:
text (string) - the text the mesh displays
textSize (number) - the size of the text
textColor (color) - the color of the text's MeshPhongMaterial
*/
function makeSingleColorText (text, textSize, textColor) {
  var options = {
    size: textSize,
    height: 0.5,
    weight: 'normal',
    font: 'helvetiker',
    style: 'normal',
    bevelThickness: 0.25,
    bevelSize: 0.05,
    bevelSegments: 3,
    bevelEnabled: true,
    curveSegments: 12,
    steps: 1
  };
  var geom = new THREE.TextGeometry(text, options);
  geom.computeBoundingBox();

  var mat = new THREE.MeshPhongMaterial({color: textColor, ambient: textColor});
  var mesh = new THREE.Mesh(geom, mat);

  return mesh;
}

/*
getTextDimensions()
Purpose: returns the dimensions of the given text mesh as a Vector3 using the bounding box of the mesh's geometry
Parameters: 
textMesh (THREE.Mesh) - the mesh to get the dimensions of
*/
function getTextDimensions (textMesh) {
  var box = textMesh.geometry.boundingBox;
  var dimensions = new THREE.Vector3(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
  return dimensions;
}

//******//
//Helpers for objects that involve text//
//******//

/*
makeDotMesh()
Purpose: returns a dot used to make text labels (in particular, landmark labels)
Origin: center of the spherical dot
Parameters:
params (object) - general scene parameters
*/
function makeDotMesh (params) {
  var dotGeom = new THREE.SphereGeometry(params.landmarkDotRadius, 32, 32);
  var dotMat = new THREE.MeshPhongMaterial({color: params.landmarkDotColor, ambient: params.landmarkDotColor});
  var dotMesh = new THREE.Mesh(dotGeom, dotMat);

  return dotMesh;
}

/*
makeAccent()
Purpose: returns a rotated cylindrical accent mark used in making text labels
Origin: bottom center of the cylindrical accent
  accent is rotated clockwise about the z-axis by 45 degrees
Parameters:
params (object) - general scene parameters
accentImage (string or color) - image to texture-map or color to use
*/
function makeAccent (params, accentImage) {
  var frame = new THREE.Object3D();
  var height = 0.75*params.kingdomTitleSize;
  var radius = 0.25*0.5*params.kingdomTitleSize;
  var geom = new THREE.CylinderGeometry(radius, radius, height, 64, 64, false);

  if (typeof accentImage == "string") {
    var mat = new THREE.MeshBasicMaterial({color: 0x167814});
  } else {
    var mat = new THREE.MeshPhongMaterial({color: accentImage, ambient: accentImage});
  }
  
  var mesh = new THREE.Mesh(geom, mat);

  mesh.position.y = 0.5*height;
  mesh.rotateZ(-Math.PI/4);
  mesh.rotateY(Math.PI);
  frame.add(mesh);

  return frame;
}

/*
makeApostrophe()
Purpose: returns a tubular apostrophe to use in making text labels
Origin: bottom center of the tube
Parameters:
params (object) - general scene parameters
apostropheImage (string or color) - image to texture-map or color to use for material
*/
function makeApostrophe (params, apostropheImage) {
  var frame = new THREE.Object3D();

  var length = params.landmarkSize;
  var radius = spacePro*params.landmarkSize;
  var points = [new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0.25*length, -0.5*params.apostropheCurvature, 0),
                new THREE.Vector3(0.75*length, -0.5*params.apostropheCurvature, 0),
                new THREE.Vector3(length, 0, 0)];
  var geom = new THREE.TubeGeometry(new THREE.CubicBezierCurve3(points[0], points[1], points[2], points[3]), 64, radius, 64, false);

  if (typeof apostropheImage == "string") {
    var mat = new THREE.MeshBasicMaterial({color: 0xaf76a9});
  } else {
    var mat = new THREE.MeshPhongMaterial({color: apostropheImage, ambient: apostropheImage});
  }

  var mesh = new THREE.Mesh(geom, mat);

  mesh.rotateZ(degreesToRadians(50));
  frame.add(mesh);

  return frame;
}

/*
makeUmlaut()
Purpose: returns two spherical dots as an umlaut decoration for making text labels
Origin: center of the left spherical dot
Parameters:
params (object) - general scene parameters
dotsImage (string or color) - either the name of the image to texture-map, or the color to make the dot
*/
function makeUmlaut (params, dotsImage) {
  var frame = new THREE.Object3D();

  var dotGeom1 = new THREE.SphereGeometry(0.15*params.landmarkSize, 32, 32);

  if (typeof dotsImage == "string") {
    var dotMat = new THREE.MeshBasicMaterial({color: 0x00ffff});
  } else {
    var dotMat = new THREE.MeshPhongMaterial({color: dotsImage, ambient: dotsImage});
  }
  
  var dotMesh1 = new THREE.Mesh(dotGeom1, dotMat);

  var dotGeom2 = new THREE.SphereGeometry(0.15*params.landmarkSize, 32, 32);
  var dotMesh2 = new THREE.Mesh(dotGeom2, dotMat);

  frame.add(dotMesh1);
  dotMesh2.position.set(0.9*oWidth, 0, 0);
  frame.add(dotMesh2);

  return frame;
}

//******//
//Border helpers//
//******//

/*
makeSmoothJoin()
Purpose: returns a mesh that smoothly joins two other meshes created with curves
Origin: the second point on the first given curve
Parameters:
params (object) - general scene parameters
points1 (array) - the last two points on the first curve
points2 (array) - the first two points on the second curve
*/
function makeSmoothJoin (params, points1, points2) {
  var r0 = points1[1];
  var r3 = points2[0];

  var r1 = findLinePoint(points1, 1.01);
  var r2 = findLinePoint(points2, -0.01);
  var smoothCurve = new THREE.CubicBezierCurve3(r0, r1, r2, r3);
  var smoothMesh = makeBorderMesh(params, smoothCurve);
  return smoothMesh;
}

/*
makeBorderMesh()
Purpose: creates a mesh using THREE.TubeGeometry that is used to create the map borders
Origin: the first point on the given curve
Parameters:
params (object) - contains the general parameters used to set up the scene
curve - (THREE.Curve) - curve used to create the TubeGeometry
*/
function makeBorderMesh (params, curve) {
  var geom = new THREE.TubeGeometry(curve, 64, params.borderRadius, 32, false);
  var mat = new THREE.MeshPhongMaterial({color: 0x000000, ambient: 0x000000, side: THREE.DoubleSide});
  var mesh = new THREE.Mesh(geom, mat);
  return mesh;
}

//******//
//Math//
//******//

/*
spineCurveFromYValues()
Purpose: returns a THREE.SplineCurve3 from Vector3s whose x and z-values are 0 and
  whose y-values match those in the given array
  Used to create curves out of radius values that are used to create THREE.TubeRadialGeometries
Parameters:
values (array) - array of numbers that contain the y-values of the desired curve
*/
function splineCurveFromYValues (values) {
  var points = [];
  for (var i in values) {
    points.push(new THREE.Vector3(0, values[i], 0));
  }
  return new THREE.SplineCurve3(points);
}

/*
findLinePoint()
Purpose: returns a point on the line given by the points array at the given t-value
  this avoids having to create a curve out of the points and use the built-in getPoint() method of the Curve class
Parameters:
points (array) - array of two 3D Vectors that define the desired line
t (number) - t-value at which to evaluate the line
*/
function findLinePoint (points, t) {
  var p0 = new THREE.Vector3(points[0].x, points[0].y, points[0].z);
  var p1 = new THREE.Vector3(points[1].x, points[1].y, points[1].z);
  var firstTerm = p0.multiplyScalar(1 - t);
  var secondTerm = p1.multiplyScalar(t);

  var point = firstTerm.add(secondTerm);
  return point;
}

/*
vectorToString()
Purpose: helper method to print a Vector3 nicely (used for debugging)
Parameters:
v (Vector3) - Vector3 to print
*/
function vectorToString (v) {
  return v.x + ' ' + v.y + ' ' + v.z;
}

/*
randomSign()
Purpose: returns either 1 or -1 with equal probability (useful for setting control points of branches and leaves)
Parameters: none
*/
function randomSign () {
  var random = Math.random();
  if (random >= 0.5) {
    return 1;
  } 
  return -1;
}