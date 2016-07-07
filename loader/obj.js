!function() {

/**
 * @author mrdoob / http://mrdoob.com/
 */

var OBJLoader = function () {
	this.materials = null;

};

OBJLoader.prototype = {

	constructor: OBJLoader,

	load: function ( geo, mtls, onLoad ) {

    var text = geo.text;

    var mtlSrc = /mtllib (.+)/.test( text ) && text.match( /mtllib (.+)/ )[1];

    if ( !mtlSrc ) {
      onLoad( this.parse( text ) );
    } else {
      var mtl;
      for ( var i = 0; i < mtls.length; i++ ) {
        if ( mtls[ i ].name === mtlSrc.split( "/" ).pop() ) {
          mtl = mtls[ i ];
          break;
        }
      }
      var mtlLoader = new MTLLoader;
      mtlLoader.setBaseUrl( "" );
      var mtlCreator = mtlLoader.parse( mtl.text );
      mtlCreator.preload();
      this.setMaterials( mtlCreator );
      onLoad( this.parse( text ) );
    }

	},

	setPath: function ( value ) {

		this.path = value;

	},

	setMaterials: function ( materials ) {

		this.materials = materials;

	},

	parse: function ( text ) {

		console.time( 'OBJLoader' );

		var objects = [];
		var object;
		var foundObjects = false;
		var vertices = [];
		var normals = [];
		var uvs = [];
		var allVertices = [];
		var allNormals = [];
		var allUvs = [];
		var vecIndex = {};
		var vnIndex = {};
		var uvIndex = {};
		var vecDecimalPointLength = 0;
		var vnDecimalPointLength = 0;
		var uvDecimalPointLength = 0;
		var mtls = [];
		var mtlIndex = {};

		function addObject( name ) {

			var geometry = {
				vertices: [],
				normals: [],
				uvs: []
			};

			var material = {
				name: '',
				smooth: true
			};

			object = {
				name: name,
				geometry: geometry,
				material: material,
				f4: {
					v: [],
					uv: [],
					vn: []
				},
				f3: {
					v: [],
					uv: [],
					vn: []
				}
			};

			objects.push( object );

		}

		function parseVertexIndex( value ) {

			var index = parseInt( value );
			index = ( index >= 0 ? index - 1 : index + allVertices.length / 3 ) * 3;
			var key = generateKey( allVertices[ index ], allVertices[ index + 1 ], allVertices[ index + 2 ] );

			return vecIndex[ key ];

		}

		function parseNormalIndex( value ) {

			var index = parseInt( value );
			index = ( index >= 0 ? index - 1 : index + allNormals.length / 3 ) * 3;

			var key = generateKey( allNormals[ index ], allNormals[ index + 1 ], allNormals[ index + 2 ] );

			return vnIndex[ key ];
		}

		function parseUVIndex( value ) {

			var index = parseInt( value );

			index = ( index >= 0 ? index - 1 : index + allUvs.length / 2 ) * 2;
			var key = generateKey2( allUvs[ index ], allUvs[ index + 1 ] );

			return uvIndex[ key ];
		}

		function addVertex( a, b, c ) {

			object.geometry.vertices.push(
				vertices[ a ], vertices[ a + 1 ], vertices[ a + 2 ],
				vertices[ b ], vertices[ b + 1 ], vertices[ b + 2 ],
				vertices[ c ], vertices[ c + 1 ], vertices[ c + 2 ]
			);

		}

		function addNormal( a, b, c ) {

			object.geometry.normals.push(
				normals[ a ], normals[ a + 1 ], normals[ a + 2 ],
				normals[ b ], normals[ b + 1 ], normals[ b + 2 ],
				normals[ c ], normals[ c + 1 ], normals[ c + 2 ]
			);

		}

		function addUV( a, b, c ) {

			object.geometry.uvs.push(
				uvs[ a ], uvs[ a + 1 ],
				uvs[ b ], uvs[ b + 1 ],
				uvs[ c ], uvs[ c + 1 ]
			);

		}

		function addVec2F3( a, b, c ) {
			object.f3.v.push( a, b, c );
		}

		function addVec2F4( a, b, c, d ) {
			object.f4.v.push( a, b, c, d );
		}

		function addUv2F3( a, b, c ) {
			object.f3.uv.push( a, b, c );
		}

		function addUv2F4( a, b, c, d ) {
			object.f4.uv.push( a, b, c, d );
		}

		function addVn2F3( a, b, c ) {
			object.f3.vn.push( a, b, c );
		}

		function addVn2F4( a, b, c, d ) {
			object.f4.vn.push( a, b, c, d );
		}

		function addFace( a, b, c, d,  ua, ub, uc, ud, na, nb, nc, nd ) {

			var ia = parseVertexIndex( a );
			var ib = parseVertexIndex( b );
			var ic = parseVertexIndex( c );
			var id;

			if ( d === undefined ) {

				addVertex( ia, ib, ic );
				addVec2F3( ia, ib, ic );

			} else {

				id = parseVertexIndex( d );

				addVertex( ia, ib, id );
				addVertex( ib, ic, id );
				addVec2F4( ia, ib, ic, id );

			}

			if ( ua !== undefined ) {

				ia = parseUVIndex( ua );
				ib = parseUVIndex( ub );
				ic = parseUVIndex( uc );

				if ( d === undefined ) {

					addUV( ia, ib, ic );
					addUv2F3( ia, ib, ic );

				} else {

					id = parseUVIndex( ud );

					addUV( ia, ib, id );
					addUV( ib, ic, id );
					addUv2F4( ia, ib, ic, id );

				}

			}

			if ( na !== undefined ) {

				ia = parseNormalIndex( na );
				ib = parseNormalIndex( nb );
				ic = parseNormalIndex( nc );

				if ( d === undefined ) {

					addNormal( ia, ib, ic );
					addVn2F3( ia, ib, ic );

				} else {

					id = parseNormalIndex( nd );

					addNormal( ia, ib, id );
					addNormal( ib, ic, id );
					addVn2F4( ia, ib, ic, id );

				}

			}

		}

		addObject( '' );

		// v float float float
		var vertex_pattern = /^v\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/;

		// vn float float float
		var normal_pattern = /^vn\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/;

		// vt float float
		var uv_pattern = /^vt\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/;

		// f vertex vertex vertex ...
		var face_pattern1 = /^f\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)(?:\s+(-?\d+))?/;

		// f vertex/uv vertex/uv vertex/uv ...
		var face_pattern2 = /^f\s+((-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+))(?:\s+((-?\d+)\/(-?\d+)))?/;

		// f vertex/uv/normal vertex/uv/normal vertex/uv/normal ...
		var face_pattern3 = /^f\s+((-?\d+)\/(-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+)\/(-?\d+))(?:\s+((-?\d+)\/(-?\d+)\/(-?\d+)))?/;

		// f vertex//normal vertex//normal vertex//normal ...
		var face_pattern4 = /^f\s+((-?\d+)\/\/(-?\d+))\s+((-?\d+)\/\/(-?\d+))\s+((-?\d+)\/\/(-?\d+))(?:\s+((-?\d+)\/\/(-?\d+)))?/;

		var object_pattern = /^[og]\s*(.+)?/;

		var smoothing_pattern = /^s\s+(\d+|on|off)/;

		//

		var lines = text.split( '\n' );

		function generateKey( x, y, z ) {
			return x + "_" + y + "_" + z;
		}

		function generateKey2( u, v ) {
			return u + "_" + v;
		}

		function getDecimalPointLength(number) {
	    var numbers = String(number).split('.'),
	        result  = 0;

	    if (numbers[1]) {
	        result = numbers[1].length;
	    }

	    return result;
		}

		for ( var i = 0; i < lines.length; i ++ ) {

			var line = lines[ i ];
			line = line.trim();

			var result;

			if ( line.length === 0 || line.charAt( 0 ) === '#' ) {

				continue;

			} else if ( ( result = vertex_pattern.exec( line ) ) !== null ) {

				// ["v 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
				allVertices.push(
					result[ 1 ],
					result[ 2 ],
					result[ 3 ]
				);

				var key = generateKey( result[ 1 ], result[ 2 ], result[ 3 ] );
				if ( vecIndex[ key ] === undefined ) {
					vecIndex[ key ] = vertices.length;
					vertices.push(
						parseFloat( result[ 1 ] ),
						parseFloat( result[ 2 ] ),
						parseFloat( result[ 3 ] )
					);

					var length = getDecimalPointLength( result[ 1 ] );
					if ( length > vecDecimalPointLength ) {
						vecDecimalPointLength = length;
					}
				}

			} else if ( ( result = normal_pattern.exec( line ) ) !== null ) {

				// ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
				allNormals.push(
					result[ 1 ],
					result[ 2 ],
					result[ 3 ]
				);

				var key = generateKey( result[ 1 ], result[ 2 ], result[ 3 ] );
				if ( vnIndex[ key ] === undefined ) {
					vnIndex[ key ] = normals.length;
					normals.push(
						parseFloat( result[ 1 ] ),
						parseFloat( result[ 2 ] ),
						parseFloat( result[ 3 ] )
					);

					var length = getDecimalPointLength( result[ 1 ] );
					if ( length > vnDecimalPointLength ) {
						vnDecimalPointLength = length;
					}
				}

			} else if ( ( result = uv_pattern.exec( line ) ) !== null ) {

				// ["vt 0.1 0.2", "0.1", "0.2"]
				allUvs.push(
					result[ 1 ],
					result[ 2 ]
				);

				var key = generateKey2( result[ 1 ], result[ 2 ] );
				if ( uvIndex[ key ] === undefined ) {
					uvIndex[ key ] = uvs.length;
					uvs.push(
						parseFloat( result[ 1 ] ),
						parseFloat( result[ 2 ] )
					);

					var length = getDecimalPointLength( result[ 1 ] );
					if ( length > uvDecimalPointLength ) {
						uvDecimalPointLength = length;
					}
				}

			} else if ( ( result = face_pattern1.exec( line ) ) !== null ) {

				// ["f 1 2 3", "1", "2", "3", undefined]

				addFace(
					result[ 1 ], result[ 2 ], result[ 3 ], result[ 4 ]
				);

			} else if ( ( result = face_pattern2.exec( line ) ) !== null ) {

				// ["f 1/1 2/2 3/3", " 1/1", "1", "1", " 2/2", "2", "2", " 3/3", "3", "3", undefined, undefined, undefined]

				addFace(
					result[ 2 ], result[ 5 ], result[ 8 ], result[ 11 ],
					result[ 3 ], result[ 6 ], result[ 9 ], result[ 12 ]
				);

			} else if ( ( result = face_pattern3.exec( line ) ) !== null ) {

				// ["f 1/1/1 2/2/2 3/3/3", " 1/1/1", "1", "1", "1", " 2/2/2", "2", "2", "2", " 3/3/3", "3", "3", "3", undefined, undefined, undefined, undefined]

				addFace(
					result[ 2 ], result[ 6 ], result[ 10 ], result[ 14 ],
					result[ 3 ], result[ 7 ], result[ 11 ], result[ 15 ],
					result[ 4 ], result[ 8 ], result[ 12 ], result[ 16 ]
				);

			} else if ( ( result = face_pattern4.exec( line ) ) !== null ) {

				// ["f 1//1 2//2 3//3", " 1//1", "1", "1", " 2//2", "2", "2", " 3//3", "3", "3", undefined, undefined, undefined]

				addFace(
					result[ 2 ], result[ 5 ], result[ 8 ], result[ 11 ],
					undefined, undefined, undefined, undefined,
					result[ 3 ], result[ 6 ], result[ 9 ], result[ 12 ]
				);

			} else if ( ( result = object_pattern.exec( line ) ) !== null ) {

				// o object_name
				// or
				// g group_name

				var name = result[ 0 ].substr( 1 ).trim();

				if ( foundObjects === false ) {

					foundObjects = true;
					object.name = name;

				} else {

					addObject( name );

				}

			} else if ( /^usemtl /.test( line ) ) {

				// material

				object.material.name = line.substring( 7 ).trim();

			} else if ( /^mtllib /.test( line ) ) {

				// mtl file

			} else if ( ( result = smoothing_pattern.exec( line ) ) !== null ) {

				// smooth shading

				object.material.smooth = result[ 1 ] === "1" || result[ 1 ] === "on";

			} else {

				throw new Error( "Unexpected line: " + line );

			}

		}

		var container = [];

		for ( var i = 0, l = objects.length; i < l; i ++ ) {

			object = objects[ i ];
			var geometry = object.geometry;

			if ( !geometry.vertices.length ) continue;

			var buffergeometry = {
        type: "Buffer",
        attrs: {
          position: geometry.vertices
        }
      };
      var attrs = buffergeometry.attrs;

			if ( geometry.normals.length > 0 ) {
        attrs.normal = geometry.normals;
			}

			if ( geometry.uvs.length > 0 ) {
        attrs.uv = geometry.uvs;
			}

			var material;
			var shading = object.material.smooth ? 2 /*THREE.SmoothShading*/ : 1 /*THREE.FlatShading*/;
			var mtlNumber;
			var key = object.material.name;

			if ( this.materials !== null ) {

				if ( mtlIndex[ key ] === undefined ) {
					material = this.materials.create( key );
					material.value.shading = shading;

					mtlIndex[ key ] = mtls.length;
					mtls.push( material );
				}

				mtlNumber = mtlIndex[ key ];

			}

			if ( mtlNumber === undefined ) {

				if ( mtlIndex[ key ] === undefined ) {
					material = {
	          type: "MeshPhong",
	          value: {
	            color: "#ccc"
	          }
	        };

					mtlIndex[ key ] = mtls.length;
					mtls.push( material );
				}

				mtlNumber = mtlIndex[ key ];

			}

			container.push({
        m: mtlNumber,
				f3: object.f3,
				f4: object.f4
      });

		}

		console.timeEnd( 'OBJLoader' );

		return [{
		  v: vertices.map( function( n ) {
				return Math.round( n * Math.pow( 10, vecDecimalPointLength ) );
			}),
		  vs: 1 / Math.pow( 10, vecDecimalPointLength ),
		  uv: uvs.map( function( n ) {
				return Math.round( n * Math.pow( 10, uvDecimalPointLength ) );
			}),
		  us: 1 / Math.pow( 10, uvDecimalPointLength ),
		  vn: normals.map( function( n ) {
				return Math.round( n * Math.pow( 10, vnDecimalPointLength ) );
			}),
		  ns: 1 / Math.pow( 10, vnDecimalPointLength ),
		  m: mtls,
		  f: container
		}];

	}

};

