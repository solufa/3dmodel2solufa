!function() {
  window.meshSeparator = function( result ) {
    var meshes = [];
    result.forEach( function( mesh ) {

    });
    return meshes;
  };
}();

!function() {
  var loader = {};

  var model2Solufa = function( script_path, name, type, data, images, callback ) {

    function loaded( result ) {
      var files = [];

      // var meshes = meshSeparator( result );

      var asset = {
        name: encodeURIComponent( name ),
        version: "0.1.0",
        main: {
          geos: [ "./dist/geos.json" ],
          mtls: result.mtls,
          view: [ "meshes", { geos: 0, mtls: result.geos.map( function( geo, i ) {
            return geo.m;
          })} ]
        },
        engines: {
          solufa: S.version
        }
      };

      files.push({
        path: "asset.json",
        json: asset
      });

      result.mtls.forEach( function( mtl ) {
        if ( mtl.value.map ) {
          mtl.value.map.src = "./dist/" + mtl.value.map.src;
          files.push({
            path: mtl.value.map.src,
            img: mtl.value.map.src.split( "/" ).pop()
          });
        }
      });

      var geoData = {
        v: result.v,
        vs: result.vs
      };

      if ( result.uv.length ) {
        geoData.uv = result.uv;
        geoData.us = result.us;
      }

      if ( result.vn.length ) {
        geoData.vn = result.vn;
        geoData.ns = result.ns;
      }

      geoData.g = result.geos.map( function( geo ) {
        var obj = {};
        if ( geo.f4 ) obj.f4 = geo.f4;
        if ( geo.f3 ) obj.f3 = geo.f3;
        return obj;
      });

      files.push({
        path: "./dist/geos.json",
        json: geoData
      });

      callback( files );
    }

    if ( !loader[ type ] ) {
      loader[ type ] = "waiting";
      var script = document.createElement( "script" );
      script.onload = function( e ) {
        loader[ type ]( data, loaded );
      };
      script.setAttribute( "src", script_path + "loader/" + type + ".js" );
      document.body.appendChild( script );
    } else {
      loader[ type ]( data, loaded );
    }
  };

  model2Solufa.loader = loader;

  window.model2Solufa = model2Solufa;
}();
