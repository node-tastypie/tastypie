'use strict';
/**
 * Holds common exception classes
 * @module module:lib/resource
 * @author Eric Satterwhite
 * @requires module:class
 * @requires module:class/meta
 * @since 0.1.0
 **/
var Class = require('./class')
  , Meta  = require('./class/meta')
  , events = require('events')
  , Resource
  ;

Resource = Class({
	inherits:events.EventEmitter
	,mixin:[ Meta ]
	,meta: {
		resourceName:null
	}
	,constructor: function(){
		events.EventEmitter.call( this );
	}
	,dispatch: function(req, res, next ){

	}
	,baseUrls: function(){
		return []
	}
	,prependUrls: function( ){
		return [
			{
				"/:more": 'dispatchList'
			}
		]
	}
});

Object.defineProperties( Resource.prototype,{
	urls:{
		get: function(){
			return [].push( this.prependUrls(), this.baseUrls() )
		}
	}
})


module.exports = Resource;