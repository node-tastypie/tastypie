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
  , typecast  = require('mout/string/typecast')
  , isString = require('mout/lang/isString' )
  , kindOf = require('mout/lang/kindOf' )
  , strftime = require('mout/date/strftime')
  , get = require('mout/object/get')
  , util = require('util')
  , DATE_REGEX =  /^([0-9]{4})-?([0-9]{2})-?([0-9]{2})$/
  , DATETIME_REGEX = /^(\d{4})-(\d{2})-(\d{2})(?:T|\s+)(\d{2}):(\d{2}):(\d{2}).*/
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
		'readonly'  : false
	  , 'null'      : false
	  , 'attribute' : null
	  , 'default'   : null
	  , 'blank'     : false
	  , 'name'      : null
	  , help:'A general no op field'
	}
	
	,constructor: function( options ){
		this.setOptions( options );

	}

	,type: function( ){
		return 'string'
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
		var name = this.name
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
		// NOTE: we can't use hasOwnProperty here because we care inherited properties
		if( attr && attr in obj ){
			return obj[ attr ];
		} else if ( name && name in obj ){
			return obj[ name ];
		}else if( this.options.default ){
			return isFunction( this.options.default ) ? this.options.default() : this.options.default
		} else if( this.options.null ){
			return null
		} else {
			this.emit('error', new Error(util.format( "Field %s has no data, default value and is not nullable ", this.name) ))
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


/**
 * Description
 * @class module:fields.js.Thing
 * @param {TYPE} param
 * @example var x = new fields.js.THING();
 */
exports.CharField = new Class({
	inherits: ApiField
	, options:{
			
		help:'Forces values to string values by calling toString'
	}
	,convert: function( value ){
		return value === null ? value : value ? '' + value :''
	}
})

/**
 * Description
 * @class module:fields.js.Thing
 * @param {TYPE} param
 * @example var x = new fields.js.THING();
 */
exports.ArrayField = new Class({
	inherits: ApiField
	,options:{
		separator: ','
	  , help:'converts comma separated string into an array of value'

	}
	,type: function(){
		return 'array';
	}
	,convert: function( value ){
		var _val = []
		switch( kindOf( value ).toLowerCase() ){
			case 'string':
				_val = value.split( this.options.separator )
				break;
			case 'array':
				_val = value;
				break;
			default:
				_val = value ? [ value ] : _val
				break;
		}

		return _val;
	}
});


/**
 * Description
 * @class module:fields.js.Thing
 * @param {TYPE} param
 * @example var x = new fields.js.THING();
 */
exports.IntegerField = new Class({
	inherits: ApiField
	,options:{
	   help:'Converts values to Numbers with a base of 10'
	}
	,convert: function convert( value ){
		return parseInt( value, 10 );
	}
	,type: function( ){
		return 'integer';
	}
});

/**
 * Description
 * @class module:fields.js.Thing
 * @param {TYPE} param
 * @example var x = new fields.js.THING();
 */
exports.FLoatField = Class({
	inherits: ApiField
	,options:{
	   help:'Converts string values to floating point numbers'

	}
	,convert: function convert( value ){
		return parseFloat( value );
	}
	,type: function type( ){
		return 'float'
	}

});

/**
 * Description
 * @class module:fields.js.Thing
 * @param {TYPE} param
 * @example var x = new fields.js.THING();
 */
exports.BooleanField = new Class({
	inherits: ApiField
	,options:{
	   help:'Foces all values to either true of false'
	}
	,convert: function convert( value ){
		return !!typecast( value );
	}
	,type: function type(){
		return 'boolean'
	}
});


/**
 * Description
 * @class module:fields.js.Thing
 * @param {TYPE} param
 * @example var x = new fields.js.THING();
 */
exports.DateField = new Class({
	inherits: ApiField
	,options:{
		format:'%F'
		,options:{
		   help:'Converts Date object to and from YYYY-MM-DD'
		}
	}

	,convert: function convert( value ){
		if( !value ){
			return value;
		}

		if( isString( value ) ){
			var valid = value.match( DATE_REGEX )
			if( !valid ){
				throw new Error("Invalid Date String")
			}

			return new Date( valid[1], valid[2], valid[3])
			
		}

		return value
	}

	,type: function( ){
		return 'date'
	}

	,hydrate: function( bundle ){
		value = this.parent('hydrate', bundle );
		data = value.match( DATE_REGEX )
		return new Date( data[1], data[2], data[3] )
	}
});

/**
 * Description
 * @class module:fields.js.Thing
 * @param {TYPE} param
 * @example var x = new fields.js.THING();
 */
exports.DateTimeField = new Class({
	inherits:ApiField
	,options:{
		format:'%Y-%m-%dT%M:%H:%S.%LZ'
	}

	,convert: function convert( value ){
		if( !value ){
			return value;
		}

		if( isString( value ) ){
			var valid = value.match( DATETIME_REGEX )
			if( !valid ){
				throw new Error("Invalid Date String")
			}

			return new Date( valid[1], valid[2], valid[3], valid[4], valid[5], valid[ 6])
			
		}

		return value;
	}
	,type: function( ){
		return 'datetime'
	}
});


exports.ObjectField = new Class({
	inherits:ApiField
	,options:{

	}

	,convert: function convert( value ){
		return value
	}

	,type: function( ){
		return 'object'
	}
})
