/*jshint laxcomma: true, smarttabs: true, node:true */
'use strict';
/**
 * A Resource for interacting with the Mongoose ODM for mongodb 
 * @module tastypie/lib/resource/mongoose
 * @author Eric Satterwhite
 * @since 0.0.1
 * @requires util
 * @requires tastypie/lib/class
 * @requires tastypie/lib/class/options
 * @requires tastypie/lib/resource
 * @requires joi
 */

var util = require( 'util' )
  , Class = require( '../class' )
  , Options = require( '../class/options' )
  , Resource = require('./index')
  , joi = require('joi')
  , MongoResource
  ;

/**
 * Description
 * @constructor
 * @alias module:tastypie/lib/resource/mongoose
 * @extends module:tastypie/lib/resource
 * @mixes module:tastypie/lib/class/options
 * @param {Object} options
 */
module.exports = MongoResource = new Class({
	inherits:Resource
	,options:{
		queryset: null
	}
	,constructor: function( options ){

		debugger;
		joi.assert(options.queryset, joi.required(),'querset is required')
		var instance = new options.queryset
		this.options.objectTpl = instance.model;
		this.parent( 'constructor', options )
		instance = null;

	}
	, _get_list: function( bundle, callback ){
		var query = new this.options.queryset();

		query.exec( callback )
	}
	,method: function(){

		/**
		 * @name module:tastypie/lib/resource/mongoose#event
		 * @event
		 * @param {TYPE} name description
		 **/	
		this.emit('event', arg1, arg2)
	}
});
