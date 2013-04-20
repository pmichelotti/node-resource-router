var http = require( 'http' );

/**
 * The port the server will listen to if another is not provided via server configuration
 */
var defaultPort = 8888;

/**
 * A default server starter function to be used if another is not specified via server configuration. 
 * The default uses the Node HTTP API's createServer method to start up a simple HTTP server at a specified 
 * port and to provide a callback function for new requests.
 *
 * 
var defaultServerStarter = function( requestHandler, port ) {

    http.createServer( requesthandler ).listen( port );

};

