!function() {
  var loader = {};

  var model2Solufa = function( script_path, type, data, callback ) {

    function loaded( result ) {
      callback({ tag: "obj", children:
        result.map( function( data, idx ) {
          return { tag: "mesh", attrs: { key: idx, geo: data.geo, mtl: data.mtl }};
        })
      });
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
