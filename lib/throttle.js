/*jshint laxcomma: true, smarttabs: true*, node: true/
'use strict';
/**
 * throttle.js
 * @module throttle.js
 * @author Eric Satterwhite
 * @since 0.2.2
 * @requires moduleA
 * @requires moduleB
 * @requires moduleC
 */

var Class = require( './class' )
  , Options = require( './class/options' )
  , slugify = require('mout/string/slugify')
  , Parent = require( 'prime-util/prime/parentize' )
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

	,incr: function incr(){
		return this
	}
	/**
	 * This does something
	 * @param {TYPE} name description
	 * @param {TYPE} name description
	 * @param {TYPE} name description
	 * @returns something
	 **/
	,toThrottle: function toThrottle(){
		return false
	}

	,convert: function convert( id ){
		return 'access-' + slugify( id );
	}
});


Memory = new Class({
	mixin:[ Options, Parent ]
	,options:{
		at: 150,
		timeframe: ( 1000 * 60 * 5)
	}
	,constructor: function( options ){
		this.setOptions( options );
		this._mem = {}
	}
	,incr: function incr( id ){
		var key = this.convert( id )
		( this._mem[ key ] = this._mem[ key ] || [] ).push( new Date() );

		return this;
	}

	,toThrottle: function toThrottle( id ){
		var key = this.convert( id );
		var now = new Date();
		var that = this;
		var attempts 

		attempts = ( this._mem [ key ] || [])
						.filter( function( time ){
							 return ( now - time ) < that.options.timeframe  
						});

		return attempts >= this.options.at;
	}

	,toJSON: function toJSON(){
		return this._mem;
	}
});

module.exports = Throttle;
module.exports.Memory = Memory;