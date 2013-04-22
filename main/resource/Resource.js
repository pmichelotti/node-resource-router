/**
 * An abstract representation of a resource made up of the resource's URI, a type, and a set of properties
 */
var ResourcePrototype = { 

};

var RDF_TYPE_URI = "rdf:type";

/**
 * Creates a Resource representation
 *
 * @param uri the URI of the resource
 * @param properties Simple object including those properties which are direct properties of the resource
 *
 * @return The constructed representation
 */
var resourceFactory = function( uri, properties ) {

    var rdfType = properties[ RDF_TYPE_URI ];

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
	    value : properties, 
	    writable : false
	}
    } );

};

exports.make = resourceFactory;
