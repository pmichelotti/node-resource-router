var http = require( 'http' );
var httpConstants = require( '../http/Constants' );
var url = require( 'url' );
var requestFactory = require( '../http/Request' );
var responseFactory = require( '../http/Response' );
var querystring = require( 'querystring' );

/**
 * The port the server will listen to if another is not provided via server configuration
 */
var defaultPort = 8888;

/**
 * A default server starter function to be used if another is not specified via server configuration. 
 * The default uses the Node HTTP API's createServer method to start up a simple HTTP server at a specified 
 * port and to provide a callback function for new requests.
 *
 * Any function which is intended to override this default via server configuration should follow the same API.
 *
 * @param requestHandler A function intended to handle incoming HTTP requests 
 * @param port The port number at which the server will be listening
 *
 * @return The constructed Server object
 */ 
var defaultServerStarter = function( requestHandler, port ) {

    console.log( 'Starting server using default HTTP module' );
    var createdServer = http.createServer( requestHandler ).listen( port );
    console.log( 'Server started at Port ' + port );
    return createdServer;

};

/**
 * A default transformer mapping request uri's to resource uri's.  The default implementation uses everything 
 * before the URI extension in building the resource URI.
 *
 * @param uriString The string of the original URI
 * 
 * @return The resource URI
 */
var defaultRequestToResourceUriTransformer = function( request ) {

    var requestUrl = url.parse( request.url );
    
    var resourcePath = removeExtensionFromRequestPath( requestUrl.pathname );
    console.log( 'Resource Path : ' + resourcePath );
    
    var requestProtocol = requestUrl.protocol || request.protocol || 'http:';
    var requestHost = requestUrl.host || request.headers[ 'host' ];
    
    var requestPort = requestUrl.port;

    //TODO: This is a mess and should be cleaned
    if ( requestHost && requestHost.indexOf( ':' ) !== -1 ) {
	if ( !requestPort ) {
	    requestPort = requestHost.split( ':' )[ 1 ];
        }
	requestHost = requestHost.split( ':' )[ 0 ];
    }

    if ( requestPort ) {
        return requestProtocol + '//' + requestHost + ':' + requestPort + resourcePath;
    }

    return requestProtocol + '//' + requestHost + resourcePath;

};

/**
 * A wrapper for the default Request Factory
 * 
 * @param request
 * @param payload
 * @param resource
 *
 * @return Request Representation
 */
var defaultRequestRepresentationFactory = function( request, payload, resource ) {

    return requestFactory.make( request, payload, resource );
    
};

/**
 * Removes the extension from a requested path. The extension is defined as the portion of the path spanning from the first '.' character
 * found after the last '/' character and the end of the path
 *
 * @param path The original request path
 * 
 * @return The path with the extension removed
 */
var removeExtensionFromRequestPath = function( path ) {

    var lastPeriod = path.lastIndexOf( '.' );

    if ( lastPeriod && path.indexOf( '/', lastPeriod ) === -1 ) {

	return path.substr( 0, lastPeriod );

    }

    return path;

};

/**
 * Uses the provided Request Representation Factory to build a Request object
 *
 * @param request The HTTP request
 * @param payload An object representation of the request payload
 * @param resourceRequestor A function which takes a URI and a callback function taking a single parameter.  It is expected
 *        that this function will implement the mechanisms necessary to lookup a Resource based on a provided URI and will 
 *        pass that resource to the callback function.
 * @param requestRepresentationFactory A factory responsible for creating Request Representations following the API of
 *        a Request Representation Factory which is HTTP Request, Payload, Resource
 * @param requestToResourceUriTransformer A function which takes an HTTP request and returns a String
 *        representation of the requested resource URI
 * @param callback A function which will take the constructed Request Representation
 */
var constructRequestRepresentation = function( 
    request, 
    payload, 
    resourceRequestor, 
    requestRepresentationFactory, 
    requestToResourceUriTransformer, 
    callback ) {
    
    var resourceUri = requestToResourceUriTransformer( request );

    console.log( 'Resource URI determined to be ' + resourceUri );

    resourceRequestor( resourceUri, function( resource ) {

	var requestRepresentation = requestRepresentationFactory( request, payload, resource );
	callback( requestRepresentation );

    } );

};

/**
 * Retrieves the Payload from the encoded query string parsed into a Simple Object
 *
 * @param request The HTTP request
 * 
 * @return The parsed query string
 */
