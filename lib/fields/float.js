/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * Resource Field for dealing with integervalues
 * @module tastypie/fields/float
 * @author Eric Satterwhite
 * @since 0.5.0
 * @requires tastypie/lib/class
 * @requires tastypie/lib/fields/api
 */

var Class          = require( '../class' )
  , ApiField       = require('./api')
  , FloatField
  ;

/**
 * @constructor
 * @alias module:tastypie/fields/float
 * @extends module:tastypie/fields/api
 */
exports.FloatField = FloatField = new Class({
	inherits: ApiField
	,options:{
	   help:'Converts string values to floating point numbers'

	}
	,convert: function convert( value ){
		return parseFloat( value );
	}
	,type: function type( ){
		return 'float';
	}

});

module.exports = FloatField;