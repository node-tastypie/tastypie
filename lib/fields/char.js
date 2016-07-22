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
  , toArray        = require('mout/lang/toArray')
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
        ,enum: null
	}

    ,constructor: function( options ){
        this.parent('constructor', options);
        this.options.enum = toArray( this.options.enum );
    }

	,convert: function( value ){
		return value === null ? value : value ? '' + value :'';
	}

    ,hydrate: function( bundle, cb ){
        this.parent('hydrate', bundle, function(err, value){
            var idx;
            if( err ){
                return cb( err, null );
            }
            if( this.options.enum.length ){
                idx = this.options.enum.indexOf( value );
                value = idx >= 0 ? this.options.enum[ idx ]:this.default;
            }
            cb( null, value );
        }.bind( this ));
    }
});

module.exports = CharField;
