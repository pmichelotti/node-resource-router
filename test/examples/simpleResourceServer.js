
var httpConstants = require( '../../main/http/Constants' );
var serverFactory = require( '../../main/server/Server' );
var routerFactory = require( '../../main/router/Router' );
var responseFactory = require( '../../main/http/Response' );
var resourceHandlerMapFactory = require( '../../main/router/ResourceHandlerMap' );
var resourceFactory = require( '../../main/resource/Resource' );

var resourceHandlerMap = resourceHandlerMapFactory.make( [
    { 
	uri : "dummy-type", 
	method : "GET", 
	extension : "html", 
	handler : "simple-get-handler"
    }
] );

var handlerDefinitions = {
    "simple-get-handler" : function( request, callback ) {
	console.log( 'Simple GET Handler called' );

	var response = responseFactory.make( 
	    httpConstants.OK, 
	    httpConstants.TEXT_PLAIN, 
	    "You requested " + request.resource.uri
        );

	console.log( 'Returning response object from handler' );
	console.log( response.statusCode + ' :: ' + response.contentType + ' :: ' + response.payload );

	callback( response );
    }
};

var dummyResourceRequestor = function( resourceUri, callback ) {

    console.log( 'Dummy Resource Requestor called for URI ' + resourceUri );
    callback( resourceFactory.make( resourceUri, { "rdf:type" : "dummy-type" } ) );

};

var router = routerFactory.make( resourceHandlerMap, handlerDefinitions );

var server = serverFactory.make( {
    resourceRequestor : dummyResourceRequestor, 
    resourceRouter : router
} );

server.start();

