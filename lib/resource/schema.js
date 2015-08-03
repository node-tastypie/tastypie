
/*jshint laxcomma: true, smarttabs: true, node:true */
'use strict';
/**
 * Mixin class providing functionlity for building resource schemas
 * @module tastypie/lib/resource/schema
 * @author Eric Satterwhite
 * @since 1.0.1
 * @requires debug
 * @requires class
 * @requires class/options
 **/
var Class        = require('../class')
  , object       = require('mout/object')
  , get          = object.get
  , set          = object.set
  , EMPTY_OBJECT = {}
  , Schema
  ;

/**
 * @constructor
 * @alias module:tastypie/lib/resource/schema
 */
Schema = new Class({
    _schema_cache: null
	/**
	 * function used to generate a resource schema
	 * @method module:tastypie/lib/resource/schema#build_schema
	 * @return {Object} schema
	 **/	
	,build_schema: function( fields, options ){
		var that = this;
		var schema;
		options = options || this.options;

		if( !this._schema_cache ){
			schema = {
			    filtering: options.filtering || EMPTY_OBJECT
		      , ordering: options.ordering || []
			  , formats: Object.keys( options.serializer.options.content_types )
			  , limit: options.limit
			  , fields: object.map( this.fields, function( field ){
					return {
						'default'  : field.default
					  , 'type'     : field.type()
					  , 'nullable' : field.options.nullable
					  , 'blank'    : !!field.options.blank
					  , 'readonly' : !!field.options.readonly
					  , 'help'     : field.options.help
					  , 'unique'   : !!field.options.unique
					};
				})
			};

	
			this.routes && this.actions.forEach( function( action ){
				var allowed = 'allowed.'+action;
				set(
					schema,
					allowed,
					Object
						.keys( get( that.options, allowed ) ||  EMPTY_OBJECT) 
						.filter( function( method ){
							return !!get(that.options,allowed)[method];
					  	})
				);
			});
			this._schema_cache = schema;
		}
		return this._schema_cache;
	}
});

module.exports = Schema;
