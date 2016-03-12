// ================================================================
// Bezier Surfaces; additions to THREE.js

/**
 * @author Scott D. Anderson
 */

THREE.BezierSurfaceGeometry = function( controlPoints, sSegments, tSegments) {

    THREE.Geometry.call( this );

    this.type = 'BezierSurfaceGeometry';

    this.parameters = { controlPoints: controlPoints,
                        sSegments: sSegments,
                        tSegments: tSegments };

    this.controlPoints = controlPoints;
    this.sSegments = sSegments;
    this.tSegments = tSegments;

    this.computeBezierSurfacePoints();
    this.computeBezierSurfaceFaces();
    this.computeFaceNormals();
    this.computeVertexNormals();
};

/* I was going to have this inherit from THREE.PlaneGeometry, but there's
 * nothing useful to inherit, so I'll make it inherit from
 * Geometry. Actually, I'll just define a prototype. */

THREE.BezierSurfaceGeometry.prototype = Object.create( THREE.Geometry.prototype );


/**
 * @author Scott D. Anderson
 */

THREE.BezierSurfaceGeometry.prototype.computeBezierSurfacePoints =
    function () {
    var sSegments = this.sSegments;
    var tSegments = this.tSegments;
    var cps = this.controlPoints;

    var sInt, tInt; // the integer values correlating to s and t
    var s, t, verts = [];

    // First, compute all the vertices
    for( tInt = 0, t = 0; tInt <= tSegments; tInt++ ) {
        t = tInt/tSegments;
        for( sInt = 0; sInt <= sSegments; sInt++ ) {
            s = sInt/sSegments;
            // calculate blending functions (weights) for current point
            verts.push( bez(s, t) );
        }
    }
    this.vertices = verts;
    return verts;

    // the rest is all supporting functions

    function bez(s,t) {
        // this computes and returns a vertex at (s,t)
        // the code follows exactly the definition of a degree(3,3) bezier surface
        // see, for example, http://en.wikipedia.org/wiki/BÃ©zier_surface
        var i, j, M = 3, N = 3;
        var vert = new THREE.Vector3(0,0,0);  // initialize sums to zero
        for( i=0; i<=N; i++ ) {
            for( j=0; j<=M; j++ ) {
                var bernNIS = bernstein(N,i,s);
                var bernMJT = bernstein(M,j,t);
                var cp = cps[j][i];
                vert.x += cp[0] * bernNIS * bernMJT;
                // console.log("i: "+i+" j: "+j+" bernNIS: "+bernNIS+" bernMJT: "+bernMJT+" cp: "+cp[0]+" dx: "+(cp[0]*bernNIS*bernMJT)+" x: "+vert.x);

                vert.y += cp[1] * bernNIS * bernMJT;
                vert.z += cp[2] * bernNIS * bernMJT;
            }
        }
        return vert;
    }

    function bernstein(n,i,u) {
        // This is not the general Bernstein polynomial. We ignore n
        // and assume it's always 3.
        switch (i) {
        case 0: return (1-u)*(1-u)*(1-u);
        case 1: return 3*u*(1-u)*(1-u);
        case 2: return 3*u*u*(1-u);
        case 3: return u*u*u;
        }
    }

};

/**
 * @author Scott D. Anderson
 */

THREE.BezierSurfaceGeometry.prototype.computeBezierSurfaceFaces =
    function () {
    var sSegments = this.sSegments;
    var tSegments = this.tSegments;
    // perhaps unsurprisingly, we don't need to know the vertices; we just
    // need to generate indices into the vertex array.

    // This code is based in part on the code for THREE.PlaneGeometry from R67
    // However, that code goes top to bottom, and I want to go bottom to top,
    // so I had to change the face indices so that the faces were still CCW from the front        

    // x corresponds to s and z to t
    var ix, iz;

    var gridX = sSegments;
    var gridZ = tSegments;

    var gridX1 = gridX + 1;
    var gridZ1 = gridZ + 1;

    for ( iz = 0; iz < gridZ; iz ++ ) {

        for ( ix = 0; ix < gridX; ix ++ ) {

            var a = ix + gridX1 * iz;
            var b = ix + gridX1 * ( iz + 1 );
            var c = ( ix + 1 ) + gridX1 * ( iz + 1 );
            var d = ( ix + 1 ) + gridX1 * iz;

            var uva = new THREE.Vector2( ix / gridX, 1 - iz / gridZ );
            var uvb = new THREE.Vector2( ix / gridX, 1 - ( iz + 1 ) / gridZ );
            var uvc = new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ );
            var uvd = new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iz / gridZ );

            var face = new THREE.Face3( a, c, b );

            this.faces.push( face );
            this.faceVertexUvs[ 0 ].push( [ uva, uvb, uvd ] );

            face = new THREE.Face3( a, d, c );

            this.faces.push( face );
            this.faceVertexUvs[ 0 ].push( [ uvb.clone(), uvc, uvd.clone() ] );
        }
    }
};

