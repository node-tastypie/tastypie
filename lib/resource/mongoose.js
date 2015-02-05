/*jshint laxcomma: true, smarttabs: true, node:true */
'use strict';
/**
 * A Resource for interacting with the Mongoose ODM for mongodb 
 * @module tastypie/lib/resource/mongoose
 * @author Eric Satterwhite
 * @since 0.0.1
 * @requires util
 * @requires tastypie/lib/class
 * @requires tastypie/lib/class/options
 * @requires tastypie/lib/resource
 * @requires joi
 */

var util       = require( 'util' )
  , Class      = require( '../class' )
  , Options    = require( '../class/options' )
  , object     = require('mout/object')
  , Resource   = require('./index')
  , joi        = require('joi')
  , isFunction = require('mout/lang/isFunction')
  , typecast   = require('mout/string/typecast')
  , compact    = require('mout/array/map')
  , set        = require('mout/object/set')
  , orderExp   = /^(\-)?([\w]+)/
  , SEP        = '__'
  , MongoResource
  , terms
  ;


function quickmap( array, mapFunction ){
	var arrayLen = array.length;
	 var newArray = new Array(arrayLen);
	 for(var i = 0; i < arrayLen; i++) {
	   newArray[i] = mapFunction(array[i], i, array);
	 }

	 return newArray;
};


terms = {
	'gt'          : '$gt'
  , 'gte'         : '$gte'
  , 'in'          : '$in'
  , 'lt'          : '$lt'
  , 'lte'         : '$lte'
  , 'ne'          : '$ne'
  , 'nin'         : '$nin'
  , 'regex'       : '$regex'
  , 'all'         : '$all'
  , 'size'        : '$size'
  , 'match'       : '$elemMatch'
  , 'contains'    : { key:'$regex', value: function( term ){ return new RegExp( term )}}
  , 'icontains'   : { key:'$regex', value: function( term ){ return new RegExp(term, 'i')}}
  , 'startswith'  : { key:'$regex', value: function( term ){ return new RegExp( '^' + term ) }}
  , 'istartswith' : { key:'$regex', value: function( term ){ return new RegExp( '^' + term, 'i' )}}
  , 'endswith'    : { key:'$regex', value: function( term ){ return new RegExp( term + '$' ) }}
  , 'iendswith'   : { key:'$regex', value: function( term ){ return new RegExp( term + '$', 'i') }}
}
/**
 * Description
 * @constructor
 * @alias module:tastypie/lib/resource/mongoose
 * @extends module:tastypie/lib/resource
 * @mixes module:tastypie/lib/class/options
 * @param {Object} options
 */
module.exports = MongoResource = new Class({
	inherits:Resource
	,options:{
		queryset: null
	}
	,constructor: function( options ){
		var instance;
		joi.assert(options.queryset, joi.required(),'querset is required')
		this.parent( 'constructor', options );

		instance = new options.queryset;
		this.options.objectTpl = this.options.objectTpl || instance.model;
		instance = null;

	}
	, get_list: function get_list( bundle ){
		var query = new this.options.queryset();

		query.model.count(function(err, cnt ){
			this._get_list( bundle,function( e, objects ){
				var that = this;
				objects = objects || [];
				var paginator = new this.options.paginator({
					limit:bundle.req.limit
					,req:bundle.req
					,res:bundle.res
					,collectionName:this.options.collection
					,objects:objects
					,count: cnt
					,offset: bundle.req.query.offset
				});
				var to_be_serialize = paginator.page();
				debug('serializing')
				to_be_serialize[ this.options.collection ] = to_be_serialize[ this.options.collection ].map( function( item ){
					return that.full_dehydrate( item, bundle )
				});
				bundle.data = to_be_serialize
				debug('responding')
				return this.respond( bundle )
			}.bind( this ));
		})
	}
	, _get_list: function( bundle, callback ){
		var query = new this.options.queryset();
		   , filters = this.buildFilters( bundle.req.query )
		this.sort( query, bundle.req.query )
		query.where( filters )
		query.exec( callback )
	}

	,buildFilters: function buildFilters( qs ){
		var query = new this.options.queryset();
		  , remaining = {};

		for( var key in qs ){
			var bits = key.split( SEP )
			   , filter = {}
			   , value
			   , fieldname
			   , filtertype
			   , last 

			value     = qs[key];
			fieldname = bits.shift();
			
			bits = quickmap(bits, function( bit ){
				if( terms.hasOwnProperty( bit ) ){
					return terms[ bit ];
				}
				return bit;
			});

			filtertype = bits.length > 0 && isFunction( bits[ bits.length -1 ] )  ? bits.pop() : filtertype
			// should be defined on resource instance
			if( allowablepaths.indexOf( fieldname ) >=0 ){
				bits.unshift( fieldname );
				filter = bits.length ? set( filter, join( bits, '.' ),  isFunction( last.value ) ? last.value( value ) : typecast( value ) ) : typecast( value );
				remaining[ fieldname ] = filter;
			}
		}
		return remaining;
	}

	, sort: function sort( mquery, rquery ){
		var ordering = {};
		toArray( rquery.orderby ).forEach( function( param ){
			var bits = orderExp.exec( param );
			
			if( !bits ){
				return;
			}

			ordering[ bits[2] ] = bits[1] ? -1 : 1;
		});

		mquery.sort( ordering );
		return mquery;
	}
});
