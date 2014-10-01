/*jshint laxcomma:true, smarttabs: true */
'use strict';
/**
 * Allows for meta data configuration for class instances
 * @module module:tastypie/class/meta
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
 * @class module:tastypie/class/meta
 * @param {Object} [meta={}] object to use as overrides 
 * @example var conf = new Meta();
conf.setMeta({
	key:{
		a:1, b:2
	}
});
conf.setMeta({key:{b:3}})
conf.meta.key.b // 3
conf.meta.key.a // 1
 */
}
module.exports = Class({
	/**
	 * Over rides internal values with supplied object
	 * @method module:tastypie/class/meta#setMeta
	 * @param {Object} meta The meta object to use as configuration overrides
	 **/
	setMeta: function setMeta( meta ){
		if( !!this.addListener ){
			for( var opt in meta ){
				if( typeof( meta[ opt ] ) !== 'function' || !(/^on[A-z]/).test(opt)){
					continue;
				}
				this.addListener( removeOn( opt ), meta[ opt ]);
				delete meta[opt];
			}
		}
		this.meta = merge.apply(null, append([{}, this.meta], arguments ) );
		return this;
	}
})
