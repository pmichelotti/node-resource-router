/**
 * Response is an object representation of an HTTP response suitable for later propagation to the requesting client.
 * Three properties are contained in a response
 * 
 * <ul>
 *   <li>statusCode : The HTTP status code.  If this is missing it must be assumed that the request has failed due to internal error</li>
 *   <li>contentType : Content type of the response payload</li>
 *   <li>payload : String version of the payload of the response</li>
 * </ul>
 */

var ResponsePrototype = {

    hasPayload : function() {
	return this.payload;
    }

};

var responseFactory = function( statusCode, contentType, payload, headers ) {

    return Object.create( ResponsePrototype, {
	statusCode : {
	    value : statusCode, 
	    writable : false
	}, 
	contentType : { 
	    value : contentType, 
	    writable : false
	}, 
	payload : { 
	    value : payload, 
	    writable : false
	}, 
	headers : {
	    value : headers, 
	    writable : false
	}
    } );

};

exports.make = responseFactory;
