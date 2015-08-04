
/*jshint laxcomma: true, smarttabs: true, node:true */
'use strict';
/**
 * Mixin class providing functionlity for building resource schemas
 * @module tastypie/lib/resource/schema
 * @author Eric Satterwhite
 * @since 1.0.1
 * @requires debug
 * @requires mout/object
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
 * @mixin
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
		var schema;

		options = options || this.options || EMPTY_OBJECT;
		fields = fields || this.fields || EMPTY_OBJECT;

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
						.keys( get( options, allowed ) ||  EMPTY_OBJECT) 
						.filter( function( method ){
							return !!get( options, allowed )[method];
					  	})
				);
			});
			this._schema_cache = schema;
		}
		return this._schema_cache;
	}

	/**
	 * Top level method for generating resource specific schemas for *GET* requests
	 * @method module:tastypie/lib/resource#get_schema
	 * @param {Request} request A Hapi.js request object
	 * @param {Function} reply A hapi.js reply function
	 **/
	, get_schema: function get_schema( req, res ){

		this.respond( this.bundle( req, res, this.build_schema( ) ) );
	}

});

module.exports = Schema;
