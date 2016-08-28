/*jshint laxcomma: true, smarttabs: true, node: true, esnext: true*/
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
  , co             = require( 'co' )
  , strftime       = require( 'mout/date/strftime' )
  , isString       = require( 'mout/lang/isString'  )
  , Class          = require( '../class' )
  , ApiField       = require('./api')
  , DATE_REGEX     = /^([0-9]{4})-?([0-9]{2})-?([0-9]{2})$/
  , sample         = new Date('Jan 31, 1960')
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
		if( value && isString( value ) ){
			var valid = value.match( DATE_REGEX );
			if( !valid ){
				this.emit('error', boom.create(400, util.format( "Invalid Date String for field %s: %s", this.options.name, value ) ) );
			}

			return new Date( valid[1], valid[2] ? valid[2]-1:valid[2] , valid[3]);
		}

		return value;
	}

	,dehydrate: co.wrap(function* dehydrate( obj ){
		let value = yield this.parent('dehydrate', obj);
		return value ? strftime( value, this.options.format ) : value;
	})

	,hydrate: co.wrap(function* hydrate( bundle, cb ){
		let value, data;
		value = yield this.parent('hydrate', bundle);
		data  = value.match( DATE_REGEX );
		return new Date( data[1], data[2], data[3] );
	})

	,format: function(){
		return strftime( sample, this.options.format );
	}

	,type: function( ){
		return 'date';
	}
});

module.exports = DateField;
