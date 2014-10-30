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
  , path = require( 'path' )
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
	,method: function(){

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
			return this.meta.default
		}
	}

})


exports.RelatedField = RelatedField = new Class({
	inherits:ApiField
	,meta:{
		to:null
	}
	,constructor: function(to, meta){


		this.parent('constructor', meta)
		this.meta.to = to;
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
			  , _to = this.meta.to
			if( typeof _to == 'string' ){
				console.log('to: %s', _to)
				var bits = _to.split('/')
				var lastBit = bits[bits.length-1]
				var dotPosition = lastBit.indexOf('.')
				var hasCls =  dotPosition !== -1;

				if( hasCls ){
					var module_bits = lastBit.split('.')
					bits[ bits.length-1 ] = module_bits[0]
					cls = module_bits[1];

					_to = path.resolve( bits.join('/') )


				}
				console.log("requireing", _to)
				var mod = require( _to )
				cls = mod[ cls ];
				this.meta.to = cls;
			}

			return this.meta.to;
		}
	}
})