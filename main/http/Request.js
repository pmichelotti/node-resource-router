/**
 * A Request Representation prototype and accompanying factory.  
 */

var RequestRepresentationPrototype = {


};

/**
 * Pull the extension from the request url.  The extension is defined to be the portion of the path following the last '.' character in the path which 
 * is not followed by a '/' character
 *
 * @param request The HTTP request
 * 
 * @return The extension of the request or null if one is not provided
 */
var getExtensionFromRequest = function( request ) {

    var periodPosition = request.url.lastIndexOf( '.' );

    if ( request.url.indexOf( '/', periodPosition ) === -1 ) {
	return request.url.substr( periodPosition + 1 );
    }

    return null;
};

//TODO: Implement
var getContentTypeFromRequest = function( request ) {
    return null;
};

/**
 * Extracts the HTTP Method from the request and returns it as a string
 *
 * @param request the HTTP request
 *
 * @return The request method
 */
var getMethodFromRequest = function( request ) {

    return request.method; 

};

/**
 * Creates a Request Representation object based on the provided HTTP
 * request.  
 * 
 * @param request The request object passed to the HTTP Server. It will
 *        follow the API specified in http://nodejs.org/api/http.html#http_http_incomingmessage
 * @param payload An object containing the request payload. A payload would include properties sent 
 *        via a GET or POST request as well as those sent in multi-part messages (ie, file uploads).
 * @param resource A resource representation object made up of the properties of a resource.
 *
 * @return A Request Representation which will take the following form: 
 *         <ul>
 *           <li>rawRequest</li>
 *           <li>resource</li>
 *           <li>extension</li>
 *           <li>contentType</li>
 *           <li>method</li>
 *           <li>payload</li>
 *         </ul>
 */
var requestRepresentationFactory = function( request, payload, resource ) {

    var extension = getExtensionFromRequest( request );
    var contentType = getContentTypeFromRequest( request );
    var method = getMethodFromRequest( request );

    return Object.create( RequestRepresentationPrototype, {
	rawRequest : {
	    value : request, 
	    writable : false
        }, 
	resource : {
	    value : resource, 
	    writable : false
        }, 
	extension : {
	    value : extension, 
	    writable : false
        }, 
	contentType : {
	    value : contentType, 
	    writable : false
        }, 
	method : { 
	    value : method, 
	    writable : false
        }, 
	payload : { 
	    value : payload, 
	    writable : false
        }
    } );
    
};

exports.make = requestRepresentationFactory;
