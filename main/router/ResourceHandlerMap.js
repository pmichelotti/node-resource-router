/**
 * The ResourceHandlerMap provides a multi tier mapping from URI based requests to handler identifiers.
 *
 * This mapping proceeds through the following levels:
 *
 * <ol>
 *   <li>URI : Either the URI of a requestable resoure or the URI of the resource's type</li>
 *   <li>Method : Any one of the standard HTTP methods</li>
 *   <li>Extension : The Extension tied to the request such as 'html' or 'json'</li>
 * </ol>
 */
var ResourceHandlerMapPrototype = {

    /**
     * Looks up a handler identifier for the request representation
     */
    getHandlerForRequest : function( request ) {

	console.log( 'ResourceHandlerMap Looking up handler for uri ' + request.resource.uri );

	var uriMapping = this.map[ request.resource.uri ] || this.map[ request.resource.type ];

	if ( uriMapping ) {
	    
	    console.log( 'ResourceHandlerMap Found mapping for uri. Checking mapping for ' + request.method );

	    var methodMapping = uriMapping[ request.method ] || uriMapping[ '*' ];

	    if ( methodMapping ) {
		
		console.log( 'ResourceHandlerMap Found mapping for method. Checking mapping for extension ' + request.extension );

		var extensionMapping = methodMapping[ request.extension ] || methodMapping[ '*' ];

		if ( extensionMapping ) {

		    return extensionMapping;

		}

	    }

	}

	return null;

    }

};

/**
 * Construct a new instance of a ResourceHandlerMap
 *
 * @param mapContents A list of resource handler map entries.  The format of the entries is expected to be :
 *        <ul> 
 *          <li>uri</li>
 *          <li>method : may be universally wildcarded by providing '*' as the value</li>
 *          <li>extension : may be universally wildcarded by providing '*' as the value</li>
 *          <li>handler</li>
 *        </ul>
 * @return A new instance of ResourceHandlerMap
 */
var resourceHandlerMapFactory = function( mapContents ) {

    var internalMapping = {};

    mapContents.forEach( function( entry ) {

	//init the object for the URI
	if ( !internalMapping[ entry.uri ] ) {
	    internalMapping[ entry.uri ] = {};
	}
	var uriMapping = internalMapping[ entry.uri ];

	//init the object for the URI's Method
	if ( !uriMapping[ entry.method ] ) {
	    uriMapping[ entry.method ] = {};
	}
	var methodMapping = uriMapping[ entry.method ];

	//store the handler for the extension
	methodMapping[ entry.extension ] = entry.handler;

    } );

    return Object.create( ResourceHandlerMapPrototype, { 
	map : { 
	    value : internalMapping, 
	    writable : false
	}
    } );

};



exports.make = resourceHandlerMapFactory;