/**
 * Loads a Wavefront .mtl file specifying materials
 *
 * @author angelxuanchang
 */

var mtls = [];
var mtlUrlList = [];


var MTLLoader = function( manager ) {
};

MTLLoader.prototype = {

	constructor: MTLLoader,

	load: function ( url, onLoad, onProgress, onError ) {

	  var index = mtlUrlList.indexOf( this.path + url );

	  if ( index !== -1 ) {
			var data = mtls[ index ];
	    if ( Array.isArray( data ) ) { // waiting
	      data.push( { onLoad: onLoad, onError: onError, onProgress: onProgress } );
	    } else if ( data.type === "loaded" ) {
				onLoad( data.data );
	    } else if ( data.type === "error" ) {
				onError( data.data );
			}
	  } else {
	    mtlUrlList.push( this.path + url );
	    mtls.push( [ { onLoad: onLoad, onProgress: onProgress, onError: onError } ] ); // isArray: waiting
	    index = mtls.length - 1;

			var scope = this;
			var loader = new XHRLoader( this.manager );
			loader.setPath( this.path );
			loader.load( url, function ( text ) {

				var mtl = scope.parse( text );
				mtls[ index ].forEach( function( param ) {
					param.onLoad( mtl );
				});
				mtls[ index ] = { type: "loaded", data: mtl };

			}, function( e ) { // progress
				mtls[ index ].forEach( function( param ) {
					param.onProgress && param.onProgress( e );
				});
			}, function( e ) { // error
				mtls[ index ].forEach( function( param ) {
					param.onError && param.onError( e );
				});
				mtls[ index ] = { type: "error", data: e };
			} );
	  }

	},

	setPath: function ( value ) {

		this.path = value;

	},

	setBaseUrl: function( value ) {

		// TODO: Merge with setPath()? Or rename to setTexturePath?

		this.baseUrl = value;

	},

	setCrossOrigin: function ( value ) {

		this.crossOrigin = value;

	},

	setMaterialOptions: function ( value ) {

		this.materialOptions = value;

	},

	/**
	 * Parses loaded MTL file
	 * @param text - Content of MTL file
	 * @return {MTLLoader.MaterialCreator}
	 */
	parse: function ( text ) {

		var lines = text.split( "\n" );
		var info = {};
		var delimiter_pattern = /\s+/;
		var materialsInfo = {};

		for ( var i = 0; i < lines.length; i ++ ) {

			var line = lines[ i ];
			line = line.trim();

			if ( line.length === 0 || line.charAt( 0 ) === '#' ) {

				// Blank line or comment ignore
				continue;

			}

			var pos = line.indexOf( ' ' );

			var key = ( pos >= 0 ) ? line.substring( 0, pos ) : line;
			key = key.toLowerCase();

			var value = ( pos >= 0 ) ? line.substring( pos + 1 ) : "";
			value = value.trim();

			if ( key === "newmtl" ) {

				// New material

				info = { name: value };
				materialsInfo[ value ] = info;

			} else if ( info ) {

				if ( key === "ka" || key === "kd" || key === "ks" ) {

					var ss = value.split( delimiter_pattern, 3 );
					info[ key ] = [ parseFloat( ss[ 0 ] ), parseFloat( ss[ 1 ] ), parseFloat( ss[ 2 ] ) ];

				} else {

					info[ key ] = value;

				}

			}

		}

		var materialCreator = new MTLLoader.MaterialCreator( this.baseUrl, this.materialOptions );
		materialCreator.setCrossOrigin( this.crossOrigin );
		materialCreator.setManager( this.manager );
		materialCreator.setMaterials( materialsInfo );
		return materialCreator;

	}

};

