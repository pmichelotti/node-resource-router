var fs = require( 'fs' );
var path = require( 'path' );
var url = require( 'url' );
var httpConstants = require( '../http/Constants' );
var responseFactory = require( '../http/Response' );

/**
 * Checks whether the file specified by the relative requestPath parameter exists under the 
 * pathPrefixToCheck path.  If it does then the full file name, prefix + path, is passed to the 
 * callback method.  If it does not, the lookupFileInPath function is called again, passing the next 
 * item in the path list and a new path list minus the first item.
 *
 * @param pathPrefixToCheck The path prefix to look in for the requested file
 * @param pathPrefixesToCheckNext The list of path prefixes to check next if the requested file can not
 *        be found in the current prefix
 * @param requestPath The path of the file requested
 * @param callback A function which should accept a single String parameter.  This function will be passed the full path
 *        of the requested file if one is found under one of the path prefixes, or null if one is not found
 */
var lookupFileInPath = function( pathPrefixToCheck, pathPrefixesToCheckNext, requestPath, callback ) {

    if ( pathPrefixToCheck ) {

	var fullPath = pathPrefixToCheck + requestPath;

	console.log( 'FileRouter checking path ' + fullPath + ' for file existance' );

	fs.exists( fullPath, function( fileExists ) {

	    if ( fileExists ) {
		callback( fullPath );
		return;
	    }
	   
	    if ( pathPrefixesToCheckNext.length > 0 ) {
		//carry on looking through the path list
		lookupFileInPath( pathPrefixesToCheckNext[ 0 ], pathPrefixesToCheckNext.slice( 1 ), requestPath, callback );
		return;
	    }

	    //we've reached the end of the list and we haven't found a file
	    callback( null );
	   
	} );

    }

    else {
	
	callback( null );

    }

};

var getExtensionFromRequestUrl = function( requestUrl ) {

    console.log( 'FileRouter looking up extension for path ' + requestUrl.path );

    var periodPosition = requestUrl.path.lastIndexOf( '.' );

    console.log( 'FileRouter periodPosition : ' + periodPosition );

    if ( periodPosition && requestUrl.path.indexOf( '/', periodPosition ) === -1 ) {
	return requestUrl.path.substr( periodPosition + 1 );
    }

    return null;

};

var lookupContentTypeForRequest = function( request, requestUrl, contentTypeMapping ) {

    //get the extension of the request path
    var extension = getExtensionFromRequestUrl( requestUrl );

    console.log( 'FileRouter Looking up content type for extension ' + extension );

    //lookup this extension in the mapping
    return contentTypeMapping[ extension ];

};

var FileRouterPrototype = { 

    /**
     * Handles an HTTP request by looking up the requested path in the server's file system and returning the static asset located 
     * at said path of one exists and is accessible.
     *
     * @param request A Request Representation object representing the request to be handled
     * @param callback A callback method which will take as a parameter a response object generated by the handling of the request
     */
    handleRequest : function( request, callback ) {

	console.log( 'FileRouter attempting to handle request' );

	var requestUrl = url.parse( request.rawRequest.url );
	var contentType = lookupContentTypeForRequest( request, requestUrl, this.extensionToContentTypeMap );
	
	if ( contentType && this.paths && this.paths.length && request.method === httpConstants.GET_METHOD ) {

	    lookupFileInPath( this.paths[ 0 ], this.paths.slice( 1 ), requestUrl.path, function( filePath ) {

		if ( filePath ) {

		    fs.readFile( filePath, function( error, content ) {

			if ( error ) {
			    var errorResponse = responseFactory.make( httpConstants.INTERNAL_SERVER_ERROR, contentType );
			    callback( errorResponse );
			}
			else {
			    var successResponse = responseFactory.make( httpConstants.OK, contentType, content );
			    callback( successResponse );
			}

		    } );
		}
		else {
		    //file could not be found so pass null to the callback
		    callback( null );
		}

	    } );

	}
	else {
	    //Request or paths config was not valid 
	    callback( null );
	}

    }

};

var defaultExtensionToContentTypeMap = {
    "ico" : "image/x-icon"
};

var fileRouterFactory = function( paths, extensionToContentTypeMap ) {

    return Object.create( FileRouterPrototype, {
	paths : { 
	    value : paths, 
	    writable : false
	}, 
	extensionToContentTypeMap : { 
	    value : extensionToContentTypeMap || defaultExtensionToContentTypeMap, 
	    writable : false
	}
    } );

};

exports.make = fileRouterFactory;

