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
  , Options = require( './class/options' )
  , Parent = require( 'prime-util/prime/parentize' )
  , events = require( 'events' )
  , path = require( 'path' )
  , isFunction = require( 'mout/lang/isFunction' )
  , isString = require('mout/lang/isString' )
  , kindOf = require('mout/lang/kindOf' )
  , get = require('mout/object/get')
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
	,mixin:[ Options, Parent ]
	,options:{
		"readonly"  : false
	  , "null"      : false
	  , "attribute" : null
	  , "default"   : null
	  , "blank"     : false
	  , "name"      : null
	}
	
	,constructor: function( options ){
		this.setOptions( options );

	}
	/**
	 * This does something
	 * @param {TYPE} name description
	 * @param {TYPE} name description
	 * @param {TYPE} name description
	 * @returns something
	 **/
	,convert: function convert( val ){
		return val;
	}

	,hydrate: function hydrate( bundle ){
		var name = this.options.name
		  , attr = this.options.attribute
		  , obj  = bundle.object
		  ;

		// if readonly, don't care!
		if( this.options.readonly ){
			return;
		}

		// if there is a value in data, return it.
		if( bundle.data.hasOwnProperty( name ) ){
			return bundle.data[ name ]
		}

		// if bundle data doesn't have a matching property.
		// look for one.
		if( attr && obj.hasOwnProperty( attr ) ){
			return obj[ attr ]
		} else if ( name && obj.hasOwnProperty( name ) ){
			return obj[ name ]
		}else if( this.options.default ){
			return isFunction( this.options.default ) ? this.options.default() : this.options.default
		} else if( this.options.null ){
			return null
		} else {
			this.emit('error', new Error("Field Has No Data"))
		}
	}

	,dehydrate: function dehydrate( obj, attribute ){
		var current, attrs, attribute;
		attribute = attribute || this.options.attribute;

		if( isString( attribute ) ){
			current = get( obj, attribute )
			if( current == null ){
				if( this.options.default ){
					current = this.options.default 
				} else if( this.options.null ){
					current = null;
				}
			}
			current = isFunction( current ) ? current() : current;
		} else if( isFunction( attribute ) ){
			current = attribute();
		}
		return this.convert( current );
	}

	,augment: function augment( cls, name ){
		if( !this.hasOwnProperty( 'name' ) ){
			Object.defineProperty(this, 'name', {
				enumerable: false
				,get: function(){
					return name;
				}
			})
		}

		if( !this.hasOwnProperty( 'resource') ){
			Object.defineProperty(this, 'resource', {
				enumerable:false
				,get: function(){
					return cls
				}
			});
			
		}

		return this;
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
	,options:{
		to:null
	}
	,constructor: function(to, options){


		this.parent('constructor', options)
		this.options.to = to;
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
			  , _to = this.options.to
			if( typeof _to == 'string' ){
				console.log('to: %s', _to)
				bits = _to.split('/')
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
				mod = require( _to )
				cls = mod[ cls ];
				this.options.to = cls;
			}

			return this.options.to;
		}
	}
})


exports.CharField = new Class({
	inherits: ApiField
	,convert: function( value ){
		return value === null ? value : value ? '' + value :''
	}
})
