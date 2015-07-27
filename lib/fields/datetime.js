/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * Field class for dealing with Date Time objects
 * @module tastypie/fields/date
 * @author Eric Satterwhite
 * @since 0.5.0
 * @requires boom
 * @requires util
 * @requires mout/date/strftime
 * @requires mout/lang/isString
 * @requires tastypie/lib/class
 * @requires tastypie/lib/fields/api
 */

var util           = require( 'util' )
  , boom           = require( 'boom' )
  , strftime       = require( 'mout/date/strftime' )
  , isString       = require( 'mout/lang/isString'  )
  , Class          = require( '../class' )
  , ApiField       = require('./api')
  , DATETIME_REGEX = /^(\d{4})-(\d{2})-(\d{2})(?:T|\s+)(\d{2}):(\d{2}):(\d{2}).*/
  , DateTimeField
  ;

/**
 * @constructor
 * @alias module:tastypie/fields/datetime
 * @extends module:tastypie/fields/api
 * @param {Object} [options]
 * @param {String} [options.format=%Y-%m-%dT%M:%H:%S.%LZ]
 */
 DateTimeField = new Class({
	inherits:ApiField
	,options:{
		format:'%Y-%m-%dT%M:%H:%S.%LZ'
	}

	,convert: function convert( value ){
		if( !value ){
			return value;
		}

		if( isString( value ) ){
			var valid = value.match( DATETIME_REGEX );
			if( !valid ){
				this.emit('error', boom.create(400, util.format( "Invalid Date String for field %s: %s", this.options.name, value ) ) );
			}

			return new Date( valid[1], valid[2], valid[3], valid[4], valid[5], valid[ 6]);
			
		}

		return value;
	}
	,dehydrate: function( obj, attr ){
		var value = this.parent('dehydrate', obj, attr );
		return strftime( value, this.options.format);
	}
	,type: function( ){
		return 'datetime';
	}
});

module.exports = DateTimeField;