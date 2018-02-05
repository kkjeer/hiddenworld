/*
Katherine Kjeer
2014
utility_functions.js
Contains material, modeling, rendering, and mathematical functions
  used by multiple other .js files in the project.
*/

//******//
//GLOBALS//
//******//

//for loading images in textureMaterial()
var imagesUsed = [];
var PATH = "Images/";
var FORMAT = ".png";

//global textured materials (to avoid loading the same texture multiple times)
var globalMaterials = {"blue_coral1": textureMaterial("blue_coral1.png"),
                       "gray_wall": textureMaterial("gray_wall.png"),
                       "bright_grass": textureMaterial("bright_grass.png"),
                       "rough_wood": textureMaterial("rough_wood.png"),
                       "forest_bark": textureMaterial("forest_bark.jpg"),
                       "leaf_fern_light": textureMaterial("leaf_fern_light.jpg"),
                       "burlap": textureMaterial("burlap.png"),
                       "red_wood": textureMaterial("red_wood.png"),
                       "dark_wood": textureMaterial("blue_jay_feather.png"),
                       "blue_jay_feather": textureMaterial("blue_jay_feather.png"),
                       "forest_floor": textureMaterial("forest_floor.png")};

//*******//
//END GLOBALS//
//******//

//******//
//MUSIC FUNCTIONS//
//******//



//******//
//MATERIAL FUNCTIONS//
//******//

/*
createMaterial()
Purpose: returns either a texture-mapped material, a multicolored material, or a single-colored material
Parameters:
  image (String, array, or color): determines what kind of material to return
*/
function createMaterial (image) {
  if (typeof image == "string") {
    var mat = globalMaterials[image];
    if (mat == undefined) {
      mat = textureMaterial(image + ".png");
    }
  } else if (image.constructor == Array) {
    var mat = multicoloredMaterial(new THREE.Color(image[0]), new THREE.Color(image[1]), 50/*Math.floor(geom.faces.length/10)*/);
  } else {
    var mat = new THREE.MeshPhongMaterial({color: image, ambient: image});
  }
  return mat;
}

/*
createCubeMap()
Purpose: returns a textured cube for use in environment mapping
Parameters:
  skyImage (string): the image to use for the ceiling of the cube
  wallImage (string): the image to use for the four walls of the cube
  groundImage (string): the image to use for the floor of the cube
*/
function createCubeMap (skyImage, wallImage, groundImage) {
  var urls = [PATH + wallImage + FORMAT, PATH + wallImage + FORMAT,
              PATH + skyImage + FORMAT, PATH + groundImage + FORMAT,
              PATH + wallImage + FORMAT, PATH + groundImage + FORMAT];
  var textureCube = THREE.ImageUtils.loadTextureCube(urls);
  return textureCube;
}

/*
textureMaterial()
Purpose: returns a material with the image from the given url texture-mapped onto it
Parameters:
  url (string): the image to texture-map
*/
function textureMaterial (url) {
  imagesUsed.push(url);
  //load the texture from the given url
  var texture = new THREE.ImageUtils.loadTexture(PATH + url, new THREE.UVMapping());
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.needsUpdate = true;

  //create and return the material
  var mat = new THREE.MeshPhongMaterial({color: 0xffffff, ambient: 0xffffff, side: THREE.DoubleSide});
  mat.map = texture;
  mat.name = "texture from: "+url;
  return mat;
}

//******//
//END MATERIAL FUNCTIONS//
//******//

//******//
//MODELING/RENDERING FUNCTIONS//
//******//

/*
makeBox()
Purpose: returns a box-shaped mesh with the given images texture-mapped onto the inside
  this is used by the hiddenWorld, archeryCenter and swordCenter to wrap all three models inside large boxes
    to give the illusion of being completely surrounded by the model
  origin: center of the box
Parameters:
  boxSize (number): the height, width, and depth of the box
  skyImage (string): the image to map onto the ceiling of the box
  wallImage (string): the image to map onto the four walls of the box
  groundImage (string): the image to map onto the floor of the box
*/
function makeBox (boxSize, skyImage, wallImage, groundImage) {
  var geom = new THREE.BoxGeometry(boxSize, boxSize, boxSize);

  var wallMat = textureMaterial(wallImage);
  var skyMat = textureMaterial(skyImage);
  var groundMat = textureMaterial(groundImage);
  var matArray = [wallMat, wallMat, skyMat, groundMat, wallMat, wallMat];
  for (var m in matArray) {
    matArray[m].side = THREE.BackSide;
  }
  var mat = new THREE.MeshFaceMaterial(matArray);

  var mesh = new THREE.Mesh(geom, mat);
  return mesh;
}

function makeOrigin (radius, spherecolor) {
  if (!spherecolor) {
    spherecolor = 0xffff00;
  }
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 16), new THREE.MeshBasicMaterial({color: spherecolor}));
}

/*
render()
Purpose: renders the global scene using requestAnimationFrame()
  also updates all Tweens
*/
function render () {
  requestAnimationFrame(render);
  TWEEN.update();

  hiddenWorld.animate();

  renderer.autoClear = false;
  renderer.clear();
  renderer.render(backgroundScene, backgroundCamera);
  renderer.render(scene, camera);
}

/*
markOrigin()
Purpose: adds a spherical dot at the origin of the given frame (used for debugging)
Parameters:
  frame (Object3D): object to mark
*/
function markOrigin (frame) {
  var origin = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 32), new THREE.MeshBasicMaterial({color: 0x000000}));
  frame.add(origin);
}

//******//
//END MODELING/RENDERING FUNCTIONS//
//******//

//******//
//MATH FUNCTIONS//
//******//

/*
randomPointsInTriangle()
Purpose: returns an array of numPoints pseudorandom Vector3's from a uniform distribution 
  in the triangle defined by a, b, and c
  Used to place trees in the hiddenWorld
Parameters:
  a, b, and c (Vector3's): Vector3's that define the desired triangle
  numPoints (number): the number of points to return
*/
function randomPointsInTriangle (a, b, c, numPoints) {
  var points = [];
  var range = 1/numPoints;
  for (var i = 0; i < numPoints; i++) {
    var r1 = Math.random();//*range + i*range;
    var r2 = Math.random();//*range + i*range;
    var aCoeff = 1 - Math.sqrt(r1);
    var bCoeff = Math.sqrt(r1)*(1 - r2);
    var cCoeff = r2*Math.sqrt(r1);
    var newA = a.clone().multiplyScalar(aCoeff);
    var newB = b.clone().multiplyScalar(bCoeff);
    var newC = c.clone().multiplyScalar(cCoeff);
    points.push(newA.add(newB).add(newC));
  }
  return points;
}

/*
randomInRange()
Purpose: returns a pseudorandom number from the uniform distribution over [min, max]
*/
function randomInRange (min, max) {
  return Math.random()*(max - min) + min;
}

/*
degreesToRadians()
Purpose: returns the given number of degrees in radians
Parameters:
  deg (number): degrees to convert into radians
*/
function degreesToRadians (deg) {
  return deg*Math.PI/180;
}

/*
radiansToDegrees()
Purpose: returns the given number of radians in degrees
Parameters:
  rad (number): radians to convert into degrees
*/
function radiansToDegrees (rad) {
  return rad*180/Math.PI;
}

//******//
//END MATH FUNCTIONS//
//******//
