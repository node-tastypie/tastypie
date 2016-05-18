/*jshint laxcomma: true, smarttabs: true, node:true, mocha: true*/
'use strict';
/**
 * parent.js
 * @module parent.js
 * @author Eric Satterwhite
 * @since 3.0.1
 * @requires tastypie/lib/class
 * @requires mout/array/slice
 */

var Class = require( './index' )
  , slice = require("mout/array/slice")
  ;


function attempt( fn, args, scope ){
	try{
		return [ null, fn.apply( scope, args ) ]
	} catch( err ){
		return [ err, null ]
	}
}
/**
 * @alias module:tastypie/lib/class/parent
 */
module.exports = new Class({
	/**
	 * Calls a function on the parent class in the scope of the child class
	 * @method module:tastypie/lib/class/parent#parent
	 * @param {TYPE} name DESCRIPTION
	 * @param {...Mixed} argument arguments to pass to the function
	 * @return {?Object} returns the result of the parent function call
	 **/
	parent: function(method){
		var parent, result;

		parent       = this._parent || this.constructor.parent;
		this._parent = parent.constructor.parent;
		result       = attempt(parent[method], slice(arguments, 1) , this );
		this._parent = parent;
		
		if( result[0] ){
			throw result[0];
		}

		return result[1]
	}

})