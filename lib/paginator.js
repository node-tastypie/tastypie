/*jshint laxcomma:true, smarttabs: true, node:true */
'use strict';
/**
 * @module tastypie/lib/paginator
 * @author Eric Satterwhite
 * @requires util
 * @requires module:class
 * @requires module:class/options
 * @requires module:class/parent
 * @requires mout/lang/kindOf
 * @since 0.1.0
 * @requires xml2js
 * @requires util
 * @requires url
 * @requires events
 * @requires debug
 * @requires mout/lang/isNumber
 * @requires mout/lang/clone
 * @requires tastypie/lib/class
 * @requires tastypie/lib/class/options
 * @requires tastypie/lib/exceptions
 **/


var url        = require( 'url' )                  // url
	, Boom       = require('boom')
	, events     = require( 'events' )             // events
	, isNumber   = require( 'mout/lang/isNumber' ) // isNumber
	, clone      = require( 'mout/lang/clone' )    // clone
	, Class      = require( './class' )            // Class
	, Options    = require( './class/options' )    // Options
	, Parent     = require( './class/parent' )     // Parent function
	, Paginator
	;

/**
 * Used to generate pages of array data. Also responsible for creating Meta data packets for api responses
 * @constructor
 * @alias module:tastypie/lib/paginator
 * @param {Object} options
 * @param {Object[]} [options.object=[]] The data to page
 * @param {?Number} [options.limit=null] The maximum number of object to include in a page
 * @param {Number} [options.offset=0] The number of object to skip
 * @param {Request} options.req A hapi.js request object
 * @param {Reply} options.res A hapi.js reply object
 * @example var Paginator = require('tastypie/lib/paginator')
paginator = new Paginator({
	limit: bundle.req.query.limit || 25
, req: bundle.req
, res: bundle.res
, collectionName: 'data'
, objects: []
});

to_be_serialize = paginator.page();
 */
