'use strict';
/**
 * Provides the base resource for defining expressive APIs, handling serialization, deserialization, validation,
 * caching, throttling and error handling
 * @module module:lib/resource
 * @author Eric Satterwhite
 * @requires module:class
 * @requires module:class/meta
 * @since 0.1.0
 * @requires domain
 * @requires events
 * @requires util
 * @requires fs
 * @requires express
 * @requires debug
 * @requires module:mout/object/merge
 * @requires module:mout/lang/clone
 * @requires module:mout/string/interpolate
 * @requires module:prime-util/prime/Parentize
 * @requires module:tastypie/Class
 * @requires module:tastypie/http
 * @requires module:tastypie/mime
 * @requires module:tastypie/paginator
 * @requires module:tastypie/Meta
 * @requires module:tastypie/exceptions
 * @requires module:tastypie/serializer
 **/
var path             = require('path')                       // path
  , domain           = require('domain')                     // domain
  , events           = require('events')                     // events
  , util             = require('util')                       // util
  , fs               = require('fs')                         // fs
  , express          = require('express')                    // express
  , merge            = require('mout/object/merge')          // merge
  , clone            = require('mout/lang/clone')            // clone
  , interpolate      = require('mout/string/interpolate')    // interpolate
  , Parentize        = require('prime-util/prime/parentize')
  , debug            = require('debug')('tastypie:resource') // debug
  , Class            = require('./class')                    // Class
  , http             = require('./http')                     // http
  , mime             = require('./mime')                     // mime
  , paginator        = require('./paginator')                // paginator
  , Meta             = require('./class/meta')               // Meta
  , exceptions       = require('./exceptions')               // exceptions
  , serializer       = require('./serializer')               // serializer
  , Resource
  ;

var EMPTY_OBJECT = {};

function to_json(){
	return (this.data || EMPTY_OBJECT)
}

/**
 * The base resource implementation providing hooks for extension
 * @class module:tastypie.resource.Resource
 * @param {Object} [meta] Meta data configuration
 * @param {String} [meta.callbackKey=callback] callback key to be used for jsop responsed
 * @param {String} [meta.defaultFormat='application/json'] the default serialziion format if one is not specified
 * @example var x = new NAME.Thing({});
 */
