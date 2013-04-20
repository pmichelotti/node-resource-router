/**
 * Response is an object representation of an HTTP response suitable for later propagation to the requesting client
 */

var ResponsePrototype = {

    hasPayload : function() {
	return this.payload;
    }

};

var responseFactory = function( statusCode, contentType, payload ) {

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
	}
    } );

};

exports.make = responseFactory;