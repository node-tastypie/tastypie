/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * resource field definitions
 * @module tastypie/fields
 * @author Eric Satterwhite
 * @since 0.0.1
 * @requires events
 * @requires path
 * @requires util
 * @requires prime-util/prime/parentize
 * @requires mout/lang/isFunction
 * @requires mout/string/typecast
 * @requires mout/lang/isString
 * @requires mout/lang/kindOf
 * @requires mout/date/strftime
 * @requires mout/object/get
 * @requires tastypie/lib/class
 * @requires tastypie/lib/class/options
 * @exports ApiField
 */

var events         = require( 'events' )
  , path           = require( 'path' )
  , util           = require( 'util' )
  , Parent         = require( 'prime-util/prime/parentize' )
  , isFunction     = require( 'mout/lang/isFunction' )
  , typecast       = require( 'mout/string/typecast' )
  , isString       = require( 'mout/lang/isString'  )
  , kindOf         = require( 'mout/lang/kindOf'  )
  , strftime       = require( 'mout/date/strftime' )
  , get            = require( 'mout/object/get' )
  , Class          = require( './class' )
  , Options        = require( './class/options' )
  , DATE_REGEX     = /^([0-9]{4})-?([0-9]{2})-?([0-9]{2})$/
  , DATETIME_REGEX = /^(\d{4})-(\d{2})-(\d{2})(?:T|\s+)(\d{2}):(\d{2}):(\d{2}).*/
  , ApiField
  , RelatedField
  , CharField
  , ArrayField
  , IntegerField
  , FloatField
  , BooleanField
  , DateField
  , DateTimeField
  , ObjectField
  ;


/**
 * Description
 * @class module:tastypie/fields.ApiField
 * @param {Object} options
 * @param {Boolean} [options.readonly=false]
 * @param {Boolean} [options.null=false]
 * @param {?String|Function} [options.attribute=null]
 * @param {String} [options.name=null]
 * @param {String} [options.help=A general no-op field]
 * @param {} [options.default=null]
 * @mixes module:tastypie/lib/class/options
 * @mixes module:tastypie/lib/class/parent
 * @example var x = new tastypie/fields.ApiField();
 */
