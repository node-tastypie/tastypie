/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * Field class for dealing for formatted Dates with out Time information
 * @module tastypie/fields/date
 * @author Eric Satterwhite
 * @since 0.5.0
 * @requires tastypie/lib/class
 * @requires tastypie/lib/fields/api
 */

var util           = require( 'util' )
  , boom           = require( 'boom' )
  , strftime       = require( 'mout/date/strftime' )
  , isString       = require( 'mout/lang/isString'  )
  , Class          = require( '../class' )
  , ApiField       = require('./api')
  , DATE_REGEX     = /^([0-9]{4})-?([0-9]{2})-?([0-9]{2})$/
  , DateField
  ;

/**
 * @constructor
 * @alias module:tastypie/fields/date
 * @extends module:tastypie/fields/api
 * @param {Object} [options]
 * @param {String} [options.format=%F]
 * @example var x = new tastypie/fields/date();
 */
DateField = new Class({
	inherits: ApiField
	,options:{
		format:'%F'
	   ,help:'Converts Date object to and from YYYY-MM-DD'
	}

	,convert: function convert( value ){
		if( !value ){
			return value;
		}

		if( isString( value ) ){
			var valid = value.match( DATE_REGEX );
			if( !valid ){
				this.emit('error', boom.create(400, util.format( "Invalid Date String for field %s: %s", this.options.name, value ) ) );
			}

			return new Date( valid[1], valid[2] ? valid[2]-1:valid[2] , valid[3]);
		}

		return value;
	}

	,dehydrate: function(obj, cb ){
		this.parent('dehydrate', obj, function( err, value ){
			return cb( err, value ? strftime( value, this.options.format ) : value );
		});
	}

	,hydrate: function( bundle, cb ){
		this.parent('hydrate', bundle, function( err, value ){
			var data = value.match( DATE_REGEX );
			return cb( err, new Date( data[1], data[2], data[3] ) );
		});
	}

	,type: function( ){
		return 'date';
	}
});

module.exports = DateField;
