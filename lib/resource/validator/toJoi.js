/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * Module for converting mongoose schemas into joi validation objects
 * @module tastypie/lib/resource/validator/toJoi
 * @author Eric satterwhite
 * @since 0.1.0
 * @requires joi
 * @requires mout/typeOf
 * @requires mout/string
 * @requires mout/object
 */
var joi      = require('joi')
  , kindOf   = require('mout/lang/kindOf')
  , set      = require('mout/object/set')
  , values   = require('mout/object/values')
  , isNumber = require('mout/lang/isNumber')
  , clone    = require('mout/lang/clone')
  , debug    = require('debug')('tastypie:resource:toJoi')
  , object_id = require('./oid')
  ;


function typeOf( obj ){
  return kindOf( obj ).toLowerCase();
}

function defaults( validator, config ){
	validator = config.options.required ? validator.required( ) : validator;
	validator = config.hasOwnProperty( 'default' ) ? validator.default( config.default() ) : validator;
	return validator
};

/**
 * Holds internal schema converters for joi
 * @protected
 * @namespace module:tastypie/lib/resource/validator/toJoi.converters
 * @memberof module:tastypie/lib/resource/validator/toJoi
 **/
var converters = {
	/**
	 * Converts a mongoos string field to joi string validator
	 * @method module:tastypie/lib/resource/toJoi.converters#from_strin#rom_string
	 * @param {String} type The internal field type to convert
	 * @param {Object} config The mongoose schema field configuration
	 * @return {Object} Joi tring validation object
	 **/
	from_string: function from_string( type, config ){
		var validator = joi.string();
		if( config.options.enum ){
			validator = validator.valid( config.options.enum );
		} else {
			validator = config.options.lowercase ? validator.lowercase() : validator;
			validator = config.options.uppercase ? validator.uppercase() : validator;
		}

		validator = typeOf( config.options.validate ) == 'regexp' ? validator.regex( config.options.validate ) : validator
		return defaults( validator, config );
	}

	/**
	 * converts a mongoose object field to a joi object validator
	 * @method module:tastypie/lib/resource/validator/toJoi.converters#from_object
	 * @param {String} type The internal field type to convert
	 * @param {Object} config The mongoose schema field configuration
	 * @return {Object} Joi object validation object
	 **/
	,from_object: function from_object( type, config ){
		return defaults( joi.object(), config );

	}

	/**
	 * converts a mongoose boolean field to a joi boolean validator
	 * @method module:tastypie/lib/resource/validator/toJoi.converters#from_boolean
	 * @param {String} type The internal field type to convert
	 * @param {Object} config The mongoose schema field configuration
	 * @return {Object} Joi boolean validation object
	 **/
	,from_boolean: function from_boolean( type, config ){
		return defaults( joi.boolean(), config );
	}

	/**
	 * converts a mongoose number field to a joi number validator
	 * @method module:tastypie/lib/resource/validator/toJoi.converters#from_number
	 * @param {String} type The internal field type to convert
	 * @param {Object} config The mongoose schema field configuration
	 * @return {Object} Joi number validation object
	 **/
	,from_number: function from_number( type, config ){
		var validator = joi.number();
		validator = isNumber( config.options.min ) ? validator.min( config.options.min ) : validator;
		validator = isNumber( config.options.max ) ? validator.max( config.options.max ) : validator;
		return defaults( validator, config );
	}

	/**
	 * converts a mongoose buffer field to a joi buffer validator
	 * @method module:tastypie/lib/resource/validator/toJoi.converters#from_buffer
	 * @param {String} type The internal field type to convert
	 * @param {Object} config The mongoose schema field configuration
	 * @return {Object} Joi buffer validation object
	 **/
	,from_buffer: function from_buffer( type, config ){
		return defaults( joi.binary(), config );
	}
	/**
	 * converts a mongoose array field to a joi array validator
	 * @method module:tastypie/lib/resource/validator/toJoi.converters#from_array
	 * @param {String} type The internal field type to convert
	 * @param {Object} config The mongoose schema field configuration
	 * @return {Object} Joi array validation object
	 **/
	,from_array: function from_array( type, config ){
		return defaults( joi.array(), config );

	}

	/**
	 * converts a mongoose default field to a joi default validator
	 * @method module:tastypie/lib/resource/validator/toJoi.converters#from_default
	 * @param {String} type The internal field type to convert
	 * @param {Object} config The mongoose schema field configuration
	 * @return {Object} Joi default validation object
	 **/
	,from_default: function from_default( type, config ){
		return defaults( joi.any(), config );

	}
};

function convert( type, config ){
	var name = 'from_' + type;
	var method = converters[ name ] ? converters[name] : converters['from_default']
	return method( type, config );
};

/**
 * Given and mongoose schema, will return a Joi validation instance
 * @function
 * @alias module:tastypie/lib/resource/validator/toJoi
 * @param {Schema} schema A mongoose schema instance
 * @return {Object} joi validation instance configured for the matching schema
 **/
module.exports = function toJoi( schema, forceOptional ){
	var joischema = {}
	var nested = schema.nested
	// set up nested objects
	Object
		.keys( nested )
		.forEach(function( key ){
			set( joischema, key, joi.object().unknown( false ))
		});

	schema.eachPath(function(name, config ){
		config = clone( config )
		var type = config.instance ? config.instance.toLowerCase() : typeOf(config.options.type)

		if( name.indexOf( '.' ) >= 0 ){
			var bits = name.split( '.' )
			var current = bits.shift()
			var obj = joischema[ current ];

			var _schema = {};
			_schema[ bits.shift() ] = type=='objectid' ? object_id.clone() : convert( type, config )
			joischema[current] = obj.keys( _schema )
		} else {
			config.options.required = forceOptional ? false : config.options.required
			joischema[name] = convert( type, config, forceOptional )
		}
	});
	return joi.compile( joischema );
}
