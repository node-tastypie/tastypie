/*jshint laxcomma:true, smarttabs: true */
'use strict';
/**
 * Provides standard data serialization & deserialization functionality
 * @module module:lib/paginator
 * @author Eric Satterwhite
 * @requires util
 * @requires module:class
 * @requires module:class/meta
 * @requires mout/lang/kindOf
 * @since 0.1.0
 **/


var  xml2js          = require( 'xml2js' )
	, util           = require('util')
	, url           = require('url')
	, events           = require('events')
	, Class          = require('./class')
	, Meta           = require( './class/meta')
	, isNumber       = require('mout/lang/isNumber')
	, clone       = require('mout/lang/clone')
	, exceptions     = require('./exceptions')
	, debug          = require('debug')('tastypie:paginator')
	, Paginator
	;

module.exports = 
Paginator = Class({

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

  , page: function(){
  	  debugger;
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
  , next: function( limit, offset, count ){
	  var value = limit + offset
	  if( value > count - 1 ){
		  return null;
	  }

	  return this.uri(limit, value)
  }
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
  , previous: function( limit, offset, count ){
  
	  var value = offset - limit;
	  if( value < 0 ){
		  return null;
	  }

	  return this.uri( limit, value )
  }
  , count: function(){
	  return Array.isArray( this.meta.objects ) ? this.meta.objects.length : 0;
  }
  , slice: function(limit, offset ){
 	
	if( limit <=0 ){
		return this.meta.objects.slice( offset, this.meta.objects.length )
	}

	return this.meta.objects.slice( offset, ( offset ) + limit )
  }
  , limit: function(){
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
