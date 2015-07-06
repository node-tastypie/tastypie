/*jshint laxcomma: true, smarttabs: true, node: true */
'use strict';
/**
 * rethink.js
 * @module rethink.js
 * @author 
 * @since 0.0.1
 * @requires util
 * @requires joi
 * @requires debug
 */

var util = require( 'util' )
  , joi = require( 'joi' )
  , debug = require( 'debug' )('tastypie:resource:rethink')
  , Class = require('../class')
  , Options = require('../class/options')
  , Resource = require('./index')
  , isNumber = require('mout/lang/isNumber')
  , toArray = require('mout/lang/toArray')
  , merge      = require('mout/object/merge')
  , http = require('../http')
  , orderExp   = /^(\-)?([\w]+)/
  , SEP        = '__'
  , RethinkResource
  ;


/**
 * Description
 * @alias module:tastypie/lib/resource/rethink
 * @param {Object} options
 * @example
var SampleResource = new Class({
	inherits:RethinkResource
	,options:{
		queryset: Sample.filter({})
	}
	,fields:{
		age:{type:'integer', null:true, attribute:'age'}
	}
});
 */
module.exports = RethinkResource = new Class({
	inherits:Resource
	,mixin:[Options]
	,options:{
		queryset:null
		,pk:'id'
		,objectTpl:null
		,max:1000
	}
	/**
	 * This does something
	 * @param {TYPE} name description
	 * @param {TYPE} name description
	 * @param {TYPE} name description
	 * @returns something
	 **/
	,constructor: function( options ){

		this.parent( 'constructor', options );

		this.options.objectTpl = this.options.objectTpl || this.options.queryset._model;
		var paths = Object.keys( this.fields || this.options.queryset._model._schema._schema )		
		this.allowablepaths = paths.filter(function(p){
			return p !== 'id'
		})

		paths = null;
	}

	, get_list: function get_list( bundle ){
		var query = this.options.queryset.filter({})
		  , filters
		  ;
		
		try{
			filters = this.buildFilters( bundle.req.query );
		} catch( err ){
			err.req = bundle.req;
			err.res = bundle.res;
			return this.emit('error', err);
		}

		query._model.count().run( function( err, count ){
			var that = this
			  , paginator
			  , to_be_serialized
			  ;
			query = query.filter( filters );
			query = this.offset( query, bundle );
			query = this.limit( query, bundle );
			query = this.sort( query, bundle.req.query );

			query.run( function( err, objects ){
				objects = objects || [];
				paginator = new that.options.paginator({
					limit:bundle.req.query.limit
					,req:bundle.req
					,res:bundle.res
					,collectionName:that.options.collection
					,objects:objects
					,count: count
					,offset: bundle.req.query.offset || 0
				});

				to_be_serialized = paginator.page();
				to_be_serialized[ that.options.collection ] = to_be_serialized[ that.options.collection ].map( function( item ){
					return that.full_dehydrate( item, bundle );
				});
				bundle.data = to_be_serialized;
				return that.respond( bundle );
			});
		}.bind( this ))
	}

	, delete_detail: function delete_detail( bundle ){
		var that = this;
		this.get_object(bundle, function( err, instance ){
			debug("get object");
			debugger;
			if( err ){
				err.req = bundle.req
				err.res = bundle.res
				return that.emit('error', err  )
			}

			if( !instance ){
				bundle.data = {message:'not found',code:404};
				return that.respond(bundle,http.notFound );
			}

			if(!that.options.returnData ){
				bundle.data = null;
				var response = http.noContent
				return that.respond( bundle, response )
			}

			bundle.object = instance;
			bundle.data = that.full_dehydrate( bundle.object, bundle );
			that.options.cache.set(bundle.toKey( 'detail') , null )
			debug("instance delete")
			instance.delete().then(function(){
				return that.respond( bundle )
			})
		});
	}
	, _post_list: function _post_list( bundle, callback ){
		var format = this.format( bundle, this.options.serializer.types )
		  , that = this
		  ;

		this.deserialize( bundle.data, format, function( err, data ){
			bundle = that.bundle(bundle.req, bundle.res, data );
			var obj = new that.options.queryset._model( data )
			bundle.object = obj;

			bundle = that.full_hydrate( bundle )

			bundle.object.saveAll( function( err, d ){
				return callback && callback( err, bundle )
			});
		})
	}

	, get_object: function( bundle, callback ){
		var filter = {}
		filter[ this.options.pk ] = bundle.req.params.pk;

		this.options
			.queryset
			._model
			.filter( filter )
			.run( function( err, results ){
				return callback && callback( err, results[0])
			} );

		filter = null;
		return this;
	}

	, update_object: function( bundle, callback ){
		debug("update_object")
		var format = this.format( bundle, this.options.serializer.types );
		var that = this;
		this.get_object( bundle, function( err, obj ){
			debug('get_object')
			if( err || !obj ){
				if( err ){
					err.req = bundle.req;
					err.res = bundle.res;
					return this.emit('error',err);
				}

				bundle.data = {message:'not found',code:404};
				return that.respond(bundle,http.notFound );
			}

			this.deserialize( bundle.data, format, function( err, data ){
				debug('desrialize')
				bundle = that.bundle(bundle.req, bundle.res, data )
				bundle.object = obj;

				bundle = that.full_hydrate( bundle );
				
				bundle.object.saveAll(function(err, d ){
					debug('saved')
					return callback && callback( err, bundle );
				});
			});
		}.bind( this ) )
	}

	// , post_list: function post_list( bundle ){}
	// , get_detail: function get_detail( bundle ){}
	// , put_detail: function put_detail( bundle ){}
	// , delete_detail: function delete_detail( bundle ){}
	, buildFilters: function buildFilters( qs ){
		var filters = {}
		for(var key in qs ){
			if( this.allowablepaths.indexOf( key ) >=0){
				filters[ key ] = qs[ key ];
			}
		}
		return filters;
	}
	
	, offset: function offset( query, bundle ){
		return query.skip( bundle.req.query.offset || 0 );
	}

	, limit: function offset( query, bundle ){
		var qs = bundle.req.query
		  , lmt
		  ;

		qs.limit = qs.hasOwnProperty( 'limit' )  ? parseInt( qs.limit, 10) : qs.limit;
		lmt = isNumber( qs.limit ) ? qs.limit : this.options.limit ? this.options.limit : 25;
		lmt = Math.min( lmt, this.options.max );
		return query.limit( lmt );
		
	}
	
	, sort: function offset( mquery, rquery ){
		var r = this.options.queryset._r;
		toArray( rquery.orderby ).forEach( function( param ){
			var bits = orderExp.exec( param )
			  , dir
			  ;
			
			if(!bits){
				return mquery;
			}
			dir = bits[1] ? 'asc':'desc';
			debug('ordering %s - %s', bits[2], dir );
			mquery = mquery.orderBy( r[ dir ]( bits[2] ) );
		});
		return mquery;
	}
});
