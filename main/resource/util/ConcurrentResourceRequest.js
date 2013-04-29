

/**
 * Enables the concurrent execution of multiple resource requests and the gathering of results into a single
 * result accessor. 
 */
var ConcurrentResourceRequestPrototype = {

    execute : function( callback ) {

	var self = this;

	var results = {};

	var completedRequests = 0;

	this.requestDefinitions.forEach( function( requestDefinition ) {

	    var requestCallback = function( resource ) {
		results[ requestDefinition.identifier ] = resource;
		completedRequests = completedRequests + 1;

		if ( completedRequests === self.requestDefinitions.length ) {
		    callback( results );
		}
	    };

	    requestDefinition.requestor( requestDefinition.uri, requestCallback );

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
var concurrentResourceRequestFactory = function( requestDefinitions ) {

    return Object.create( ConcurrentResourceRequestPrototype, { 
	requestDefinitions : {
	    value : requestDefinitions, 
	    writable : false
	}
    } );

};

exports.make = concurrentResourceRequestFactory;
