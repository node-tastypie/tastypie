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

	,hydrate: function( bundle, cb ){
		this.parent('hydrate', bundle, function( err, value ){
			if( err ){
				cb && cb( err, null )
			}

			if (typeof value === 'string')
				try {
					cb( null, JSON.parse( value ))
				} catch( err ){
					cb(null, this.convert( value ) )
				}
			else
				cb(null, this.convert( value ) )
		}.bind(this))
	}
});

module.exports = ArrayField;
