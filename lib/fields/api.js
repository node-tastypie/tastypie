/*jshint laxcomma: true, smarttabs: true, node: true, unused: true*/
'use strict';
/**
 * resource field definitions
 * @module tastypie/fields/api
 * @author Eric Satterwhite
 * @since 0.0.1
 * @requires events
 * @requires path
 * @requires util
 * @requires prime-util/prime/parentize
 * @requires mout/lang/isFunction
 * @requires mout/lang/isString
 * @requires mout/lang/kindOf
 * @requires mout/date/strftime
 * @requires mout/object/get
 * @requires tastypie/lib/class
 * @requires tastypie/lib/class/options
 */

var events         = require( 'events' )
  , util           = require( 'util' )
  , boom           = require( 'boom' )
  , Parent         = require( 'prime-util/prime/parentize' )
  , get            = require( 'mout/object/get' )
  , isString       = require( 'mout/lang/isString' )
  , isFunction     = require( 'mout/lang/isFunction' )
  , Class          = require( '../class' )
  , Options        = require( '../class/options' )
  , STRING         = 'string'
  , FUNCTION       = 'function'
  , ApiField
  ;

/**
 * Base field providing generic functionality around value serialization / deserialization
 * @constructor
 * @alias module:tastypie/fields/api
 * @param {Object} options
 * @param {Boolean} [options.readonly=false] Vales will be omitted during the hydration cycle
 * @param {Boolean} [options.nullable=false] true of the field should allow for a null vlaue
 * @param {?String|Function} [options.attribute=null] A name path or function to be used to extract values during dehydration
 * @param {String} [options.name=null] The name of the field. This is automatically set when added to a resource
 * @param {String} [options.help=A general no-op field] Help text to include in the schema defintion for this field
 * @param {!Mixed} [options.default=null] A default value for the field to fill in if none is provided
 * @mixes module:tastypie/lib/class/options 
 * @mixes module:tastypie/lib/class/parent
 * @example var x = new tastypie/fields.ApiField();
 */
ApiField = new Class({
	inherits: events.EventEmitter
    , mixin:[ Parent, Options ]
    , options:{
		'readonly'  : false
	  , 'nullable'  : false
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
	 * @method module:tastypie/fields/api#type
	 * @return {String} internal data type
	 **/
	, type: function( ){
		return 'string';
	}
	
	/**
	 * Converts data value into the serialization specific type.
	 * @method module:tastypie/fields/api#convert
	 * @param {Mixed} val value to convert
	 * @returns {Mixed} value
	 **/
	, convert: function convert( val ){
		return val;
	}

	/**
	 * Converts a serialized value in to a javascript object value
	 * @method module:tastypie/fields/api#hydrate
	 * @param {Bundle} bundle
	 **/
	, hydrate: function hydrate( bundle, cb ){
		var name = this.options.name
		  , attr = this.options.attribute
		  , obj  = bundle.object
		  ;

		// if readonly, don't care!
		if( this.options.readonly ){
			return cb && cb( null );
		}

		// if there is a value in data, return it.
		if( bundle.data.hasOwnProperty( name ) ){
			return cb && cb( null, bundle.data[ name ] );
		}

		// if bundle data doesn't have a matching property.
		// look for one.
		// NOTE: we can't use hasOwnProperty here because we care inherited properties
		if( attr && attr in obj ){
			return cb && cb( null, obj[ attr ] );
		} else if ( name && name in obj ){
			return cb && cb( null, obj[ name ] );
		}else if( this.options.default ){
			return cb && cb( null, isFunction( this.default ) ? this.default() : this.default );
		} else if( this.options.nullable ){
			return cb && cb( null, null );
		} else {
			this.emit('error', boom.create(400, util.format( "Field %s has no data, default value and is not nullable ", this.options.name) ));
		}			
	}

	/**
	 * Converts a javascript object / value into something sutable for seriaation. ex. Date formatting 
	 * @method module:tastypie/fields/api#dehydrate
	 * @param {Object} object Object to dehydrate before serialization
	 * @param {Sting|Function} attribute a name path or function to use to retrieve a value from the object
	 * @return {Mixed} value object value converted to its internal type
	 **/
	, dehydrate: function dehydrate( obj, cb ){
		var current, attribute;
		attribute = this.options.attribute;

		if( typeof attribute === STRING ){
			current = get( obj, attribute );
			if( current == null ){
				if( this.options.default ){
					current = this.options.default; 
				} else if( this.options.nullable ){
					current = null;
				}
			}
			current = typeof current === FUNCTION ? current() : current;
		} else if( typeof attribute === FUNCTION ){
			current = attribute();
		}
		return cb && cb( null, this.convert( current ) );
	}

	/**
	 * Injects dynamic properties onto field instance for later use
	 * @protected
	 * @method module:tastypie/fields/api#augment
	 * @param {Resource} resource the resource instance this field is attached to
	 * @param {String} name The property name this field is associated to
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

module.exports = ApiField;
