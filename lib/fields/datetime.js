/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * Field class for dealing with Date Time objects
 * @module tastypie/fields/datetime
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
  , sample         = new Date('Jan 31, 1960 14:30:00')
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
		format:'%Y-%m-%dT%H:%M:%S.%LZ'
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
	,dehydrate: function( obj, cb ){
		this.parent('dehydrate', obj, function( err, value ){
			return cb( err, value ? strftime( value, this.options.format) : value );
		}.bind( this ));
	}

    ,hydrate: function( bundle, cb ){
        this.parent('hydrate', bundle, function(err, value ){
            cb( err , value && this.convert( value ) );
        }.bind( this ));
    }

    ,format: function(){
        return strftime( sample, this.options.format )
    }

	,type: function( ){
		return 'datetime';
	}
});

module.exports = DateTimeField;