exports.ApiField = ApiField = new Class(/* @lends module .THING.prototype */{
	inherits: events.EventEmitter
    , mixin:[ Options, Parent ]
    , options:{
		'readonly'  : false
	  , 'null'      : false
	  , 'attribute' : null
	  , 'default'   : null
	  , 'blank'     : false
	  , 'name'      : null
	  , help:'A general no op field'
	}
	
	, constructor: function( options ){
		this.setOptions( options );

	}

	/**
	 * used to determine serialization type
	 * @private
	 * @method module:tastypie/fields.ApiField#type
	 * @return {String} internal data type
	 **/
	, type: function( ){
		return 'string';
	}
	
	/**
	 * Converts data value into the serialization specific type.
	 * @method module:tastypie/fields.ApiField#convert
	 * @param {Mixed} val value to convert
	 * @returns {Mixed} value
	 **/
	, convert: function convert( val ){
		return val;
	}

	/**
	 * Converts a serialized value in to a javascript object value
	 * @method module:tastypie/fields.ApiField#hydrate
	 * @param {Bundle} bundle
	 * @return {} The hydrated data value
	 **/
	, hydrate: function hydrate( bundle ){
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
			return bundle.data[ name ];
		}

		// if bundle data doesn't have a matching property.
		// look for one.
		// NOTE: we can't use hasOwnProperty here because we care inherited properties
		if( attr && attr in obj ){
			return obj[ attr ];
		} else if ( name && name in obj ){
			return obj[ name ];
		}else if( this.options.default ){
			return isFunction( this.options.default ) ? this.options.default() : this.options.default;
		} else if( this.options.null ){
			return null;
		} else {
			this.emit('error', new Error(util.format( "Field %s has no data, default value and is not nullable ", this.options.name) ));
		}			
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/fields.ApiField#dehydrate
	 * @param {Object} NAME ...
	 * @param {Sting} NAME ...
	 * @return {Mixed} value object value converted to its internal type
	 **/
	, dehydrate: function dehydrate( obj, attribute ){
		var current, attrs;
		attribute = attribute || this.options.attribute;

		if( isString( attribute ) ){
			current = get( obj, attribute );
			if( current == null ){
				if( this.options.default ){
					current = this.options.default; 
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

	/**
	 * DESCRIPTION
	 * @protected
	 * @method module:tastypie/fields.ApiField#augment
	 * @param {TYPE} NAME ...
	 * @param {TYPE} NAME ...
	 * @return {TYPE} DESCRIPTION
	 **/
	, augment: function augment( cls, name ){
		if( !this.hasOwnProperty( 'name' ) ){
			Object.defineProperty(this, 'name', {
				enumerable: false
				,get: function(){
					return name;
				}
			});
		}

		if( !this.hasOwnProperty( 'resource') ){
			Object.defineProperty(this, 'resource', {
				enumerable:false
				,get: function(){
					return cls;
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
			return this.options.default;
		}
	}
});

exports.RelatedField = RelatedField = new Class({
	inherits:ApiField
	,options:{
		to:null
	}
	,constructor: function(to, options){
		this.parent('constructor', options);
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
			  ;
			if( typeof _to == 'string' ){
				bits = _to.split('/');
				var lastBit = bits[bits.length-1];
				var dotPosition = lastBit.indexOf('.');
				var hasCls =  dotPosition !== -1;

				if( hasCls ){
					var module_bits = lastBit.split('.');
					bits[ bits.length-1 ] = module_bits[0];
					cls = module_bits[1];

					_to = path.resolve( bits.join('/') );


				}
				mod = require( _to );
				cls = mod[ cls ];
				this.options.to = cls;
			}

			return this.options.to;
		}
	}
});


/**
 * Description
 * @class module:tastypie/fields.CharField
 * @extends module:tastypie/fields.ApiField
 * @param {Object} options
 * @example var x = new tastypie/fields.CharField();
 */
exports.CharField = CharField = new Class({
	inherits: ApiField
	, options:{
			
		help:'Forces values to string values by calling toString'
	}
	,convert: function( value ){
		return value === null ? value : value ? '' + value :'';
	}
});

/**
 * Description
 * @class module:tastypie/fields.ArrayField
 * @extends module:tastypie/fields.ApiField
 * @param {Object} options
 * @example var x = new tastypie/fields.ArrayField();
 */
exports.ArrayField = ArrayField = new Class({
	inherits: ApiField
	,options:{
		separator: ','
	  , help:'converts comma separated string into an array of value'

	}
	,type: function(){
		return 'array';
	}
	,convert: function( value ){
		var _val = [];
		switch( kindOf( value ).toLowerCase() ){
			case 'string':
				_val = value.split( this.options.separator );
				break;
			case 'array':
				_val = value;
				break;
			default:
				_val = value ? [ value ] : _val;
				break;
		}

		return _val;
	}
});


/**
 * Description
 * @class module:tastypie/field.IntegerField
 * @param {Object} options
 * @example var x = new tastypie/field.IntegerField();
 */
exports.IntegerField = IntegerField = new Class({
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
 * @class module:tastypie/fields.FloatField
 * @extends module:tastypie/fields.ApiField
 * @param {Object} options
 * @example var field = new tastypie/fields.FloatField();
 */
exports.FloatField = FloatField = new Class({
	inherits: ApiField
	,options:{
	   help:'Converts string values to floating point numbers'

	}
	,convert: function convert( value ){
		return parseFloat( value );
	}
	,type: function type( ){
		return 'float';
	}

});

/**
 * Description
 * @class module:tastypie/fields.BooleanField
 * @extends module:tastypie/fields.ApiField
 * @param {Object} options
 * @example var x = new tastypie/fields.BooleanField();
 */
exports.BooleanField = BooleanField = new Class({
	inherits: ApiField
	,options:{
	   help:'Foces all values to either true of false'
	}
	,convert: function convert( value ){
		return !!typecast( value );
	}
	,type: function type(){
		return 'boolean';
	}
});


/**
 * Description
 * @class module:tastypie/fields.DateField
 * @extends module:tastypie/fields.ApiField
 * @param {Object} options
 * @example var x = new tastypie/fields.DateField();
 */
exports.DateField = DateField = new Class({
	inherits: ApiField
	,options:{
		format:'%F'
	   ,help:'Converts Date object to and from YYYY-MM-DD'
	}

	,convert: function convert( value ){
		if( !value ){
			return value;
		}

		if( isString( value ) ){
			var valid = value.match( DATE_REGEX );
			if( !valid ){
				throw new Error("Invalid Date String");
			}

			return new Date( valid[1], valid[2] ? valid[2]-1:valid[2] , valid[3]);
			
		}

		return value;
	}

	,dehydrate: function(obj, attr ){
		var value = this.parent('dehydrate', obj, attr )
		return strftime( value, this.options.format )
	}

	,hydrate: function( bundle ){
		var value, data;
		value = this.parent('hydrate', bundle );
		data = value.match( DATE_REGEX );
		return new Date( data[1], data[2], data[3] );
	}

	,type: function( ){
		return 'date';
	}
});

/**
 * Description
 * @class module:tastypie/fields.DateTimeField
 * @extends module:tastypie/fields.ApiField
 * @param {Object} options
 * @example var x = new tastypie/fields.DateTimeField();
 */
exports.DateTimeField = DateTimeField = new Class({
	inherits:ApiField
	,options:{
		format:'%Y-%m-%dT%M:%H:%S.%LZ'
	}

	,convert: function convert( value ){
		if( !value ){
			return value;
		}

		if( isString( value ) ){
			var valid = value.match( DATETIME_REGEX );
			if( !valid ){
				throw new Error("Invalid Date String");
			}

			return new Date( valid[1], valid[2], valid[3], valid[4], valid[5], valid[ 6]);
			
		}

		return value;
	}
	,dehydrate: function( obj, attr ){
		var value = this.parent('dehydrate', obj, attr );
		return strftime( value, this.options.format)
	}
	,type: function( ){
		return 'datetime';
	}
});

/**
 * Description
 * @class module:tastypie/fields.ObjectField
 * @extends module:tastypie/fields.ApiField
 * @param {Object} options
 * @example var x = new tastypie/fields.ObjectField();
 */
exports.ObjectField = ObjectField = new Class({
	inherits:ApiField
	,options:{

	}

	,convert: function convert( value ){
		return value;
	}

	,type: function( ){
		return 'object';
	}
});

Object.defineProperties( exports,{
	field:{
		/**
		 * @readonly
		 * @name field
		 * @alias module:tastypie/fields.ApiField
		 * @memberof module:tastypie/fields
		 * @property {Field} field short cut for the {@link module:tastypie/fields.ApiField|ApiField} class
		 **/
		get: function(){
			return ApiField;
		}
	}
	, 'char':{
		/**
		 * @readonly
		 * @name char
		 * @alias module:tastypie/fields.CharField
		 * @memberof module:tastypie/fields
		 * @property {Field} char short cut for the {@link module:tastypie/fields.CharField|CharField} class
		 **/
		get:function( ){
			return CharField;
		}
	}
	, character:{
		/**
		 * @readonly
		 * @name character
		 * @alias module:tastypie/fields.CharField
		 * @memberof module:tastypie/fields
		 * @property {Field} character short cut for the {@link module:tastypie/fields.CharField|CharField} class
		 **/
		get:function( ){
			return CharField;
		}
	}

	, array:{
		/**
		 * @readonly
		 * @name array
		 * @alias module:tastypie/fields.ArrayField
		 * @memberof module:tastypie/fields
		 * @property {Field} array short cut for the {@link module:tastypie/fields.ArrayField|ArrayField} class
		 **/
		get: function( ){
			return ArrayField;
		}
	}

	, 'int':{
		/**
		 * @readonly
		 * @name int
		 * @alias module:tastypie/fields.IntegerField
		 * @memberof module:tastypie/fields
		 * @property {Field} int short cut for the {@link module:tastypie/fields.IntegerField|IntegerField} class
		 **/
		get: function( ){
			return IntegerField;
		}
	}
	, 'integer':{
		/**
		 * @readonly
		 * @name integer
		 * @alias module:tastypie/fields.IntegerField
		 * @memberof module:tastypie/fields
		 * @property {Field} integer short cut for the {@link module:tastypie/fields.IntegerField|IntegerField} class
		 **/
		get: function( ){
			return IntegerField;
		}
	}

	, 'float':{
		/**
		 * @readonly
		 * @name float
		 * @alias module:tastypie/fields.FloatField
		 * @memberof module:tastypie/fields
		 * @property {Field} float short cut for the {@link module:tastypie/fields.FloatField|FloatField} class
		 **/
		get: function( ){
			return FloatField;
		}
	}

	, 'bool':{
		/**
		 * @readonly
		 * @name bool
		 * @alias module:tastypie/fields.BooleanField
		 * @memberof module:tastypie/fields
		 * @property {Field} bool short cut for the {@link module:tastypie/fields.BooleanField|BooleanField} class
		 **/
		get: function( ){
			return BooleanField;
		}
	}

	, 'boolean':{
		/**
		 * @readonly
		 * @name boolean
		 * @alias module:tastypie/fields.BooleanField
		 * @memberof module:tastypie/fields
		 * @property {Field} boolean short cut for the {@link module:tastypie/fields.BooleanField|BooleanField} class
		 **/
		get: function( ){
			return BooleanField;
		}
	}

	, 'date':{
		/**
		 * @readonly
		 * @name date
		 * @alias module:tastypie/fields.DateField
		 * @memberof module:tastypie/fields
		 * @property {Field} date short cut for the {@link module:tastypie/fields.DateField|DateField} class
		 **/
		get: function( ){
			return DateField;
		}
	}

	, 'datetime':{
		/**
		 * @readonly
		 * @name datetime
		 * @alias module:tastypie/fields.DateTimeField
		 * @memberof module:tastypie/fields
		 * @property {Field} datetime short cut for the {@link module:tastypie/fields.DateTimeField|DateTimeField} class
		 **/
		get: function( ){
			return DateTimeField;
		}
	}

	, 'object':{
		/**
		 * @readonly
		 * @name object
		 * @alias module:tastypie/fields.ObjectField
		 * @memberof module:tastypie/fields
		 * @property {Field} object short cut for the {@link module:tastypie/fields.ObjectField|ObjectField} class
		 **/
		get: function( ){
			return ObjectField;
		}
	}
});
