/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * Resource Field for dealing with array values
 * @module tastypie/fields/array
 * @author Eric Satterwhite
 * @since 0.5.0
 * @requires mout/lang/kindOf
 * @requires tastypie/lib/class
 * @requires tastypie/lib/fields/api
 */

var kindOf         = require( 'mout/lang/kindOf'  )
  , co             = require('co')
  , Class          = require( '../class' )
  , ApiField       = require('./api')
  , ArrayField
  ;

/**
 * @constructor
 * @alias module:tastypie/fields/array
 * @extends module:tastypie/fields/api
 */
ArrayField = new Class({
	inherits: ApiField
	,options:{
		separator: ','
	  , help:'converts comma separated string into an array of value'

	}

	,type: function(){
		return 'array';
	}

	/**
	 * converts a string value into array by splitting on the separator option
	 * @method module:tastypie/lib/fields/array#convert
	 * @param {Array|String} value the array string to coerce to an array
	 * @returns {Array} 
	 **/
	,convert: function( value ){
		var _val = [];
		switch( kindOf( value ).toLowerCase() ){
			case 'string':
				_val = value.split( this.options.separator );
				break;
			case 'array':
				_val = value;
				break;
			default:
				_val = value ? [ value ] : _val;
				break;
		}

		return _val;
	}

	/**
	 * converts a serialized array value into an array instance
	 * @method module:tastypie/lib/fields/array#hydrate
	 * @param {module:tastypie/lib/resource~Bundle} bundle a bunde representing data to be hydrated and converted
	 * @returns {Promise<Mixed[]>} A promise that resolves to the value from the incoming data matching the name or attribute of the field
	 **/
	,hydrate: co.wrap(function* hydrate( bundle ){
		let value = yield this.parent('hydrate', bundle)

		try{
			value = this.convert( kindOf(value) === 'String' ? JSON.parse( value ) : value );
		} catch( err ){
			value = this.convert( value );
		}

		return value;
	})
});

module.exports = ArrayField;
