'use strict';
/*jshint laxcomma:true, smarttabs: true */
/**
 * Provides a simple caching interface to resources
 * @module tastypie/cache
 * @author Eric Satterwhite
 * @requires module:tastypie/class
 * @requires module:tastypie/class/meta
 * @requires prime-util
 **/
var events = require( 'events' )
  , Class = require('./class')
  , Meta             = require('./class/meta')               // Meta
  , Parentize        = require('prime-util/prime/parentize')
  , Cache
  ;

/**
 * DESCRIPTION
 * @class module:tastypie/cache.Cache
 * @param {Object} meta 
 */
Cache = Class(/** @lends module:tastypie/cache.Cache.prototype */{
	mixin:[Meta, Parentize]
	,meta:{
		timeout:60
		,varies:[ 'Accept' ]
		,control: {
			no_cache:true
		}
	}
	, constructor: function( meta ){
		this.setMeta( meta );
		
		process._cache = process._cache || {};
	}
	/**
	 * This does something
	 * @param {TYPE} name DESCRPTION
	 * @param {TYPE} name DESCRIPTION
	 * @returns {TYPE} DESCRIPTION
	 */ 
	, get: function get( key ){ }
	, set: function set( key, value ){ return this; }
	, cacheable: function cacheable( req ){
		return req.method.toLowerCase() == 'get';
	}

});

Object.defineProperties( Cache.prototype, {
	control: {
		enumerable:false
	  , configurable: false
	  , get: function(){
			return this.meta.control;
		}
	}

});

/**
 * Dummy cache the stores data in memory on a per process basis
 * Don't use this for anything that looks
 * like a production server
 * @class module:tastypie/cache.Cache
 * @param {Object} meta 
 */
Cache.Memory = Class(/* @lends module:tastypie/cache.Memory */{
	inherits:Cache
	,constructor: function( meta ){
		this.parent('constructor', meta )
	}
	,get: function get( key ){
		return process._cache[ key ]
	}
	,set: function set(key, value, timeout ){
		var timerkey = key + ":timer"
		  , cache = process._cache
		  ;

		cache[ key ] = value;
		
		// clear the timer for this key...
		clearTimeout(process._cache[ timerkey ])

		// set a new timer
		cache[timerkey] = setTimeout(function(){
			cache[key] = cache[timerkey] = undefined;
		},(timeout || this.meta.timeout) * 1000 )

		// dereference the timer
		cache[timerkey].unref();
		return this;
	}
});

module.exports = Cache;
