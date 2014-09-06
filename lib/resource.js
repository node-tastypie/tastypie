'use strict';
/**
 * Holds common exception classes
 * @module module:lib/resource
 * @author Eric Satterwhite
 * @requires module:class
 * @requires module:class/meta
 * @since 0.1.0
 **/
var Class  = require('./class')
  , path   = require('path')
  , Meta   = require('./class/meta')
  , events = require('events')
  , util = require('util')
  , exceptions = require('./exceptions')
  , merge  = require('mout/object/merge')
  , clone  = require('mout/object/clone')
  , interpolate = require('mout/string/interpolate')
  , serializer = require('./serializer')
  , express = require('express')
  , debug = require('debug')('tastypie:resource')
  , Resource
  ;

Resource = Class({
	inherits:events.EventEmitter 
	,mixin:[ Meta ]

	,meta: {
		resourceName:null
		,serializer: new serializer()
		,methodsAllowed:{
			get:true
			,put:true
			,post:true
			,"delete":true
			,patch:true
			,head:true
			,options:true
		}

		,listMethodsAllowed:null
		,detailMethodsAllowed:null

	}

	,constructor: function( meta ){
		this.setMeta( meta )
		events.EventEmitter.call( this );
		this._uricache = null;
		var _router = new express.Router();

		Object.defineProperties(this,{
			router:{
				get:function(){
					return _router;
				}
			}
		})

		this.routes.forEach(function( url ){
			_router.all( url.route, url.handler )
		}.bind( this ))

		if( !this.meta.listMethods ){
			this.meta.listMethods = clone( this.meta.methodsAllowed )
		}

		if( !this.meta.listMethods ){
			this.meta.detailMethods = clone( this.meta.methodsAllowed )
		}
	}


	,base_urls: function base_urls(){
		var that = this;	
		return [{
			route:path.resolve(interpolate("/schema", that.meta))
		  , handler: that.get_scheama.bind( that )
		}
		,{
			route: path.resolve(interpolate("/:id", that.meta))
		  , handler:that.dispatch_detail.bind( that )
		}
		,{
			route: path.resolve(interpolate("/",that.meta))
		  , handler: that.dispatch_list.bind( that )
		}];
	}

	,dispatch: function dispatch( action, req, res, next ){
		var methodname
		  , requestmethod
		  , methodsllowed
		  , canDispatch
		  , method
		  , meta 

		meta           = this.meta
		requestmethod  = req.method.toLowerCase()
		methodname     = util.format("%s_%s", requestmethod, action );
		method         = this[ methodname ];
		methodsallowed = meta[ util.format('%sMethodsAllows', action)] || {}
		canDispatch    = methodsallowed[ requestmethod ]

		if( !method ){
			return this.error(exceptions.NotImplemented, req, res )
		}

		this.is_authenticated( req, res, next )
		method.call( this, req, res, function(err, data ){
			if( err ){
				return this.error()
			}

			this.respond( null, data, req, res )
			
		})
	}

	,dispatch_list: function list(req, res, next){
		debug('dispatching %s list', req.method);
		return this.dispatch('list', req, res, next )
	}
	,dispatch_detail: function detail(){}

	,get_schema: function schema(){}

	,prepend_urls: function( ){
		return [];
	}

	,respond: function respond( status, data, req, res){
		var format = this.format( req )
		
		this.meta.serializer.serialize( data, format, function( e, content ){

		});
	}

});

Object.defineProperties( Resource.prototype,{
	routes:{
		get: function( ) {
			if( !this._uricache ){
				this._uricache = ( this.prepend_urls() || [] ).concat( this.base_urls() )
			}
			return this._uricache;
		}
	}

	,urls: {
		get: function( ){
			return  this.routes.map( function( uri ){
				return uri.route
			})
		}
	}
})


module.exports = Resource;
