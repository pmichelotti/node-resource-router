var rdfConstants = require( '../rdf/Constants' );

/**
 * An abstract representation of a resource made up of the resource's URI, a type, and a set of properties
 */
var ResourcePrototype = { 

};

var PropertyPrototype = {

    toString : function() { 
	return this.val;
    }

};

/**
 * Creates a Resource representation
 *
 * @param uri the URI of the resource
 * @param properties Simple object including those properties which are direct properties of the resource.  A property
 *        is a simple object containing a value and a type property where value is the nominal value of the property and 
 *        type is one of the values defined by http://www.w3.org/TR/rdf-interfaces/#widl-RDFNode-interfaceName
 * @param requestor (Optional) The ResourceRequestor used to request the resource
 *
 * @return The constructed representation
 */
var resourceFactory = function( uri, properties, requestor ) {

    var rdfType = null;

    if ( properties[ rdfConstants.RDF_TYPE ] ) {
	rdfType = properties[ rdfConstants.RDF_TYPE ].val;
    }

    var constructedProperties = {};

    for( var curPredicate in properties ) {
	constructedProperties[ curPredicate ] = Object.create( PropertyPrototype, {
	    type : {
		value : properties[ curPredicate ].type, 
		writable : false
	    }, 
	    val : {
		value : properties[ curPredicate ].val, 
		writable : false
	    }
	} );
    }

    return Object.create( ResourcePrototype, {
	uri : { 
	    value : uri,
	    writable : false
	}, 
	type : { 
	    value : rdfType,
	    writable : false
	}, 
	properties : { 
	    value : constructedProperties, 
	    writable : false
	}, 
	requestor : {
	    value : requestor, 
	    writable : false
	}
    } );

};

exports.make = resourceFactory;
