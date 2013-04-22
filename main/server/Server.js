var http = require( 'http' );
var httpConstants = require( 'http/Constants' );
var url = require( 'url' );
var requestFactory = require( 'request/Request' );
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

    return http.createServer( requesthandler ).listen( port );

};

/**
 * A default transformer mapping request uri's to resource uri's.  The default implementation uses everything 
 * before the URI extension in building the resource URI.
 *
 * @param uriString The string of the original URI
 * 
 * @return The resource URI
 */
var defaultRequestUriToResourceUriTransformer = function( uriString ) {

    var requestUrl = url.parse( uriString );
    
    var resourcePath = removeExtensionFromRequestPath( requestUrl.pathname );

   if ( requestUrl.port ) {
       return requestUrl.protocol + '//' + requestUrl.host + ':' + requestUrl.port + resourcePath;
   }

   return requestUrl.protocol + '//' + requestUrl.host + resourcePath;

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
 * @param requestUriToResourceUriTransformer A function which takes the URI string from an HTTP request and returns a String
 *        representation of the requested resource URI
 * @param callback A function which will take the constructed Request Representation
 */
var constructRequestRepresentation = function( 
    request, 
    payload, 
    resourceRequestor, 
    requestRepresentationFactory, 
    requestUriToResourceUriTransformer, 
    callback ) {
    
    var resourceUri = requestUriToResourceUriTransformer( request.uri );

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
var retrievePayloadFromQueryString( request ) {

    var requestUrl = url.parse( request );

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
var retrievePayloadFromRequestBody( request, callback ) {

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
var retrievePayload( request, response, callback ) {

    switch( request.method ) {

	case httpConstants.GET_METHOD : 
	    callback( retrievePayloadFromQueryString( request ) );
	    break;
        case httpConstants.POST_METHOD : 
            retrievePayloadFromRequestBody( request, callback );
            break;
	case httpConstants.PUT_METHOD : 
	    retrievePayloadFromRequestBody( request, callback );
	    break;

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
	var requestUriToResourceUriTransformer = this.requestUriToResourceUriTransformer;

	var resourceRouter = this.resourceRouter;

	var handleRequestCallback = function( responseObject ) {

	    //if no status code was set or if the status code is not a known status code, a 500 is returned
	    if ( !responseObject.statusCode ) {

		response.writeHead( httpConstants.INTERNAL_SERVER_ERROR, { httpConstants.CONTENT_TYPE : httpConstants.TEXT_PLAIN } );
		response.end();
		return;

	    }

	    
	    response.writeHead( responseObject.statusCode, { httpConstants.CONTENT_TYPE : responseObject.contentType } );

	    if ( responseObject.hasPayload() ) {

		response.write( payload );

	    }

	    response.end();

	};

	var constructRequestRepresentationCallback = function( requestRepresentation ) {

	    resourceRouter.handleRequest( requestRepresentation, handleRequestCallback );

	};

	var retrievePayloadCallback = function( payload ) {

	    constructRequestRepresentation( 
		request, 
		payload, 
		resourceRequestor, 
		requestRepresentationFactory, 
		requestUriToResourceUriTransformer, 
		constructRequestRepresentationCallback 
	    );

	};

	retrievePayload( request, response, retrievePayloadCallback );

    }, 

    /**
     * Start the server using the configured or defaulted server starter mechanism. The handling function will be
     * a contextualized version of the Server.handleRequest method.
     */
    start : function() {

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
 *          <li>requestRepresentationFactory : <em>Optional</em> A factory which builds Request Representation objects based on HTTP requests 
 *                                             and resource representations. Such a factory is expected to take the following parameters : 
 *                                             request (the raw HTTP request), payload, resource (the Resource Representation built via the
 *                                             resourceRequestor).</li>
 *          <li>requestUriToResourceUriTransformer : <em>Optional</em> A function which will take a String version of the full URI requested
 *                                                   and will return a String version of the anticipated underlying resource URI. The default 
 *                                                   implementation strips the extension from the requested URI as that is used by the resource 
 *                                                   router to resolve the rendering agent but not the requested resource (that's a lot of 'r's).</li>
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
	requestRepresentationFactory : {
	    value : config.requestRepresentationFactory || defaultRequestRepresentationFactory, 
	    writable : false
        }, 
        requestUriToResourceUriTransformer : { 
	    value : config.requestUriToResourceUriTransformer || defaultRequestUriToResourceUriTransformer, 
	    writable : false
        }

    } );
};

exports.make = serverFactory;