var retrievePayloadFromQueryString = function( request ) {

    var requestUrl = url.parse( request.url );

    if ( typeof requestUrl.query === 'String' ) {
	return querystring.parse( requestUrl.query );
    }
    if ( typeof requestUrl.query === 'Object' ) {
	return requestUrl.query;
    }

    return null;

};

/**
 * Retrieve the payload from the request body. The request body is parsed based on 
 * the content type.  
 *
 * @param request the HTTP request to pull the request body from
 * @param callback The callback to which the payload will be passed
 */
var retrievePayloadFromRequestBody = function( request, callback ) {

    var requestBody = '';

    request.on( 'data', function( chunk ) {

	requestBody += chunk.toString();

    } );

    request.on( 'end', function() {

	var contentTypeHeader = request.headers[ httpConstants.CONTENT_TYPE ] || request.headers[ httpConstants.CONTENT_TYPE.toLowerCase() ];
	var contentType = contentTypeHeader.split( ';' )[ 0 ];

	switch ( contentType ) {

	    case httpConstants.APPLICATION_JSON: 
	        callback( JSON.parse( requestBody ) );
	        break;
	    case httpConstants.APPLICATION_X_WWW_FORM_URLENCODE:
	        callback( querystring.parse( requestBody ) );
	        break;

	    default: 
	        callback( requestBody );
	        break;

        }

    } );

};

/**
 * Bundles the payload of a request into an Object representing the nvp's contained in the payload. 
 * The payload of a request may come from the query string associated with the request in the case of 
 * a GET or DELETE request or from the request body in the case of a PUT or POST request.
 *
 * @param request The HTTP request object produced by the server
 * @param response The HTTP response object produced by the server
 * @param callback A function which will take as input the payload object
 */
var retrievePayload = function( request, response, callback ) {

    console.log( 'Finding payload retriever for ' + request.method );
    
    console.log( 'Constant GET Method : ' + httpConstants.GET_METHOD + ' :: ' + ( httpConstants.GET_METHOD === request.method ) );

    switch( request.method ) {

	case httpConstants.GET_METHOD : 
	    console.log( 'Retrieving payload for GET request' );
	    callback( retrievePayloadFromQueryString( request ) );
	    break;
        case httpConstants.POST_METHOD : 
            console.log( 'Retrieving payload for POST request' );
            retrievePayloadFromRequestBody( request, callback );
            break;
	case httpConstants.PUT_METHOD :
            console.log( 'Retrieveing payload for PUT request' ); 
	    retrievePayloadFromRequestBody( request, callback );
	    break;

    }
};

var routeRequestThroughRouterChain = function( requestRepresentation, routerChain, callback ) {

    if ( routerChain.length ) {
	routeRequestThroughCurrentRouterInChain( requestRepresentation, routerChain[ 0 ], routerChain.slice( 1 ), callback );
    }
    else {
	callback( null );
    }

};

var routeRequestThroughCurrentRouterInChain = function( requestRepresentation, curRouter, remainingRouters, callback ) {

    if ( curRouter ) {
	curRouter.handleRequest( requestRepresentation, function( response ) {

	    if ( response ) {
		callback( response );
	    }
	    else {
		if ( remainingRouters && remainingRouters.length ) {
		    routeRequestThroughCurrentRouterInChain( requestRepresentation, remainingRouters[ 0 ], remainingRouters.slice( 1 ), callback );
		}
		else {
		    callback( null );
		}
	    }

	} );
    }
    else {
	callback( null );
    }

};

/**
 * Prototype of a Server instance
 */
