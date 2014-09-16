/*jshint laxcomma:true, smarttabs: true */
'use strict';
/**
 * Provides data pagination and data payload stardization functionality
 * @module module:lib/paginator
 * @author Eric Satterwhite
 * @requires util
 * @requires module:class
 * @requires module:class/meta
 * @requires mout/lang/kindOf
 * @since 0.1.0
 * @requires xml2js
 * @requires util
 * @requires url
 * @requires events
 * @requires Class
 * @requires Meta
 * @requires isNumber
 * @requires clone
 * @requires exceptions
 * @requires debug
 **/


var  xml2js      = require( 'xml2js' )                       // xml2js
	, util       = require( 'util' )                         // util
	, url        = require( 'url' )                          // url
	, debug      = require( 'debug' )('tastypie:paginator' ) // debug
	, events     = require( 'events' )                       // events
	, isNumber   = require( 'mout/lang/isNumber' )           // isNumber
	, clone      = require( 'mout/lang/clone' )              // clone
	, Class      = require( './class' )                      // Class
	, Meta       = require( './class/meta' )                 // Meta
	, exceptions = require( './exceptions' )                 // exceptions
	, Paginator
	;

/**
 * Description
 * @class module:paginator.js.Thing
 * @param {TYPE} param
 * @example var x = new paginator.js.THING();
 */
module.exports = 
Paginator = Class(/* @lends module:tastypie/paginator.Paginator.prototype */{

	mixin:[ events.EventEmitter, Meta ]
  , meta:{
	  objects:[]
	, limit:null
	, max:1000
	, offset:0
	, req:null
	, res:null
	, collectionName: 'objects'
  }
  , constructor: function( meta ){
		this.setMeta( meta );
  }

  /**
   * Generates a page of a data set
   * @method module:tastypie/paginator.Paginator
   * @return page An array sliced from the original data set using offset & limit parameters
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

	  if( limit ){
		  ret.meta.previous = this.previous( limit, offset, count );
		  ret.meta.next = this.next( limit, offset, count );
	  }

	  ret[ this.meta.collectionName ] = this.slice( limit, offset );
	  // dereference the request and respons
	  this.setMeta({
			req:undefined
		  , res:undefined
	  });
	  return ret;
  }
  /**
   * Returns  the uri for the next page if their is one
   * @method module:tastypie/paginator.Paginator#next
   * @param {Number} limit the number of items in the page
   * @param {Number} offset where in the data set to derive the page from
   * @param {Number} count the length of the current data set
   * @return uri the URI that can be used to retrieve the next page
   **/
  , next: function next( limit, offset, count ){
	  var value = limit + offset
	  if( value > count - 1 ){
		  return null;
	  }

	  return this.uri(limit, value)
  }
  /**
   * DESCRIPTION
   * @method module:tastypie/paginator.Paginator#offset
   * @param {TYPE} NAME
   * @param {TYPE} NAME
   * @return
   **/
  , offset: function offset( ){
	  var offset = this.meta.offset;
	  var query = this.meta.req.query || {};

	  if( query.offset != null ){
		  offset = parseInt( query.offset, 10 )
	  }

	  if( !isNumber( offset ) || offset<0 ){
		throw new exceptions.BadRequest("bad offset param")
	  }

	  return offset;
  }
  /**
   * Returns  the uri for the previous page if their is one
   * @method module:tastypie/paginator.Paginator#previous
   * @param {Number} limit the number of items in the page
   * @param {Number} offset where in the data set to derive the page from
   * @param {Number} count the length of the current data set
   * @return uri the URI that can be used to retrieve the previous page
   **/
  , previous: function previous( limit, offset, count ){
  
	  var value = offset - limit;
	  if( value < 0 ){
		  return null;
	  }

	  return this.uri( limit, value )
  }
  /**
   * returns the number of objects in the current data set
   * @method module:tastypie/paginator.Paginator#count
   * @return Number
   **/
  , count: function count(){
	  return Array.isArray( this.meta.objects ) ? this.meta.objects.length : 0;
  }
  /**
   * retuns a slice from the current data set to represent a page
   * @method module:tastypie/paginator.Paginator#slice
   * @param {Number} limit The maximum number of items to include in the slice
   * @param {Number} offset The starting position in the data set at which to start the slice
   * @return Array
   **/
  , slice: function slice(limit, offset ){
 	
	if( limit <=0 ){
		return this.meta.objects.slice( offset, this.meta.objects.length )
	}

	return this.meta.objects.slice( offset, ( offset ) + limit )
  }
  /**
   * returns the number of items that should be included in the data set.
   * Checks req.query for limit or a configured limit option 
   * @method module:tastypie/paginator.Paginator#limit
   * @return Number
   **/
  , limit: function limit(){
	  var lmt;

	  lmt = parseInt( this.meta.req && this.meta.req.query.limit || this.meta.limit || 25, 10);
	  lmt = Math.min( lmt, this.meta.max);
	  if(!isNumber( lmt ) ){
		this.emit(
			'error'
			, new exceptions.BadRequest('limit must be a number')
		    , this.meta.req
			, this.meta.res	
		);
	  }

	  return lmt;
  }
  /**
   * generates a URI that will return page of data 
   * @method module:tastypie/paginator.Paginator#uri
   * @param {Number} limit The maximum number of items to include in the slice
   * @param {Number} offset The starting position in the data set at which to start the slice
   * @return
   **/
  , uri: function uri( limit, offset ){
	  var values = clone(this.meta.req.query || {});

	  values.limit = limit;
	  values.offset = offset;
	  return url.format({
	  	 pathname:this.meta.req.uri
	  	 ,query: values
	  });
  } 
});
