/*jshint laxcomma: true, smarttabs: true*, node: true*/
'use strict';
/**
 * throttle.js
 * @module tastypie/lib/throttle
 * @author Eric Satterwhite
 * @since 0.2.2
 * @requires tastypie/lib/class
 * @requires tastypie/lib/class/options
 * @requires mout/string/slugify
 * @requires prime-util/prime/parentize
 */

var Class   = require( './class' )
  , Options = require( './class/options' )
  , slugify = require('mout/string/slugify')
  , Parent  = require( 'prime-util/prime/parentize' )
  , debug   = require('debug')('tastypie:throttle')
  , Throttle
  , Memory
  ;

/**
 * Description
 * @class module:throttle.js.Thing
 * @param {TYPE} param
 * @example var x = new throttle.js.THING();
 */
Throttle = new Class({
	mixin:[ Options, Parent ]
	,options:{
		at:150
	}
	,constructor: function( options ){
		this.setOptions( options );
	}

	/**
	 * Records an entry for a given keyf
	 * @chainable
	 * @method module:tastypie/lib/throttle#incr
	 * @param {String} id the internal key to record
	 **/
	,incr: function incr(){
		return this
	}

	/**
	 * Checks if a given key has reached the configured throttling limit
	 * @method module:tastypie/lib/throttle#toThrottle
	 * @param {String} id the internal key to record
	 * @returns {Boolean}
	 **/
	,toThrottle: function toThrottle(){
		return false
	}

	/**
	 * creates a namespaced key based on an id
	 * @method module:tastypie/lib/throttle#convert
	 * @param {String} id the internal key to record
	 * @return {String} key
	 **/
	,convert: function convert( id ){
		return 'access-' + slugify( id );
	}
})


/**
 * And in memory throttle implementation. For testing and debugging purposes only
 * @class module:tastypie/lib/throttle.Memory
 * @param {Object} [options]
 * @param {Number} [options.at=15]
 * @param {Number} [options.timeframe=30000]
 */
Memory = new Class({
	inherits:Throttle
	,options:{
		at: 150,
		timeframe: ( 1000 * 60 * 5),
		expires: null
	}
	,constructor: function( options ){
		this.setOptions( options );
		this._mem = {};
		var expires = this.options.expires;

		expires && setInterval(function(){
			Object
				.keys( this._mem )
				.forEach(function( key ){
					var now = new Date();
					var first = this._mem[key][0];
					var diff;

					diff = first ? now - first : 0;
					if( diff > this.options.expires ){
						debug("purging record for %s ", key )
						this._mem[key].shift();
					}
				}.bind( this ) )
		}.bind(this),expires).unref();
	}

	/**
	 * Records an entry for a given keyf
	 * @chainable
	 * @method module:tastypie/lib/throttle#incr
	 * @param {String} id the internal key to record
	 **/
	,incr: function incr( id ){
		var key = this.convert( id );
		( this._mem[ key ] = this._mem[ key ] || [] ).push( new Date() );
		return this;
	}

	/**
	 * Checks if a given key has reached the configured throttling limit
	 * @method module:tastypie/lib/throttle#toThrottle
	 * @param {String} id the internal key to record
	 * @returns {Boolean}
	 **/
	,toThrottle: function toThrottle( id ){
		var that     // reference to this
		  , key      // lookup key
		  , now      // current date
		  , attempts // number of attempts for lookup key
		  ;

		that = this;
		key  = this.convert( id );
		now  = new Date();
		attempts 

		attempts = ( this._mem [ key ] || [])
						.filter( function( time ){
							 return ( now - time ) < that.options.timeframe  
						});

		return attempts.length >= this.options.at;
	}

	/**
	 * Returns internal memory 
	 * @private
	 * @method module:tastypie/lib/throttle#toJSON
	 * @returns {Object}
	 **/
	,toJSON: function toJSON(){
		return this._mem;
	}

	/**
	 * creates a namespaced key based on an id
	 * @method module:tastypie/lib/throttle#convert
	 * @param {String} id the internal key to record
	 * @return {String} key
	 **/
	,convert: function convert( id ){
		return 'access-' + slugify( id )
	}
});

module.exports = Throttle;
module.exports.Memory = Memory;