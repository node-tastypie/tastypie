
/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
 * Collection of helpers for dealing with query string params and filters for api resources
 * @module tastypie/lib/api/helpers/qs
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires mout/lang
 * @requires mout/string
 * @requires mout/array
 */

var qs         = require( 'qs' )
	, array      = require('mout/array')                 // standard lib array helpers
	, isFunction = require('mout/lang').isFunction       // standard lib isFunction check
	, toArray    = require('mout/lang').toArray          // standard lib function to cast values to arrays
	, typecast   = require('mout/string').typecast       // function to type cast strings
	, mset       = require('mout/object').set 
	, namespace  = require('mout/object').namespace
	, merge      = require('mout/object').merge
	, isPrimitive = require('mout/lang').isPrimitive
	, orderExp   = /^(\-)?([\w]+)/                       // expression to pick off sorting order
	, pathCache  = {}                                    // internal cache of processed model fields
	, buildFilters                                       // Funcion to generate a filter object for mongoose
	, allowablePaths                                     // function to check paths that are technically filterable
	, applySorting                                       // function to apply sorting to a mongoose mquery object
	, terms                                              // interal filter type mappings
	;



/**
 * @readonly
 * @name terms
 * @memberof module:tastypie/lib/helpers/qs
 * @property terms {Object} Defines querystring filter types
 * @property terms.gt Greater Than Filter type
 * @property terms.gte Greater Than or Equal To Filter Type
 * @property terms.in In Filter type for array value lookups
 * @property terms.lt Less Than filter Type
 * @property terms.lte Less Than or Equal To filter type
 * @property terms.ne Not Equal To filter type
 * @property terms.nin Non-In Filter type. The inverse of what `in` does
 * @property terms.regex literal regular expression lookup
 * @property terms.all Match agains all values in an array field
 * @property terms.size Array length filter type
 * @property terms.iexact Case in-sensitive filter type for exact string matches
 * @property terms.contains Contains filter type for string matching
 * @property terms.icontains case insensitive version of `Contains`
 * @property terms.startswith Starts with filter type for string matching
 * @property terms.istartswith Case insensitive version of `startswith`
 * @property terms.endswith Ends with filter type for string matching
 * @property terms.iendswith Case insensitive version of `endswith`
 */
terms = {
	'gt'            : { value: function( term ){ return {'$gt'       : term} } }
	, 'gte'         : { value: function( term ){ return {'$gte'      : term} } }
	, 'in'          : { value: function( term ){ return {'$in'       : term} } }
	, 'lt'          : { value: function( term ){ return {'$lt'       : term} } }
	, 'lte'         : { value: function( term ){ return {'$lte'      : term} } }
	, 'ne'          : { value: function( term ){ return {'$ne'       : term} } }
	, 'nin'         : { value: function( term ){ return {'$nin'      : term} } }
	, 'regex'       : { value: function( term ){ return {'$regex'    : term} } }
	, 'all'         : { value: function( term ){ return {'$all'      : term} } }
	, 'size'        : { value: function( term ){ return {'$size'     : term} } }
	, 'match'       : { value: function( term ){ return {'$elemMatch': term} } }
	, 'iexact'      : { value: function( term ){ return {'$regex'    : new RegExp( term, 'i' ) }  } }
	, 'contains'    : { value: function( term ){ return {'$regex'    : new RegExp( term )}  } }
	, 'icontains'   : { value: function( term ){ return {'$regex'    : new RegExp(term, 'i')}  } }
	, 'startswith'  : { value: function( term ){ return {'$regex'    : new RegExp( '^' + term ) }  } }
	, 'istartswith' : { value: function( term ){ return {'$regex'    : new RegExp( '^' + term, 'i' )}  } }
	, 'endswith'    : { value: function( term ){ return {'$regex'    : new RegExp( term + '$' ) }  } }
	, 'iendswith'   : { value: function( term ){ return {'$regex'    : new RegExp( term + '$', 'i') }  } }
}


