'use strict';
/**
 * Holds common exception classes
 * @module module:lib/resource
 * @author Eric Satterwhite
 * @requires module:class
 * @requires module:class/meta
 * @since 0.1.0
 **/
var path        = require('path')                       // path
  , domain      = require('domain')						// domain
  , events      = require('events')                     // events
  , util        = require('util')                       // util
  , express     = require('express')                    // express
  , merge       = require('mout/object/merge')          // merge
  , clone       = require('mout/lang/clone')          // clone
  , interpolate = require('mout/string/interpolate')    // interpolate
  , Parentize   = require('prime-util/prime/parentize')
  , debug       = require('debug')('tastypie:resource') // debug
  , Class       = require('./class')                    // Class
  , http        = require('./http')                    // http
  , mime        = require('./mime')                    // mime
  , Meta        = require('./class/meta')               // Meta
  , exceptions  = require('./exceptions')               // exceptions
  , serializer  = require('./serializer')               // serializer
  , Resource
  ;

Resource = Class({
	mixin:[ Meta, events.EventEmitter, Parentize  ]
	,meta: {
		resourceName:null
		,defaultFormat:'application/json'
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

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,base_urls: function base_urls(){
		return [{
			route:path.resolve(interpolate("/schema", this.meta))
		  , handler: this.get_schema.bind( this )
		}
		,{
			route: path.resolve(interpolate("/:id", this.meta))
		  , handler:this.dispatch_detail.bind( this )
		}
		,{
			route: path.resolve(interpolate("/",this.meta))
		  , handler: this.dispatch_list.bind( this )
		}];
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,dispatch: function dispatch( action, bundle ){
		var methodname
		  , requestmethod
		  , methodsallowed
		  , canDispatch
		  , method
		  , meta
		  , req = bundle.req
		  , res = bundle.res
		  , next = bundle.next 

		meta           = this.meta
		requestmethod  = req.method.toLowerCase()
		methodname     = util.format("%s_%s", requestmethod, action );
		method         = this[ methodname ];
		methodsallowed = meta[ util.format('%sMethodsAllows', action)] || {}
		canDispatch    = methodsallowed[ requestmethod ]
		if( !method ){
			res.status(500).send(util.format('method %s %s not implemented', req.method, req.originalUrl) )
			this.emit('error', new exceptions.NotImplemented( util.format('method %s not implemented', methodname) ), req, res )
		}

		//this.is_authenticated( bundle )
		method.call( this, bundle, function(err, data ){
			if( err ){
				// return this.emit('error', err )
			}

			// this.respond( null, data, req, res )
			
		})
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,dispatch_list: function list(req, res, next){
		debug('dispatching %s list', req.method);

		return this.dispatch('list', this.bundle( req, res, next ) )
	}
    ,get_list: function( bundle ){
		bundle.data = {fake:'data'}
		return this.respond( bundle )
	}
	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,dispatch_detail: function detail( req, res, next ){
		debug('dispatching %s detail', req.method);

		return this.dispatch('detail', this.bundle( req, res, next ) )
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,get_schema: function schema(req, res, next ){
		this.meta.serializer.serialize({
			status:200
			,data:{}
			,meta:{}
		}, 'application/xml', function(err, d ){
			res.set('Content-Type', 'application/xml')
			res.status( 200 ).send( d )
		})
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,prepend_urls: function( ){
		return [];
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,respond: function respond( bundle, cls ){
		cls = cls || http.HttpResponse;
		var format = this.format( bundle.req, bundle.res, this.meta.serializer.types );


		this.serialize( bundle.data, format, function(err, data ){
			bundle.res.set('Content-Type', format);
			bundle.res.set('Content-Length', data.length);
			cls( bundle.res, data );
		});	
	}
	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,format: function format( req, res, types ){
		var f = req.query && req.query.format;
		var ct = this.meta.serializer.convertFormat( f )
		if(f && !ct ){
			res && res.status( 500 ).send( util.format('unsupported format %s', f ) )
			this.emit('error', new exceptions.UnsupportedFormat( f ) )	
		}
		return mime.determine( req, types )
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,bundle: function bundle( req, res, next ){
		return { req:req, res:res, data:null, next:next }
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,serialize: function serialize( data, format, callback ){
		this.meta.serializer.serialize(
			data
		  , format
		  , this.meta.serializer.types
		  , callback
		)
	}
});
Object.defineProperties( Resource.prototype,{

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	routes:{
		get: function( ) {
			if( !this._uricache ){
				this._uricache = ( this.prepend_urls() || [] ).concat( this.base_urls() )
			}
			return this._uricache;
		}
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,urls: {
		get: function( ){
			return  this.routes.map( function( uri ){
				return uri.route
			})
		}
	}
})


module.exports = Resource;