var TW = { REVISION: '25' };

TW.createBarn = function(width, height, length) {
    var w = width, h = height, len = length;
    var barnGeometry = new THREE.Geometry();
    // add the front
    barnGeometry.vertices.push(new THREE.Vector3(0, 0, 0)); // vertex 0
    barnGeometry.vertices.push(new THREE.Vector3(w, 0, 0)); // vertex 1
    barnGeometry.vertices.push(new THREE.Vector3(w, h, 0)); // vertex 2
    barnGeometry.vertices.push(new THREE.Vector3(0, h, 0)); // vertex 3
    barnGeometry.vertices.push(new THREE.Vector3(0.5 * w, h + 0.5 * w, 0)); // 4

    // just add the back also manually
    barnGeometry.vertices.push(new THREE.Vector3(0, 0, -len)); // vertex 5
    barnGeometry.vertices.push(new THREE.Vector3(w, 0, -len)); // vertex 6
    barnGeometry.vertices.push(new THREE.Vector3(w, h, -len)); // vertex 7
    barnGeometry.vertices.push(new THREE.Vector3(0, h, -len)); // vertex 8
    barnGeometry.vertices.push(new THREE.Vector3(0.5 * w, h + 0.5 * w, -len)); // 9

    // now that we've got the vertices we need to define the faces.
    // front faces
    barnGeometry.faces.push(new THREE.Face3(0, 1, 2)); // 0
    barnGeometry.faces.push(new THREE.Face3(0, 2, 3));
    barnGeometry.faces.push(new THREE.Face3(3, 2, 4));

    // back faces
    barnGeometry.faces.push(new THREE.Face3(5, 7, 6)); // 3
    barnGeometry.faces.push(new THREE.Face3(5, 8, 7));
    barnGeometry.faces.push(new THREE.Face3(7, 8, 9));

    // roof faces.
    barnGeometry.faces.push(new THREE.Face3(3, 4, 8)); // 6
    barnGeometry.faces.push(new THREE.Face3(4, 9, 8));
    barnGeometry.faces.push(new THREE.Face3(2, 7, 9)); // 8
    barnGeometry.faces.push(new THREE.Face3(4, 2, 9));

    // side faces
    barnGeometry.faces.push(new THREE.Face3(6, 2, 1)); // 10
    barnGeometry.faces.push(new THREE.Face3(7, 2, 6));
    barnGeometry.faces.push(new THREE.Face3(0, 3, 5)); // 12
    barnGeometry.faces.push(new THREE.Face3(3, 8, 5));

    // floor faces
    barnGeometry.faces.push(new THREE.Face3(0, 5, 1)); // 14
    barnGeometry.faces.push(new THREE.Face3(5, 6, 1));

    // calculate the normals for shading
    barnGeometry.computeFaceNormals();
    // barnGeometry.computeVertexNormals(true); only for "rounded" objects

    return barnGeometry;
};

TW.setMaterialForFaces = function(geom, materialIndex, faceIndexes) {
    /* Sets the material index for a list of faces, or all remaining
     * arguments. Very often, you want to say faces [1, 2, 3, 7, 8] are all
     * materialIndex M, and your code is five tedious assignment
     * statements. This simplifies that. You can either give M and a list of
     * face indexes, or all remaining arguments are the list of indexes.
     */

    var i, len, list;
    var faces = geom.faces;
    if( faceIndexes instanceof Array ) {
        // last arg is an array, so iterate over all of it
        list = faceIndexes;
        i = 0;
    } else if( typeof faceIndexes === 'number' ) {
        // it's just the first of many, so use the magic arguments list
        // but skip the first two arguments
        list = arguments;
        i = 2;
    } else {
        throw "faceIndexes must be a list or the first of some numbers";
    }
    // from here on, we just iterate over 'list' starting at 'i'
    len = list.length;
    for( ; i < len; ++i ) {
        var faceIndex = list[i];
        if( TW.debug ) {
            console.log("setting face "+faceIndex+" to material "+materialIndex);
        }
        faces[faceIndex].materialIndex = materialIndex;
    }
}