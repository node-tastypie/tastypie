/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * Built-in validator classes for tastypie resources
 * @module tastypie/lib/validators
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires tastypie/lib/class
 */

var Class = require( './class' )
  , Options = require('./class/options')
  , Parent = require('./class/parent')
  , Validator
  ;

/**
 * Description
 * @class module:validators.js.Thing
 * @param {TYPE} param
 * @example var x = new validators.js.THING();
 */

exports.Validator = 
Validator = new Class({
	mixin:[ Options, Parent ]
	, options:{
		validator: null
	}

	, constructor: function( options ){
		this.setOptions( options )
	}

	, validate: function( data, cb ){
		process.nextTick(function(){
			return cb && cb( null, true );
		});
	}
  
});


exports.FormValidator =
FormValidator = new Class({
	inherit: Validator
  , validate: function( data, cb ){
		process.nextTick(function(data, cb ){
			var form = this.options.validator.bind( data );

			form.validate(function( err, bound ){
				var valid, errors, fld
				if( err ){
					return cb&& cb(err,null);
				}

				valid = bound.isValid()
				if( !valid ){
					errors = {}
					for(var key in bound.fields){
						fld = bound.fields[ key ]
						errors[ key ] = fld.error || undefined
					}
				}
				callback( errors, valid );
			});
		})
	}
});


exports.JoiValidator =
JoiValidator = new Class({
	inherit: Validator
	,  validate: function( data, cb ){
		process.nextTick(function(){
			var result = this.options.validator.validate( data );
			return cb && cb( result.error, result.value )
		})	
	}
});
