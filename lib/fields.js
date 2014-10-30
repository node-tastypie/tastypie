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

var Class = require( './class' )
  , Meta = require( './class/meta' )
  , Parent = require( 'prime-util/prime/parentize' )
  , events = require( 'events' )
  , ApiField
  , RelatedField
  ;


/**
 * Description
 * @class module:fields.js.Thing
 * @param {TYPE} param
 * @example var x = new fields.js.THING();
 */
exports.ApiField = ApiField = new Class(/* @lends module .THING.prototype */{
	inherits: events.EventEmitter
	,mixin:[ Meta, Parent ]
	,meta:{
		readonly:false
		,null:false
		,attribute:null
		,default:null
		,
	}
	,constructor: function( meta ){
		this.setMeta( meta );

	}
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

	,toJSON:function toJSON( ){

	}
});

Object.defineProperties(ApiField.prototype,{
	default:{
		enumerable:false
		,writeable:false
		,get: function( ){
			return this.options.default
		}
	}

})


exports.RelatedField = RelatedField = new Class({
	inherits:ApiField
	,meta:{
		to:null
	}
	,constructor: function(to, options){


		this.parent('constructor', options)

	}
});
Object.defineProperties(RelatedField.prototype,{
	cls:{
		enumerable:false
		,writeable: false
		,get: function(){
			var bits  // require path string ( /path/to/module.Class )
			  , mod   // the required module
			  , cls   // the related class object
			if( typeof this.options.to == 'string' ){
				var bits = this.options.to.split('.')
				var mod = require( bits[0] )
				var cls;

				cls = !!bits[1] ? module[ bits[1]] : bits[0];

				this.options.to = cls;
			}

			return this.options.to;
		}
	}
})