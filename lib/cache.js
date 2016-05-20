/*jshint laxcomma:true, smarttabs: true, node: true */
'use strict';
/**
 * Provides a simple caching interface to resources
 * @module tastypie/lib/cache
 * @author Eric Satterwhite
 * @since 0.4.0
 * @requires module:tastypie/class
 * @requires module:tastypie/class/options
 * @requires module:tastypie/class/parent
 **/
var Class     = require('./class')
  , Options   = require('./class/options')               // Options
  , Parentize = require('./class/parent')
  , catbox    = require('catbox')
  , Cache
  ;

/**
 * A no op cache type
 * @constructor
 * @alias module:tastypie/lib/cache
 * @param {Object} [options]
 * @param {Number} [options.timeout=60]
 * @param {String} [options.engine=catbox-noop]
 * @param {String} [options.segment=tastypie]
 * @param {String} [options.partition=tastypie]
 * @param {String[]} [options.varies]
 * @param {Object} [options.opts] additional options for the catbox backend
 * @param {object} [options.control]
 */
Cache = new Class({
	mixin:[Options, Parentize]
	,options:{
		timeout:60
		,engine: 'catbox-noop'
		,segment:'tastypie'
		,partition:'tastypie'
		,varies:[ 'Accept' ]
		,opts:{
			expiresIn: 1000 * 60 * 5
		}
		,control: {
			no_cache:true
		}
	}
	, constructor: function( options ){
		var policy, client;

		this.setOptions( options );
		client = new catbox.Client( require( this.options.engine ),this.options );
		client.start(function(){
			policy = new catbox.Policy(
				this.options.opts
			  , client
			  , this.options.segment + '-' + (+ new Date()).toString( 32 )
			);
		}.bind( this ));

		Object.defineProperty(this, 'client', {
			enumerable: false,
			get:function( ){
				return policy;
			}
		});
	}

	/**
	 * Sets a value at a given cache key
	 * @method module:tastypie/lib/cache#get
	 * @param {String} key A unique key to retrieve a value from
	 * @param {Function} [callback] A callback function to be called once the cache key has been set
	 */
	, get: function get( key, callback ){
		return this.client.get( key, callback );
	}

	/**
	 * Sets a value at a given cache key
	 * @method module:tastypie/lib/cache#set
	 * @param {String} key A unique ket to set a value at
	 * @param {Mixed} value The value to set at the given key
	 * @param {Function} [callback] A callback function to be called once the cache key has been set
	 */
	, set: function set( key, value, callback ){
		return this.client.set( key, value, 0, callback);
	}
	, cacheable: function cacheable( req ){
		return req.method.toLowerCase() === 'get';
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

module.exports = Cache;
