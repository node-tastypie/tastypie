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
  , merge  = require('mout/object/merge')
  , interpolate = require('mout/string/interpolate')
  , express = require('express')
  , Resource
  ;

Resource = Class({
	inherits:events.EventEmitter 
	,mixin:[ Meta ]

	,meta: {
		resourceName:null
		,methods:{
			get:true
			,put:true
			,post:true
			,"delete":true
			,patch:true
			,head:true
			,options:true
		}
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

		this.urls.forEach(function( url ){
			_router.all( url, this.dispatch.bind( this ) )
		}.bind( this ))
	}

	,dispatch: function(req, res, next ){
		console.log('dispatch!', req.params)
		res.send(504,'NotImplemented')
	}

	,baseUrls: function(){
		var urls = {}
		urls[ path.resolve(interpolate("/{{resourceName}}/schema", this.meta))] = 'schema'
		urls[ path.resolve(interpolate("/{{resourceName}}/:id", this.meta))] = 'detail'
		urls[ path.resolve(interpolate("/{{resourceName}}",this.meta))] = 'list'
		return urls;
	}

	,prependUrls: function( ){
		return {}
	}

	,list: function list(){}
	,detail: function detail(){}
	,schema: function schema(){}
});

Object.defineProperties( Resource.prototype,{
	urls:{
		get: function( ){
			if( !this._uricache ){
				this._uricache = merge(
					{}
				  , this.prependUrls()
				  , this.baseUrls()
				)

			}
			return Object.keys(this._uricache);
		}
	}
})


module.exports = Resource;