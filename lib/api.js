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
var  Class = require( './class' ) // this is Class
   , mout = require( 'mout' ) // custom mout
   , getRawBody = require("raw-body")
   , Meta = require( './class/meta' )
   , debug = require('debug')('tastypie:api')
   , util = require('util')
   , path = require('path')
   , startsWithSlash = /^\//
   , endsWithSlash = /\/$/
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
	}
	,constructor: function( path, app ){
		// this.setMeta( app.settings.api )
		this.app = app;
		this.basepath = this.normalizePath( path );
		this.baseexp = new RegExp( "^" + this.basepath )
		this.app.all( 
			this.basepath + "/:resource"
			,function( req, res, next ){
				getRawBody( req, {
					encoding:'utf8'
				}, function( err, text ){

					if( err ){
						return next( err )
					}

					req.body = text
					return next()
				});
			}
			, this.handler.bind( this ) 
		);
		
		this.api_cache = [];

		// defines a quick url look up per API object
		// it is cached on first call until another
		// resource is registered
		Object.defineProperties(this,{
			urls:{
				get: function(){
					var route;
					if( !this.api_cache.length ){
						for( var x=0; x<this.app._router.stack.length; x++ ){
							route = this.app._router.stack[x].route
							debug( route )
							if( route && this.baseexp.test( route.path )) {
								this.api_cache.push( this.app._router.stack[x].route.path )
							}
						}
					}
					return this.api_cache;
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
		 	resource.setMeta({name:prefix } );
	 	}
		this.app.use( this.basepath + '/' + prefix, resource.router );
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
