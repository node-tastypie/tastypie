/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * Resource Field for dealing with strings
 * @module tastypie/fields/char
 * @author Eric Satterwhite
 * @since 0.5.0
 * @requires tastypie/lib/class
 * @requires tastypie/lib/class/options
 * @requires tastypie/lib/fields/api
 */

var Class          = require( '../class' )
  , ApiField       = require('./api')
  , CharField
  ;

/**
 * Field class for dealing with string data
 * @constructor
 * @alias module:tastypie/fields/char
 * @extends module:tastypie/fields/api
 */
exports.CharField = CharField = new Class({
	inherits: ApiField
	, options:{
		help:'Forces values to string values by calling toString'
	}
	,convert: function( value ){
		return value === null ? value : value ? '' + value :'';
	}
});

module.exports = CharField;