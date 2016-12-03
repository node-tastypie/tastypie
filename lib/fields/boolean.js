/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * Resource Field for dealing with boolean values
 * @module tastypie/fields/boolean
 * @author Eric Satterwhite
 * @since 0.5.0
 * @requires tastypie/lib/class
 * @requires tastypie/lib/fields/api
 */

var typecast       = require( 'mout/string/typecast' )
  , Class          = require( '../class' )
  , ApiField       = require('./api')
  , BooleanField
  ;

/**
 * @constructor
 * @alias module:tastypie/fields/boolean
 * @extends module:tastypie/fields/api
 */
exports.BooleanField = BooleanField = new Class({
    inherits: ApiField
    ,options:{
       help:'Forces all values to either true of false'
    }
    ,convert: function convert( value ){
        return !!( typeof value === 'string' ? typecast( value ) : value ) ;
    }
    ,type: function type(){
        return 'boolean';
    }
});

module.exports = BooleanField;
