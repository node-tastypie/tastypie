/*jshint laxcomma:true, smarttabs: true */
'use strict';
/**
 * DESCRIPTION
 * @module NAME
 * @author Eric Satterwhite
 * @requires Class
 * @requires module:class/meeta
 * @requires mout
 **/
var  Class           = require( './class' ) // this is Class
   , array           = require( 'mout/array' ) // custom mout
   , clone           = require( 'mout/lang/clone' ) // custom mout
   , toArray         = require( 'mout/lang/toArray' ) // custom mout
   , Meta            = require( './class/meta' )
   , getRawBody      = require("raw-body")
   , debug           = require('debug')('tastypie:api')
   , util            = require('util')
   , path            = require('path')
   , startsWithSlash = /^\//
   , endsWithSlash   = /\/$/
   , trailingSlashes = /^\/|\/$/g
   , Api
   ;
/**
 * Class which maps a url prefix to an API resource
 * @class module:NAME.Api
 * @param {TYPE} NAME DESCRIPTION
 * @example var x = new NAME.Api({});
 */
Api = Class( /** @lends module:NAME.Api.prototype */{
	mixin: Meta
	,meta:{
		DEFAULT_LIMIT:20
		,MAX_LIMIT:500
		,middleware : null
	}
	,constructor: function( path, app, meta ){
		// this.setMeta( app.settings.api )
		this.app = app;
		this.basepath = this.normalizePath( path );
		this.baseexp = new RegExp( "^" + this.basepath )
		this.setMeta( meta )
		var middleware = clone( toArray( this.meta.middleware ) );

		middleware
			.unshift
			.apply( 
				middleware
				, [
					this.basepath + "/*"
					,function( req, res, next ){
						getRawBody(req,{
							encoding:'utf8'
						}, function(err, text ){
							if( err ){
								return next( err )
							}

							req.body = text;
							return next();
						});
					}
					, this.handler.bind( this ) 
				]
			)

		this.app.all.apply( this.app, middleware );
		
		this.api_cache = {};
		this.url_cache = []
		// defines a quick url look up per API object
		// it is cached on first call until another
		// resource is registered
		Object.defineProperties(this,{
			urls:{
				get: function(){
					var route;
					if( !this.url_cache.length ){
						for( var key in this.api_cache ){
							this.url_cache.push.apply( 
								this.url_cache, 
								this.api_cache[ key ].routes 
							)
						}
					}
					return this.url_cache;
				}
			}
		})
	}

	/**
	 * This does someApi
	 * @param {TYPE} name DESCRPTION
	 * @param {TYPE} name DESCRIPTION
	 * @returns {TYPE} DESCRIPTION
	 */ 
	 ,register: function(/*prefix, resource*/){
	 	var prefix, router, resource
	 	if( arguments.length == 1){
	 		resource = arguments[0]
	 		prefix   = arguments[0].meta.name || ''
		 	prefix   = prefix.replace(endsWithSlash,'');
	 	} else {
	 		resource = arguments[1];
	 		prefix   = arguments[0];
		 	prefix   = prefix.replace(endsWithSlash,'');
		 	resource.setMeta({
		 		name:prefix
		 		,apiname: this.basepath 
		 	} );
	 	}
	 	this.api_cache[ prefix ] = resource
		this.app.use( this.basepath + '/' + prefix, resource.router );
		this.url_cache = [];
	 	return this;

	 }
	/**
	 * This does someApi
	 * @param {TYPE} name DESCRPTION
	 * @param {TYPE} name DESCRIPTION
	 * @returns {TYPE} DESCRIPTION
	 */ 
	 ,toUri: function( prefix) {
	 	prefix = prefix.replace(trailingSlashes,"")
	 	return this.basepath + "/:" + prefix + "/*"
	 }

	/**
	 * Normalizes a uri path by stripping trailing or adding leading slashed acordingly
	 * @param {String} path The path to normalize
	 * @param {TYPE} name DESCRIPTION
	 * @returns {String} The newly formated path
	 */ 
	 ,normalizePath: function( path ){
		return util.format( 
			'/%s'
			, path.replace(trailingSlashes,'')
		)
	 }

	 ,handler: function( req, res, next ){
		req.uri = req.path.replace(endsWithSlash, '' );
		req.api_name = this.basepath
	 	next();
	 }
});
 
module.exports = Api;