Resource = Class(/** @lends module:tastypie.resource.Resource.prototype */{
	mixin:[ Meta, events.EventEmitter, Parentize  ]
	,meta: {
		resourceName:null
		,defaultFormat:'application/json'
		,serializer: new serializer()
		,collection:'data'
	    ,paginator:paginator
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
	 * defines the base urls for this resource
	 * @method module:tastypie.resources.Resource#base_urls
	 * @return Array. And array of objects containing a route and handler
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
	 * @method module:tastypie.resources.Resource#dispatch
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
	 * disaptches a list request operating on a collection of objects
	 * @method module:tastypie.resources.Resource#dispatch_list
	 * @param {Request} req An express request object
	 * @param {Response} rep An express response object
	 * @param {Function} next An express next callback
	 **/
	,dispatch_list: function list(req, res, next){
		debug('dispatching %s list', req.method);

		return this.dispatch('list', this.bundle( req, res, next ) )
	}

	// TODO: remove implementation, this is for debugging purposes
    ,get_list: function get_list( bundle ){
		
		this._get_list( bundle,function( e, objects ){
			var that = this;
			objects = objects || [];
			objects = this.sort( JSON.parse(objects) );
			var paginator = new this.meta.paginator({
				limit:25
				,req:bundle.req
				,res:bundle.res
				,collectionName:this.meta.collection
				,objects:objects
			});
			var to_be_serialize = paginator.page();
			debug('to serialize', to_be_serialize)
			to_be_serialize[ this.meta.collection ] = to_be_serialize[ this.meta.collection ].map( function( item ){
				return that.full_dehydrate( item ) 
			});
			bundle.data = to_be_serialize
			return this.respond( bundle )
		}.bind( this ));
	}

	// TODO: remove implementation. just for debugging. Should not be implemented
	// be default
	,_get_list: function _get_list( bundle, callback ){
		return fs.readFile(path.resolve("./data.json"), 'utf8', callback )
	}

	/**
	 * Dispatches detail requests which operated on a sigular, specific object
	 * @method module:tastypie.resources.Resource#dispatch_detail
	 * @param {Request} req An express request object
	 * @param {Response} rep An express response object
	 * @param {Function} next An express next callback
	 **/
	,dispatch_detail: function detail( req, res, next ){
		debug('dispatching %s detail', req.method);

		return this.dispatch('detail', this.bundle( req, res, next ) )
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie.resources.Resource#get_schema
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
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
	 * A method which returns additaional urls to be added to the default uri defintion of a resource
	 * @method module:tastypie.resources.Resource#prepend_urls
	 * @return Array an empty array
	 **/
	,prepend_urls: function( ){
		return [];
	}

	/**
	 * A hook before serialization to converte and complex objects or classes into simple serializable objects
	 * @method module:tastypie.resources.Resource#full_deydrate
	 * @param {Object} obj an object to dehydrate object
	 * @return Object An object containing only serializable data
	 **/
	,full_dehydrate: function( obj ){
		return obj.toJSON ? obj.toJSON() : obj 
	}
	/**
	 * Method to generate a response for a bundled request. Will set contnent-type and length headers
	 * @chainable
	 * @method module:tastypie.resources.Resource#respond
	 * @param {Bundle|Object} bundle A bundle or similar object
	 * @param {HttpResponse|Function} cls An HttpResponse function to call to finish the request. Function should accept a response object, and data to send
	 * @return Resource
	 **/
	,respond: function respond( bundle, cls ){
		cls = cls || http.HttpResponse;
		var format = this.format( bundle, this.meta.serializer.types );


		this.serialize( bundle.data, format, function(err, data ){
			bundle.res.set('Content-Type', format);
			bundle.res.set('Content-Length', data.length);
			if( err ){
				bundle.data = err.message;
				return this.error( bundle, err );
			}
			cls( bundle.res, data );
		}.bind(this));	

		return this;
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie.resources.Resource#error
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,error: function error( bundle, err, cls ){
		cls = cls || http.BadRequest;
		var format = this.format( bundle.req, bundle.res, this.meta.serializer.types );

		this.serialize({
			status:400
			,msg:err.message
		}, format, function(err, data ){
			bundle.res.set('Content-Type', format);
			bundle.res.set('Content-Length', data.length);
			cls( bundle.res, data );
		}.bind(this));	

	
	}
	/**
	 * Attempts to determin the best serialization format for a given request
	 * @method module:tastypie.resources.Resource#format
	 * @param {Bundle|Object} bundle A bundle object or similar object
	 * @param {Array} [types] An array of possible content types this resource can deal with. 
	 * @return
	 **/
	,format: function format( bundle, types ){
		var fmt  = bundle.req.query && bundle.req.query.format
		var ct = this.meta.serializer.convertFormat( fmt )
		
		if(fmt && !ct ){
			bundle.res && bundle.res.status( 500 ).send( util.format('unsupported format %s', fmt ) )
			this.emit('error', new exceptions.UnsupportedFormat( fmt ) )	
		} else if( fmt && ct ){
			return ct;
		}
		
		return mime.determine( bundle.req, types )
	}

	/**
	 * Packages peices of the express request in a single object for easy passing
	 * @method module:tastypie.resources.Resource#bundle
	 * @param {Request} req An express request object
	 * @param {Response} rep An express response object
	 * @param {Function} next An express next callback
	 * @param {Object} [data={}] The data object to package 
	 * @return Object An object packaging important information about the current request
	 **/
	,bundle: function bundle( req, res, next, data ){
		return { req:req, res:res, data:data||{}, next:next, toJSON:to_json }
	}

	/**
	 * Converts a valid object in to a string of the specified format
	 * @method module:tastypie.resources.Resource#serialize
	 * @param {Object} data Data object to be serialized before delivery
	 * @param {String} format the 
	 * @param {Function} callback
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

	/**
	 * Applies custome sorting to a given list of objects. Default applies no sorting
	 * @method module:tastypie.resources.Resource#sort
	 * @param {Array} list The list of objects to be sorted
	 * @return Array of sorted objects
	 **/
	,sort: function sort( obj_list ){
		return obj_list;
	}
});
Object.defineProperties( Resource.prototype,{

	/**
	 * A mapping of uris and their associated handlers
	 * @method module:tastypie.resources.Resource#outes
	 * @type Object
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
	 * An array of all registered uris on a given resource
	 * @property module:tastypie.resources.Resource.urls
	 * @type Array
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
