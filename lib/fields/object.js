/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * No-Op Field class for returning plain objects
 * @module tastypie/fields/object
 * @author Eric Satterwhite
 * @since 0.5.0
 * @requires tastypie/lib/class
 * @requires tastypie/lib/fields/api
 */

var Class          = require( '../class' )
  , ApiField       = require('./api')
  , ObjectField
  ;

/**
 * @constructor
 * @alias module:tastypie/fields/object
 * @extends module:tastypie/fields/api
 * @param {Object} options
 */
ObjectField = new Class({
  inherits:ApiField

  ,convert: function convert( value ){
    return value;
  }

  ,type: function( ){
    return 'object';
  }
});

module.exports = ObjectField;
