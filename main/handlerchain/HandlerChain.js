
var handlerChainItemFactory = function( handler ) {

    
};

/**
 * A HandlerChain is a handler function which takes a request representation and a callback and passes 
 * the request through a series of HandlerChainItems.  Each item has a chance to handle or augment the 
 * request as necessary, or perform any other functionality.  Each item is handed the request and a callback. 
 * Once an item has finished processing it proceeds to the next item in the chain by calling the callback, 
 */
var handlerChainFactory = function( items ) {

    return function( request, callback ) {

	var remainingHandlers = items.slice();

	var getNextHandler = function() {

	    return remainingHandlers.shift();

	};

	/*
	 * Callback which is passed to the individual handler items.  Handlers are expected to return 
	 * a response upon handling a request.  If a handler does return a response, the chain stops and 
	 * the original callback is passed the response.  If a handler item does not return a response, then 
	 * the chain continues by pulling the next of the remaining handlers and calling it. 
	 * If we run out of handlers we pass null to the original callback.
	 */
	var chainCallback = function( response ) {

	    if ( response ) {
		callback( response );
		return;
	    }

	    var nextHandler = getNextHandler();

	    if ( nextHandler ) {
		nextHandler( request, chainCallback );
	    }

	    else {
		callback( null );
	    }

	};

	getNextHandler()( request, chainCallback );
	return;

    };

};

exports.make = handlerChainFactory;