var ServerPrototype = {

    /**
     * Handler of an HTTP request taking a request and response object as documented 
     * http://nodejs.org/api/http.html#http_event_request. 
     *
     * Request processing involves the following steps
     * <ol>
     *   <li>Retrieving the Payload and building a simple object from any payload items</li>
     *   <li>Constructing a Request Representation given the HTTP request and Payload</li>
     *   <li>Handing the Request Representation to the Resource Router</li>
     *   <li>Writing any response from the Resource Router to the HTTP response</li>
     * </ol>
     */
    handleRequest : function( request, response ) {

	var resourceRequestor = this.resourceRequestor;
	var requestRepresentationFactory = this.requestRepresentationFactory;
	var requestToResourceUriTransformer = this.requestToResourceUriTransformer;

	var routerChain = this.routerChain;

	var handleRequestCallback = function( responseObject ) {

	    console.log( 'Handler completed processing, writing response object to client response' );

	    //if the responseObject is null - then write a 404
	    if ( !responseObject ) {
		responseObject = responseFactory.make( httpConstants.NOT_FOUND, httpConstants.TEXT_PLAIN );
	    }

	    //if no status code was set or if the status code is not a known status code, a 500 is returned
	    if ( !responseObject.statusCode ) {

		response.writeHead( httpConstants.INTERNAL_SERVER_ERROR, { "Content-Type" : httpConstants.TEXT_PLAIN } );
		response.end();
		return;

	    }

	    
	    response.writeHead( responseObject.statusCode, { "Content-Type" : responseObject.contentType } );

	    if ( responseObject.hasPayload() ) {

		response.write( responseObject.payload );

	    }

	    response.end();

	};

	var constructRequestRepresentationCallback = function( requestRepresentation ) {

	    console.log( 'Providing request representation for resource of type ' + requestRepresentation.resource.type + ' to the Handler' );
	    routeRequestThroughRouterChain( requestRepresentation, routerChain, handleRequestCallback );

	};

	var retrievePayloadCallback = function( payload ) {

	    console.log( 'Constructing request representation' );
	    constructRequestRepresentation( 
		request, 
		payload, 
		resourceRequestor, 
		requestRepresentationFactory, 
		requestToResourceUriTransformer, 
		constructRequestRepresentationCallback 
	    );

	};

	console.log( 'Retrieving request payload' );
	retrievePayload( request, response, retrievePayloadCallback );

    }, 

    /**
     * Start the server using the configured or defaulted server starter mechanism. The handling function will be
     * a contextualized version of the Server.handleRequest method.
     */
    start : function() {

	console.log( 'Starting server at port ' + this.port );
	this.server = this.serverStarter( this.handleRequest.bind( this ), this.port );

    }, 

    /**
     * Stops the HTTP server from accepting additional requests presuming the server has already been started
     * 
     * @param callback A callback function to be called upon completion of closing the server
     */
    stop : function( callback ) {

	if ( this.server ) {

	    this.server.close( callback );

	}

    }

};

/**
 * A factory for creating Server objects suitable for handling HTTP requests using a Resource Router.
 *
 * @param config
 *
 *        The following are the available elements of configuration
 *        <ul>
 *          <li>serverStarter : <em>Optional</em> A function which will expect as parameters a request handling function and a port number.</li>
 *          <li>port : <em>Optional</em> The port Number which the server will listen on.  Defaults to 8888.</li>
 *          <li>resourceRequestor : <em>Required</em> A function which will take a URI, create a Resource representation, and provide the 
 *                                  representation to a callback function.</li>
 *          <li>routerChain : <em>Required</em> A List of Router implementations. Requests will go through each router in the list until one 
 *                            is able to handle the request.  A handled request is signified by the router passing a non-null response to the 
 *                            request handler's callback.  A Router implementation is an object which has at least a handleRequest function</li>
 *          <li>requestRepresentationFactory : <em>Optional</em> A factory which builds Request Representation objects based on HTTP requests 
 *                                             and resource representations. Such a factory is expected to take the following parameters : 
 *                                             request (the raw HTTP request), payload, resource (the Resource Representation built via the
 *                                             resourceRequestor).</li>
 *          <li>requestToResourceUriTransformer : <em>Optional</em> A function which will take an HTTP request and transforms the request into 
 *                                                the URI String of the requested underlying Resource.</li>
 *        </ul>
 */
var serverFactory = function( config ) {

    return Object.create( ServerPrototype, {

	serverStarter : { 
	    value : config.serverStarter || defaultServerStarter, 
	    writable : false
        }, 
	port : {
	    value : config.port || defaultPort, 
	    writable : false
        }, 
	resourceRequestor : {
	    value : config.resourceRequestor, 
	    writable : false
        }, 
	routerChain : {
	    value : config.routerChain || [], 
	    writable : false
	},
	requestRepresentationFactory : {
	    value : config.requestRepresentationFactory || defaultRequestRepresentationFactory, 
	    writable : false
        }, 
        requestToResourceUriTransformer : { 
	    value : config.requestToResourceUriTransformer || defaultRequestToResourceUriTransformer, 
	    writable : false
        }

    } );
};

exports.make = serverFactory;
