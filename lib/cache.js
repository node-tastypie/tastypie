'use strict';
/*jshint laxcomma:true, smarttabs: true */
/**
 * Provides a simple caching interface to resources
 * @module tastypie/cache
 * @author Eric Satterwhite
 * @requires module:tastypie/class
 * @requires module:tastypie/class/options
 * @requires prime-util
 **/
var events = require( 'events' )
  , Class = require('./class')
  , Options             = require('./class/options')               // Options
  , Parentize        = require('prime-util/prime/parentize')
  , Cache
  ;

/**
 * A no op cache type
 * @class module:tastypie/cache.Cache
 * @param {Object} options 
 */
Cache = Class(/** @lends module:tastypie/cache.Cache.prototype */{
	mixin:[Options, Parentize]
	,options:{
		timeout:60
		,varies:[ 'Accept' ]
		,control: {
			no_cache:true
		}
	}
	, constructor: function( options ){
		this.setOptions( options );
		process._cache = process._cache || {};
		
	}
	/**
	 * Sets a value at a given cache key
	 * @method module:tastypie/lib/cache.Cache#get
	 * @param {String} key A unique key to retrieve a value from
	 * @param {Function} [callback] A callback function to be called once the cache key has been set
	 */ 
	, get: function get( key, callback){ return callback && callback( null, null ) }

	/**
	 * Sets a value at a given cache key
	 * @method module:tastypie/lib/cache.Cache#set
	 * @param {String} key A unique ket to set a value at
	 * @param {Mixed} value The value to set at the given key
	 * @param {Function} [callback] A callback function to be called once the cache key has been set
	 */ 
	, set: function set( key, value, callback ){ return callback && callback(null) }
	, cacheable: function cacheable( req ){
		return req.method.toLowerCase() == 'get';
	}

});

Object.defineProperties( Cache.prototype, {
	control: {
		enumerable:false
	  , configurable: false
	  , get: function(){
			return this.options.control;
		}
	}

});

/**
 * Dummy cache the stores data in memory on a per process basis
 * Don't use this for anything that looks
 * like a production server
 * @class module:tastypie/cache.Cache
 * @param {Object} options 
 */
Cache.Memory = Class(/* @lends module:tastypie/cache.Memory */{
	inherits:Cache
	,constructor: function( options ){
		this.parent('constructor', options )
	}
	,get: function get( key, callback ){
		return callback( null, process._cache[ key ] )
	}
	,set: function set(key, value, timeout, callback ){
		var timerkey = key + ":timer"
		  , cache = process._cache
		  ;

		cache[ key ] = value;
		// clear the timer for this key...
		clearTimeout(process._cache[ timerkey ])

		// set a new timer
		cache[timerkey] = setTimeout(function(){
			cache[key] = cache[timerkey] = undefined;
		},(timeout || this.options.timeout) * 1000 )

		// dereference the timer
		cache[timerkey].unref();
		return callback && callback(null, null)
	}
	,purge: function( key, callback ){
		var timerkey = key + ':timer'
		  , cache = process._cache;

		clearTimeout( cache[ timerkey ] );

		delete cache[ key ];
		delete cache[ timerkey ];
	}
});

module.exports = Cache;
