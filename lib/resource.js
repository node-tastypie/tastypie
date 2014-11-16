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
  , qs               = require('querystring')                         // qs
  , express          = require('express')                    // express
  , merge            = require('mout/object/merge')          // merge
  , clone            = require('mout/lang/clone')            // clone
  , isFunction       = require('mout/lang/isFunction')
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
  , cache            = require('./cache')
  , fields           = require("./fields")
  , Resource
  ;

var EMPTY_OBJECT = {};

function to_json(){
	return (this.data || EMPTY_OBJECT)
};


/**
 * The base resource implementation providing hooks for extension
 * @class module:tastypie.resource.Resource
 * @param {Object} [meta] Meta data configuration
 * @param {String} [meta.callbackKey=callback] callback key to be used for jsop responsed
 * @param {String} [meta.defaultFormat='application/json'] the default serialziion format if one is not specified
 * @param {Serializer} [meta.serializer=serializer] an instance of a serializer to be used to translate data objects
 * @param {String} [meta.collection=data] the name of the key to be used lists of objects on list endpoints
 * @param {Paginator} [meta.paginator=paginator] a Paginator Class used to page large list
 * @param {Object} [meta.methodsAllowed] an object which maps HTTP method names to a boolean {get:true} This is used as a default for custom actions if non is defined
 * @param {Object} [meta.listMethodsAllowed=null] an object which maps HTTP method names to a boolean {get:true} This is used as a default for custom actions if non is defined
 * @param {Object} [meta.detailMethodsAllowed=null] an object which maps HTTP method names to a boolean {get:true} This is used as a default for custom actions if non is defined
 * @example var x = new NAME.Thing({});
 */
