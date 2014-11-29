/*jshint laxcomma:true, smarttabs: true */
'use strict';
/**
 * Allows for options data configuration for class instances
 * @module module:tastypie/class/options
 * @author Eric Satterwhite
 * @requires module:tastypie/class
 * @requires mout/object/merge
 * @requires mout/array/append
 **/
var Class = require('./index')
  , merge = require( 'mout/object/merge' )
  , append = require( 'mout/array/append' )

function removeOn( name ){
	return name.replace(/^on([A-Z])/, function(full, first ){
		return first.toLowerCase();
	})
}

/**
 * Mixin class providing configuration options
 * @class module:tastypie/class/options
 * @param {Object} [options={}] object to use as overrides 
 * @example var conf = new options();
conf.setOptions({
	key:{
		a:1, b:2
	}
});
conf.setOptions({key:{b:3}})
conf.options.key.b // 3
conf.options.key.a // 1
 */
module.exports = Class({
	/**
	 * Over rides internal values with supplied object
	 * @method module:tastypie/class/options#setOptions
	 * @param {Object} options The options object to use as configuration overrides
	 **/
	setOptions: function setOptions( options ){
		if( !!this.addListener ){
			for( var opt in options ){
				if( typeof( options[ opt ] ) !== 'function' || !(/^on[A-z]/).test(opt)){
					continue;
				}
				this.addListener( removeOn( opt ), options[ opt ]);
				delete options[opt];
			}
		}
		this.options = merge.apply(null, append([{}, this.options], arguments ) );
		return this;
	}
})