/**
 * Create a new THREE-MTLLoader.MaterialCreator
 * @param baseUrl - Url relative to which textures are loaded
 * @param options - Set of options on how to construct the materials
 *                  side: Which side to apply the material
 *                        FrontSide (default), BackSide, DoubleSide
 *                  wrap: What type of wrapping to apply for textures
 *                        RepeatWrapping (default), ClampToEdgeWrapping, MirroredRepeatWrapping
 *                  normalizeRGB: RGBs need to be normalized to 0-1 from 0-255
 *                                Default: false, assumed to be already normalized
 *                  ignoreZeroRGBs: Ignore values of RGBs (Ka,Kd,Ks) that are all 0's
 *                                  Default: false
 * @constructor
 */

MTLLoader.MaterialCreator = function( baseUrl, options ) {

	this.baseUrl = baseUrl;
	this.options = options;
	this.materialsInfo = {};
	this.materials = {};
	this.materialsArray = [];
	this.nameLookup = {};

	this.side = ( this.options && this.options.side ) ? this.options.side : 0; // THREE.FrontSide
	this.wrap = ( this.options && this.options.wrap ) ? this.options.wrap : 1000; // THREE.RepeatWrapping

};

MTLLoader.MaterialCreator.prototype = {

	constructor: MTLLoader.MaterialCreator,

	setCrossOrigin: function ( value ) {

		this.crossOrigin = value;

	},

	setManager: function ( value ) {

		this.manager = value;

	},

	setMaterials: function( materialsInfo ) {

		this.materialsInfo = this.convert( materialsInfo );
		this.materials = {};
		this.materialsArray = [];
		this.nameLookup = {};

	},

	convert: function( materialsInfo ) {

		if ( ! this.options ) return materialsInfo;

		var converted = {};

		for ( var mn in materialsInfo ) {

			// Convert materials info into normalized form based on options

			var mat = materialsInfo[ mn ];

			var covmat = {};

			converted[ mn ] = covmat;

			for ( var prop in mat ) {

				var save = true;
				var value = mat[ prop ];
				var lprop = prop.toLowerCase();

				switch ( lprop ) {

					case 'kd':
					case 'ka':
					case 'ks':

						// Diffuse color (color under white light) using RGB values

						if ( this.options && this.options.normalizeRGB ) {

							value = [ value[ 0 ] / 255, value[ 1 ] / 255, value[ 2 ] / 255 ];

						}

						if ( this.options && this.options.ignoreZeroRGBs ) {

							if ( value[ 0 ] === 0 && value[ 1 ] === 0 && value[ 1 ] === 0 ) {

								// ignore

								save = false;

							}

						}

						break;

					default:

						break;
				}

				if ( save ) {

					covmat[ lprop ] = value;

				}

			}

		}

		return converted;

	},

	preload: function () {

		for ( var mn in this.materialsInfo ) {

			this.create( mn );

		}

	},

	getIndex: function( materialName ) {

		return this.nameLookup[ materialName ];

	},

	getAsArray: function() {

		var index = 0;

		for ( var mn in this.materialsInfo ) {

			this.materialsArray[ index ] = this.create( mn );
			this.nameLookup[ mn ] = index;
			index ++;

		}

		return this.materialsArray;

	},

	create: function ( materialName ) {

		if ( this.materials[ materialName ] === undefined ) {

			this.createMaterial_( materialName );

		}

		return this.materials[ materialName ];

	},

	createMaterial_: function ( materialName ) {

		// Create material

		var mat = this.materialsInfo[ materialName ];
		var params = {
			side: this.side
		};

		for ( var prop in mat ) {

			var value = mat[ prop ];

			if ( value === '' ) continue;

			switch ( prop.toLowerCase() ) {

				// Ns is material specular exponent

				case 'kd':

					// Diffuse color (color under white light) using RGB values

					params[ 'color' ] = value[ 0 ] * 0xff0000 + value[ 1 ] * 0xff00 + value[ 2 ] * 0xff;

					break;

				case 'ks':

					// Specular color (color when light is reflected from shiny surface) using RGB values
					params[ 'specular' ] = value[ 0 ] * 0xff0000 + value[ 1 ] * 0xff00 + value[ 2 ] * 0xff;

					break;

				case 'map_kd':

					// Diffuse texture map

					params[ 'map' ] = this.loadTexture( this.baseUrl + value, this.wrap );

					break;

				case 'ns':

					// The specular exponent (defines the focus of the specular highlight)
					// A high exponent results in a tight, concentrated highlight. Ns values normally range from 0 to 1000.

					params[ 'shininess' ] = parseFloat( value );

					break;

				case 'd':

					if ( value < 1 ) {

						params[ 'opacity' ] = value;
						params[ 'transparent' ] = true;

					}

					break;

				case 'Tr':

					if ( value > 0 ) {

						params[ 'opacity' ] = 1 - value;
						params[ 'transparent' ] = true;

					}

					break;

				case 'map_bump':
				case 'bump':

					// Bump texture map

					if ( params[ 'bumpMap' ] ) break; // Avoid loading twice.

					params[ 'bumpMap' ] = this.loadTexture( this.baseUrl + value, this.wrap );

					break;

				default:
					break;

			}

		}

		this.materials[ materialName ] = {
      type: "MeshPhong",
      value: params
    };
		return this.materials[ materialName ];

	},

	loadTexture: function( url, wrap ) {
		return {
      type: "image",
      src: url
    };
	}

};


model2Solufa.loader.obj = function( files, callback ) {
  var mtls = [];
  var geo;
  files.forEach( function( file ) {
    if ( /mtl$/.test( file.name ) ) {
      mtls.push( file );
    } else {
      geo = file;
    }
  });
  var loader = new OBJLoader;
  loader.load( geo, mtls, callback );
};

}();
