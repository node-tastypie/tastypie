/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * fields.js
 * @module fields.js
 * @author 
 * @since 0.0.1
 * @requires moduleA
 * @requires moduleB
 * @requires moduleC
 */

var moduleA = require( 'moduleA' )
  , moduleB = require( 'moduleB' )
  , moduleC = require( 'moduleC' )
  ;

/**
 * Description
 * @class module:fields.js.Thing
 * @param {TYPE} param
 * @example var x = new fields.js.THING();
 */

exports.THING = Object.create(/* @lends module .THING.prototype */{
	
	/**
	 * This does something
	 * @param {TYPE} name description
	 * @param {TYPE} name description
	 * @param {TYPE} name description
	 * @returns something
	 **/
	method: function(){

		/**
		 * @name fields.js.Thing#event
		 * @event
		 * @param {TYPE} name description
		 **/	
		this.emit('event', arg1, arg2)
	}
});
