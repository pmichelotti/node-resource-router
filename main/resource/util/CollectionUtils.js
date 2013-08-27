
var rdfConstants = require( '../../rdf/Constants' );

/**
 * Given a ResourceRepresentation, return an ordered array of URIs representing the 
 * collection member predicates represented in the resource.  These are ordered by 
 * URI to represent proper sequencing.
 */
var getOrderedSeqPredicates = function( resource ) {

    var seqPredicates = Array();

    for( var curPredicate in resource.properties ) {

	if ( curPredicate.indexOf( rdfConstants.RDF + '_' ) === 0 ) {
	    seqPredicates.push( curPredicate );
	}

    }

    return seqPredicates.sort();

};

/**
 * Traverse the membership predicates in the Collection looking for one whose 
 * object is the uri provided
 */
var getMembershipPredicate = function( resource, uri ) {

    for( var curPredicate in resource.properties ) {

	if ( curPredicate.indexOf( rdfConstants.RDF + '_' ) === 0 ) {
	    if ( resource.properties[ curPredicate ].val === uri ) {
		return curPredicate;
	    }
	}

    }

    return null;

};

var getNextObjectInSequence = function( resource, objectUri ) {

    var membershipPredicate = getMembershipPredicate( resource, objectUri );

    if ( membershipPredicate ) {

	var orderedPredicates = getOrderedSeqPredicates( resource );

	var memberIndex = orderedPredicates.indexOf( membershipPredicate );

	if ( memberIndex >= 0 && memberIndex < ( orderedPredicates.length - 1 ) ) {
	    return( resource.properties[ orderedPredicates[ memberIndex + 1 ] ] );
	}

    }

    return null;

};

var getPreviousObjectInSequence = function( resource, objectUri ) {

    var membershipPredicate = getMembershipPredicate( resource, objectUri );

    if ( membershipPredicate ) {

	var orderedPredicates = getOrderedSeqPredicates( resource );

	var memberIndex = orderedPredicates.indexOf( membershipPredicate );

	if ( memberIndex > 0 ) {
	    return( resource.properties[ orderedPredicates[ memberIndex - 1 ] ] );
	}

    }

    return null;

};

exports.getOrderedSeqPredicates = getOrderedSeqPredicates;
exports.getNextObjectInSequence = getNextObjectInSequence;
exports.getPreviousObjectInSequence = getPreviousObjectInSequence;
exports.getMembershipPredicate = getMembershipPredicate;
