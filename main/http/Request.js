/**
 * A Request Representation prototype and accompanying factory.  
 */

var RequestRepresentationPrototype = {


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