module.exports =
Paginator = new Class({
		inherits:events.EventEmitter
	, mixin:[ Parent, Options ]
	, options:{
		objects:[]
	  , limit:25
	  , max:1000
	  , offset:0
	  , req:null
	  , res:null
	  , collectionName: 'objects'
	}
	, constructor: function( options ){
		this.setOptions( options );
	}

	/**
	 * Generates a page of a data set
	 * @method module:tastypie/lib/paginator#page
	 * @return {Object} page An array sliced from the original data set using offset & limit parameters
	 **/
	, page: function page(){
			var limit = this.limit();
			var offset = this.offset();
			var count = this.count();
			var ret = {
				meta:{
					count:count
				, limit: limit
				, offset: offset
				}
			};

			if( limit  && limit < this.options.objects.length ){
				ret.meta.previous = this.previous( limit, offset, count );
				ret.meta.next = this.next( limit, offset, count );
			}

			ret[ this.options.collectionName ] = this.slice( limit, offset );
			// dereference the request and respons
			this.setOptions({ req:null, res:null });
			return ret;
	}

	/**
	 * Returns  the uri for the next page if their is one
	 * @method module:tastypie/lib/paginator#next
	 * @param {Number} limit the number of items in the page
	 * @param {Number} offset where in the data set to derive the page from
	 * @param {Number} count the length of the current data set
	 * @return {String} url the URI that can be used to retrieve the next page
	 **/
	, next: function next( limit, offset, count ){
		var value = limit + offset;

		if( value > count - 1 ){
			return null;
		}

		return this.uri(limit, value);
	}

	/**
	 * determines the offset for the current data set using options, or pased in request
	 * @method module:tastypie/lib/paginator#offset
	 * @return {Number} offset THe resulting offset parameter
	 **/
	, offset: function offset( ){
			var oset = this.options.offset;
			var query = this.options.req.query || {};

			if( query.offset != null ){
				oset = parseInt( query.offset, 10 );
			}

			if( !isNumber( oset ) || oset<0 ){
				var e = new Boom.badRequest("bad offset param: " + oset );
				e.req = this.options.req;
				e.res = this.options.res;
				return this.emit('error', e);
			}

			return oset;
	}

	/**
	 * Returns  the uri for the previous page if their is one
	 * @method module:tastypie/lib/paginator#previous
	 * @param {Number} limit the number of items in the page
	 * @param {Number} offset where in the data set to derive the page from
	 * @return {String} the URI that can be used to retrieve the previous page
	 **/
	, previous: function previous( limit, offset ){

		var value = offset - limit;
		if( value < 0 ){
			return null;
		}

		return this.uri( limit, value );
	}

	/**
	 * returns the number of objects in the current data set
	 * @method module:tastypie/lib/paginator#count
	 * @return {Number}
	 **/
	, count: function count(){
		return this.options.count;
	}

	/**
	 * retuns a slice from the current data set to represent a page
	 * @method module:tastypie/lib/paginator#slice
	 * @param {Number} limit The maximum number of items to include in the slice
	 * @param {Number} offset The starting position in the data set at which to start the slice
	 * @return {Array}
	 **/
	,slice: function slice( limit, offset ){
		if( limit <=0 ){
			return this.options.objects.slice( offset, this.options.objects.length );
		}

		return this.options.objects.slice( offset, ( offset ) + limit );
	}

	/**
	 * returns the number of items that should be included in the data set.
	 * Checks req.query for limit or a configured limit option
	 * @method module:tastypie/lib/paginator#limit
	 * @return {Number}
	 **/
	, limit: function limit(){
		var query = (this.options.req || {}).query || {}
		  , max   = this.options.max || -1
		  , limit = this.options.limit
		  , lmt
		  ;

		lmt = query.limit ? parseInt( query.limit, 10) : query.limit;
		lmt = isNumber( lmt ) ? lmt ? lmt : max : limit ? limit : 25;
		lmt = Math.min( lmt, max );
		if(!isNumber( lmt ) ){
			this.emit(
				'error'
				, new Boom.badRequest('limit must be a number')
				, this.options.req
				, this.options.res
			);
		}
		return lmt;
	}

	/**
	 * generates a URI that will return page of data
	 * @method module:tastypie/lib/paginator#uri
	 * @param {Number} limit The maximum number of items to include in the slice
	 * @param {Number} offset The starting position in the data set at which to start the slice
	 * @return {String} a formatted uri
	 **/
	, uri: function uri( limit, offset ){
		var values = clone(this.options.req.query || {});

		values.limit = limit;
		values.offset = offset;
		return url.format({
			 pathname:this.options.req.path
			 ,query: values
		});
	}
});


/**
 * Assumes paging is done at the data store level. Slice method returns the objects array untouched
 * @class module:tastypie/lib/paginator.Remote
 * @extends module:tastypie/lib/paginator
 * @param {Object} options
 * @param {Object[]} [options.object=[]] The data to page
 * @param {?Number} [options.limit=null] The maximum number of object to include in a page
 * @param {Number} [options.offset=0] The number of object to skip
 * @param {Request} options.req A hapi.js request object
 * @param {Reply} options.res A hapi.js reply object
 * @example var Paginator = require('tastypie/lib/paginator')
paginator = new Paginator.Remote({
	limit: bundle.req.query.limit || 25
, req: bundle.req
, res: bundle.res
, collectionName: 'data'
, objects: []
});

to_be_serialize = paginator.page();
 */
module.exports.Remote = new Class({
	inherits: Paginator
	,sort: function( ){
		return this.options.objects;
	}
	, slice: function( ){
		return this.options.objects;
	}
	/**
	 * Generates a page of a data set
	 * @method module:tastypie/lib/paginator.REMOTE#page
	 * @return {Object} page An array sliced from the original data set using offset & limit parameters
	 **/
	, page: function page(){
			var limit = this.limit()
			  , offset = this.offset()
			  , count = this.count()
			  , ret = {
					meta:{
						count:count
					  , limit: limit
					  , offset: offset
					}
			};

			if( limit  && limit < count ){
				ret.meta.previous = this.previous( limit, offset, count );
				ret.meta.next = this.next( limit, offset, count );
			}

			ret[ this.options.collectionName ] = this.slice( limit, offset );
			// dereference the request and respons
			this.setOptions({
				req:undefined
				, res:undefined
			});
			return ret;
	}
});

