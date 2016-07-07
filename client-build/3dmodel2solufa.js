!function() {
  var loader = {};

  var model2Solufa = function( script_path, name, type, data, images, callback ) {

    function loaded( result ) {
      var files = [];

      var asset = {
        name: encodeURIComponent( name ),
        version: "0.1.0",
        main: "./dist/main/view.json",
        engines: {
          solufa: S.version
        }
      };

      files.push({
        path: "asset.json",
        json: asset
      });

      var view = {
        data: result.map( function( r, idx ) {
          return "./data/mesh" + idx + ".json";
        }),
        view: [ "obj", {}, result.map( function( mesh, idx ) {
          return [ "data", { mesh: "$" + idx } ];
        })]
      };

      files.push({
        path: "./dist/main/view.json",
        json: view
      });

      result.forEach( function( file, idx ) {
        files.push({
          path: "./dist/main/data/mesh" + idx + ".json",
          json: file
        });

        file.m.forEach( function( mtl ) {
          if ( mtl.value.map ) {
            files.push({
              path: "./dist/main/data/" + mtl.value.map.src,
              img: mtl.value.map.src.split( "/" ).pop()
            });
          }
        });
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
