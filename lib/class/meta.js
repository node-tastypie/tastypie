/*jshint laxcomma:true, smarttabs: true */
'use strict';
/**
 * DESCRIPTION
 * @module NAME
 * @author 
 * @requires moduleA
 * @requires moduleB
 * @requires moduleC
 **/
var prime = require('prime')
  , merge = require( 'mout/object/merge' )
  , append = require( 'mout/array/append' )

function removeOn( name ){
	return name.replace(/^on([A-Z])/, function(full, first ){
		return first.toLowerCase();
	})
}
/**
 * DESCRIPTION
 * @class module:NAME.Thing
 * @param {TYPE} NAME DESCRIPTION
 * @example var x = new NAME.Thing({});
 */
module.exports = prime(/** @lends module:NAME.Thing.prototype */{
	/**
	 * This does something
	 * @param {TYPE} name DESCRPTION
	 * @param {TYPE} name DESCRIPTION
	 * @returns {TYPE} DESCRIPTION
	 */ 
	setMeta: function( meta ){
		this.meta = merge.apply(null, append([{}, this.meta], arguments ) );
		meta = this.meta;
		if( !!this.addListener ){
			for( var opt in meta ){

				if( typeof( meta[ opt ] ) !== 'function' || !(/^on[A-z]/).test(opt)){
					continue;
				}
				this.addListener( removeOn( opt ), meta[ opt ]);
				delete meta[opt];
			}
		}
		return this;
	}
});