function quickmap(array, mapFunction) {
	var arrayLen = array.length;
	var newArray = new Array(arrayLen);
	for(var i = 0; i < arrayLen; i++) {
		newArray[i] = mapFunction(array[i], i, array);
	}

	return newArray;
}

/**
 * creates a filter string suitable for endpoint consumtion maping filter names to internal keys
 * @param {Array} arr an array to join together
 * @param {String} separator The string value to use as a joining key
 * @return {String}
 */
function join( val, sep ){
	return quickmap( val, function( i ){
		return i.key ? i.key : i;
	}).join( sep )
}

/**
 * set "nested" object property
 * @param {Object} obj The object to set properties on
 * @param {String} property A string defining nested properties separated by `__`
 * @param {?Object} value The value to set on the property specified 
 * @return {Object}
 */
function set(obj, prop, val){
		var parts = (/^(.+)\_\_(.+)$/).exec(prop);
		if (parts){
				namespace(obj, parts[1])[parts[2]] = val;
		} else {
				obj[prop] = val;
		}

		return obj;
}


/**
 * Applies multi level sorting to a mongoose query object based on querystring parameters
 * @name applySorting
 * @function
 * @static
 * @memberof module:tastypie/lib/helpers/qs
 * @param {mquery} query An instance of an Mongoose Query
 * @param {Object|String} querystring A querystring suitable for parsing via the `qs` module or a parsed querystring object
 * @return {mquery}
 * @example
var query = Model.find({name:'Matt'})
helpers.qs.applySorting( query, "orderby=firstname&orderby=-lastname");
query.exec( console.log );
 */
applySorting = function( mquery, rquery ){
	var ordering = {};
	var qstring = qs.parse( rquery )
	toArray( qstring.orderby ).forEach( function( param ){
		var bits = orderExp.exec( param );
		if( !bits ){
			return;
		}
		ordering[ bits[2] ] = bits[1] ? -1 : 1;
	});

	mquery.sort( ordering );
	return mquery;
}

/**
 * Constructs databae filters based on a data model and query string
 * @static
 * @function
 * @name buildFilters
 * @memberof module:tastypie/lib/helpers/qs
 * @param {Object} model A valid Mongoose Model
 * @param {String|Object} query a valid query string parseable by the `qs` module or an object to use as the querystring object
 * @example
 var TestSchema = new Schema({
	firstname:{type:String}
	,lastname:{type:String}
 });
var Test = mongoose.model('Test', TestSchema)
helpers.qs.buildFilters( Test, {firstname:'Matt'})
helpers.qs.buildFilters( Test, {firstname__startswith:'Ma'})
helpers.qs.buildFilters(Test, 'firstname__istartswith=m&lastname__icontains=t')
 */
buildFilters = function( Model, obj, filters, fieldmap ){
	var remaining = {};
	var paths = Object.keys( Model.schema.paths );
	var query = qs.parse( obj );
	filters = filters || {};
	fieldmap = fieldmap || {}
	var allowablepaths = paths.filter( function( p ){
		return ( p !== '_id' && p !== '__v');
	});
 
 
	for( var key in query ){
		var bits = key.split('__')
			 , filter = {}
			 , bitlength
			 , value
			 , fieldname
			 , filtertype
			 , last

		value      = query[key];
		debugger;
		fieldname  = bits.shift();
		bitlength = bits.length - 1
		filtertype = terms[ bits[ bitlength ] ] ? terms[bits.pop()] : 'exact'

		last = filtertype
		console.log(fieldname, bits, last )
		// should be defined on resource instance
		var attr  = fieldmap[ fieldname ] ? fieldmap[fieldname].options.attribute || fieldname : fieldname
		fieldname = bits.unshift( attr ) && bits.join('.');
		if( allowablepaths.indexOf( attr ) >=0 ){
			remaining[attr] = remaining[attr] || {};
			filter = isFunction( last.value ) ? last.value( value ) : typecast( value ) ;
			remaining[ attr ] = isPrimitive( filter ) ? filter : merge( remaining[ attr ], filter );
		}
	}
	return remaining;
};

exports.terms        = terms
exports.buildFilters = buildFilters
exports.applySorting = applySorting
