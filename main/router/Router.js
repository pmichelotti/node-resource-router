var Response = require( '../http/Response' );
var HTTP = require( '../http/Constants' );

/**
 * The Router handles the routing of requests to handlers which ultimately respond to the request. 
 *
 * Using an internal request to handler mapping the Router looks up an appropriate handler for a given
 * request based on the properties of the request and delegates the request to said handler for further
 * processing and response.  
 *
 * If no handler is found for a particular request, a 404 response is returned.
 */
var RouterPrototype = {

    /**
     * Handles the request by looking up an appropriate handler for the provided Request object and calling said handler, passing 
     * it the callback provided.
     *
     * @param request A Request Representation object representing the request to be handled
     * @param callback A function to call upon handling of the request.  This function will be given a single Response object
     *        parameter when called either by the router (in the case of an immediate 404) or by one of the handlers
     */
    handleRequest : function( request, callback ) {

	console.log( 'Starting request handling' );

	var handlerUri = this.resourceHandlerMap.getHandlerForRequest( request );
	console.log( 'Handler URI determined to be ' + handlerUri );

	if ( handlerUri ) {
	    var handler = this.handlers[ handlerUri ];

	    if ( typeof handler === 'function' ) {

		handler( request, callback );

	    }
	}

	//if we reach this point it means that either a handler was not found or it was ill-defined.  Either way we return a 404
	callback( Response.make( HTTP.NOT_FOUND, HTTP.TEXT_PLAIN ) );

    }

};

/**
 * Constructs a new Router containing the provided resource handler map and handler definitions. 
 *
 * @param resourceHandlerMap an instance of ResourceHandlerMap
 * @param handlerDefinitions a simple object mapping identifiers to concrete Handlers
 *
 * @return The constructed Router object
 */
var routerFactory = function( resourceHandlerMap, handlerDefinitions ) {

    return Object.create( RouterPrototype, {
	resourceHandlerMap : {
	    value : resourceHandlerMap, 
	    writable : false
	}, 
	handlers : {
	    value : handlerDefinitions, 
	    writable : false
	}
    } );

};

exports.make = routerFactory;