Resource = Class(/** @lends module:tastypie.resource.Resource.prototype */{
	inherits: events.EventEmitter
	,mixin:[ Meta, Parentize ]
	,meta: {
		name:null
		,apiname:null
		,defaultFormat:'application/json'
		,serializer: new serializer()
		,cache: new cache.Memory()
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
		this.domain = domain.create();
		// events.EventEmitter.call( this );
		this.setMeta( meta )
		this._uricache = null;
		var _router = new express.Router();
        this.domain.on('error', this.exception.bind( this ))
		Object.defineProperties(this,{
			router:{
				get:function(){
					return _router;
				}
			}
		});

		this.routes.forEach(function( url ){
			_router.all( url.route, url.handler );
		});


		if( !this.meta.listMethodsAllowed ){
			this.meta.listMethodsAllowed = clone( this.meta.methodsAllowed );
		}

		if( !this.meta.detailMethodsAllowed ){
			this.meta.detailMethodsAllowed = clone( this.meta.methodsAllowed );
		}



		var _fields = clone( this.constructor.parent.fields || EMPTY_OBJECT );
		debugger;
		_fields = merge( _fields, this.fields )
		Object
			.keys( _fields )
			.forEach(function( key ){
				var fieldopt = _fields[key]
				if( fieldopt.type && fields[ fieldopt.type ] ){
					fieldopt.attribute = fieldopt.attribute || key;
					_fields[key] = new fields[fieldopt.type]( fieldopt );
				} else {
					fieldopt.meta.attribute = fieldopt.meta.attribute || key 
					_fields[ key ] = fieldopt;
				}
				_fields[key].augment( this, key );

				Object.defineProperty( this, key,{
					get: function(){
						return _fields[ key ]
					}
				})  
			}.bind( this ))

		this.fields = _fields;

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
	, check: function check( method, allowed ){
		allowed = allowed || {};
		method = method.toLowerCase();

		return !!allowed[method];
	}
	/**
	 * Primary entry point for a request into the resource. maps Http methods to resource methods
	 * @method module:tastypie.resources.Resource#dispatch
	 * @param {String} action the resource action to route the request to
	 * @param {Object|Bundle} bundle A bundle representing the current request
	 **/
	,dispatch: function dispatch( action, bundle ){
		var httpmethod
		  , requestmethod
		  , methodsallowed
		  , canDispatch
		  , method
		  , meta
		  , req
		  , res
		  , next


		req            = bundle.req
		res            = bundle.res
		next           = bundle.next 
		meta           = this.meta
		requestmethod  = (req.headers['x-method-override'] || req.method).toLowerCase()
		httpmethod     = util.format("%s_%s", requestmethod, action );
		method         = this[ httpmethod ];
		methodsallowed = meta[ util.format('%sMethodsAllowed', action)] || {}
		canDispatch    = this.check( httpmethod, methodsallowed );
		if( !method ){
			var err = new exceptions.NotImplemented( util.format('%s for %s', httpmethod, req.uri) )
			err.req = req;
			err.res = res;
			return this.emit('error',  err );
		}



		debug('dispatching %s %s', httpmethod, action );
		//this.is_authenticated( bundle )
		this.domain.run( method.bind( this, bundle) )
	}

	/**
	 * disaptches a list request operating on a collection of objects
	 * @method module:tastypie.resources.Resource#dispatch_list
	 * @param {Request} req An express request object
	 * @param {Response} rep An express response object
	 * @param {Function} next An express next callback
	 **/
	,dispatch_list: function list(req, res, next){

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
			to_be_serialize[ this.meta.collection ] = to_be_serialize[ this.meta.collection ].map( function( item ){
				return that.full_dehydrate( item )
			});
			bundle.data = to_be_serialize
			return this.respond( bundle )
		}.bind( this ));
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME ...
	 * @param {TYPE} NAME ...
	 * @return {TYPE} DESCRIPTION
	 **/
	,post_list: function post_list( bundle ){

		this.deserialize( bundle.req.body, bundle.req.headers['content-type'], function( err, data ){
			bundle.data = data
			return this.respond( bundle );
		}.bind( this ) );
	}


	// TODO: remove implementation. just for debugging. Should not be implemented
	// be default
	,_get_list: function _get_list( bundle, callback ){
		var e = new exceptions.NotImplemented("_get_list is not implemented")
		e.req = bundle.req
		e.res = bundle.res
		e.next = bundle.next
		this.emit('error',  e)
		throw e;
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

	,get_detail: function get_detail( bundle ){

		this._from_cache('detail', bundle, function(err, data){
			bundle = this.bundle(bundle.req, bundle.res, bundle.next, data )
			return this.respond( bundle )
		}.bind( this ))
	}


	,_from_cache:function _from_cache( type, bundle, callback ){
		var key = this.cacheKey(
			type
			,bundle.req.api_name
			,bundle.req.uri
			,bundle.req.method
			,this.meta.name
			,bundle.req.query
			,bundle.req.params
		)
		var obj = this.meta.cache.get(key, function(err, obj ){

			var that = this;
			if( obj ){
				console.log("CACHE HIT! %s", key)
				return callback( err, obj )
			}

			this.get_object( bundle, function( err, obj ){
				that.meta.cache.set( key, obj )
				callback( err, obj )
			});
		}.bind( this ))
		
	}

	,get_object: function get_object( bundle ){
		var e = new exceptions.NotImplemented("get_object is not implemented")
		e.req = bundle.req
		e.res = bundle.res
		e.next = bundle.next
		this.emit('error',  e)
	}
	,update_object: function update_object( bundle ){
		var e = new exceptions.NotImplemented("update_object")
		e.req = bundle.req
		e.res = bundle.res
		e.next = bundle.next
		this.emit('error',  e)

	}

	,cacheKey: function cacheKey( type, api, uri, method, resource, query ){
		return util.format(
			"%s:%s:%s:%s:%s:%s"
			,type
			,api
			,uri
			,method.toLowerCase()
			,resource
			,qs.stringify( query || EMPTY_OBJECT )
		)
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
	 * @method module:tastypie.resources.Resource#full_dehydrate
	 * @param {Object} obj an object to dehydrate object
	 * @return Object An object containing only serializable data
	 **/
	,full_dehydrate: function( obj ){
		var _obj = {};
		for( var field in this.fields ){
			_obj[ field ] = this.fields[ field ].dehydrate( obj )

			var methodname = 'dehydrate_' + field;
			var method = this[ methodname ]

			if( method ){
				_obj[field] = method ( obj )
			}
		}

		_obj = this.dehydrate( _obj )
		return _obj;
	}
	,dehydrate: function dehydrate( obj ){
		return obj
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
		cls = cls || http.ok;
		var format = this.format( bundle, this.meta.serializer.types );


		this.serialize( bundle.data, format, bundle.req.query, function(err, data ){
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
		cls = cls || http.badRequest;
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

	,exception: function exception( err ){
		var req = err.req
		var res = err.res;
		var format;
		
		
		if( !res ){
			throw err;
		}

		format = this.format( err, this.meta.serializer.types );
		err.req = err.res = undefined;

		this.serialize( {name:err.name, message:err.message, code:err.code||500}, format, EMPTY_OBJECT, function(serr, data ){
			res
				.status(err.code ||500)
				.header('Content-Type', format)
				.send( data );
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
	,serialize: function serialize( data, format, options, callback ){
		this.meta.serializer.serialize(
			data
		  , format
		  , options || EMPTY_OBJECT
		  , callback
		);
	}

	,deserialize: function deserialize( data, format, callback ){
		this.meta.serializer.deserialize(
			data
		  , format
		  , callback
		);
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

	,filter: function filter( bundle, filters ){
		this.emit('error', new exceptions.NotImplemented("filter") )
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

Resource.defineMutator = Class.defineMutator;

module.exports = Resource;

