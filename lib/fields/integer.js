/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * Resource Field for dealing with integervalues
 * @module tastypie/fields/integer
 * @author Eric Satterwhite
 * @since 0.5.0
 * @requires tastypie/lib/class
 * @requires tastypie/lib/fields/api
 */

var Class          = require( '../class' )
  , ApiField       = require('./api')
  , IntegerField
  ;

/**
 * @constructor
 * @alias module:tastypie/fields/integer
 * @extends module:tastypie/fields/api
 */
exports.IntegerField = IntegerField = new Class({
	inherits: ApiField
	,options:{
	   help:'Converts values to Numbers with a base of 10'
	}
	,convert: function convert( value ){
                return parseInt(value, 10);
	}
	,type: function( ){
		return 'integer';
	}
});

module.exports = IntegerField;
