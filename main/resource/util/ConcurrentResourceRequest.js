

/**
 * Enables the concurrent execution of multiple resource requests and the gathering of results into a single
 * result accessor. 
 */
var ConcurrentResourceRequestPrototype = {

    execute : function( callback, request ) {

	var self = this;

	console.log( 'ConcurrentResourceRequest.execute : Executing request' );

	var results = {};

	var queuedChainedRequests = Array();

	var completedRequests = 0;

	var processQueuedChainedRequests = function() {

	    var readyChainedRequestDefinitions = Array();

	    console.log( queuedChainedRequests );

	    queuedChainedRequests.forEach( function( curChainedRequestDefinition ) {

		var requestAccessor = curChainedRequestDefinition.uri.accessor;
		var requestPredicate = curChainedRequestDefinition.uri.predicate;

		console.log( 'ConcurrentResourceRequest.requestCallback : determining whether chained request ' + requestAccessor + ' is ready' );

		if ( results[ requestAccessor ] && results[ requestAccessor ].properties[ requestPredicate ] ) {

		    var trueUri = results[ requestAccessor ].properties[ requestPredicate ].val;

		    console.log( 'ConcurrentResourceRequest.requestCallback : Chained request ready to run ' + requestAccessor + ' : ' + requestPredicate + ' : ' + trueUri );

		    if ( trueUri ) {
			    
			readyChainedRequestDefinitions.push( {
			    uri : trueUri, 
			    requestDefinition : curChainedRequestDefinition 
			} );

		    }
			
		}

	    } );
	    

	    if ( readyChainedRequestDefinitions.length ) {
		
		readyChainedRequestDefinitions.forEach( function( curChainedRequestDefinition ) {

		    //Remove the chained request from the chained request queue
		    var requestDefinitionIndex = queuedChainedRequests.indexOf( curChainedRequestDefinition.requestDefinition );

		    if ( requestDefinitionIndex >= 0 ) {
			queuedChainedRequests.splice( requestDefinitionIndex, 1 );
		    }

		    //Execute the chained request
		    curChainedRequestDefinition.requestDefinition.requestor(
			curChainedRequestDefinition.uri, 
			request, 
			requestCallback.bind( curChainedRequestDefinition.requestDefinition ) );

		} );

	    }

	};

	/*
         * Intended to be called in the context of a request definition
	 */
	var requestCallback = function( resource ) {

	    console.log( 'ConcurrentResourceRequest.requestCallback : Completed request for ' + resource.uri + ' identified by ' + this.identifier );

	    results[ this.identifier ] = resource;
	    completedRequests += 1;

	    //If all the requests have completed then we are finished and can call the callback
	    if ( completedRequests === self.requestDefinitions.length ) {
		callback( results );
		return;
	    }

	    processQueuedChainedRequests();
	    
	};

	this.requestDefinitions.forEach( function( requestDefinition ) {

	    console.log( 'ConcurrentResourceRequest.execute : Executing concurrent request for uri ' + requestDefinition.uri + ' of type ' + ( typeof requestDefinition.uri ) );

	    if ( typeof requestDefinition.uri === 'object' ) {
		console.log( 'ConcurrentResourceRequest.execute : Adding request definition to the queue of chained request. Pending ' + requestDefinition.uri.accessor );
		queuedChainedRequests.push( requestDefinition );

		if ( results[ requestDefinition.uri.accessor ] ) {
		    processQueuedChainedRequests();
		}

		return;
	    }

	    if ( self.cache && self.cache[ requestDefinition.uri ] ) {
		requestCallback.call( requestDefinition, self.cache[ requestDefinition.uri ] );
		return;
	    }

	    requestDefinition.requestor( requestDefinition.uri, request, requestCallback.bind( requestDefinition ) );

	} );

    }

};

/**
 * Constructs a new ConcurrentResourceRequest from a list of request definitions.
 *
 * @param requestDefinitions A list of request definition objects.  A request definition is a simple object of the form
 *        <ul>
 *          <li>identifier: A string which will later be used to access the results of the request</li>
 *          <li>uri: The URI of the resource to request</li>
 *          <li>requestor: A ResourceRequestor object. ResourceRequestors are functions which take two properties, a 
 *                         URI and a callback function which will be passed the requested Resource upon completion of 
 *                         a request.</li>
 *        </ul>
 */
var concurrentResourceRequestFactory = function( requestDefinitions, cache ) {

    return Object.create( ConcurrentResourceRequestPrototype, { 
	requestDefinitions : {
	    value : requestDefinitions, 
	    writable : false
	}, 
	cache : {
	    value : cache, 
	    writable : false
	}
    } );

};

exports.make = concurrentResourceRequestFactory;
