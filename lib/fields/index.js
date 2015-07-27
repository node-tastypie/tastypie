/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * resource field definitions
 * @module tastypie/fields
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires tastypie/fields/api
 * @requires tastypie/fields/related
 * @requires tastypie/fields/char
 * @requires tastypie/fields/array
 * @requires tastypie/fields/integer
 * @requires tastypie/fields/float
 * @requires tastypie/fields/boolean
 * @requires tastypie/fields/date
 * @requires tastypie/fields/datetime
 * @requires tastypie/fields/object
 * @requires tastypie/fields/file
 * @requires tastypie/fields/filepath
 */

var ApiField      = require('./api')
  , RelatedField  = require('./related')
  , CharField     = require('./char')
  , ArrayField    = require('./array')
  , IntegerField  = require('./integer')
  , FloatField    = require('./float')
  , BooleanField  = require('./boolean')
  , DateField     = require('./date')
  , DateTimeField = require('./datetime')
  , ObjectField   = require('./object')
  , FileField     = require('./file')
  , FilePathField = require('./filepath')
  ;

Object.defineProperties( exports,{
	field:{
		/**
		 * @readonly
		 * @name field
		 * @alias module:tastypie/fields/api
		 * @memberof module:tastypie/fields
		 * @property {Field} field short cut for the {@link module:tastypie/fields/api|ApiField} class
		 **/
		get: function(){
			return ApiField;
		}
	}
	,ApiFIeld:{
		/**
		 * @readonly
		 * @name ApiField
		 * @alias module:tastypie/fields/api
		 * @memberof module:tastypie/fields
		 * @property {Field} field short cut for the {@link module:tastypie/fields/api|ApiField} class
		 **/	
		get: function( ){
			return ApiField;
		}
	}
	
	,CharField:{
		/**
		 * @readonly
		 * @name CharFIeld
		 * @alias module:tastypie/fields/char
		 * @memberof module:tastypie/fields
		 * @property {Field} char short cut for the {@link module:tastypie/fields/char|CharField} class
		 **/
		get: function( ){
			return CharField;
		}
	}
	
	, 'char':{
		/**
		 * @readonly
		 * @name char
		 * @alias module:tastypie/fields/char
		 * @memberof module:tastypie/fields
		 * @property {Field} char short cut for the {@link module:tastypie/fields/char|CharField} class
		 **/
		get:function( ){
			return CharField;
		}
	}

	, character:{
		/**
		 * @readonly
		 * @name character
		 * @alias module:tastypie/fields/char
		 * @memberof module:tastypie/fields
		 * @property {Field} character short cut for the {@link module:tastypie/fields/char|CharField} class
		 **/
		get:function( ){
			return CharField;
		}
	}

	, FileField: {
		/**
		 * @readonly
		 * @name FileField
		 * @alias module:tastypie/fields/file
		 * @memberof module:tastypie/fields
		 * @property {Field} character short cut for the {@link module:tastypie/fields/file|FileField} class
		 **/
		get: function( ){
			return FileField;
		}
	}

	, file: {
		/**
		 * @readonly
		 * @name file
		 * @alias module:tastypie/fields/file
		 * @memberof module:tastypie/fields
		 * @property {Field} character short cut for the {@link module:tastypie/fields/file|FileField} class
		 **/
		get: function( ){
			return FileField;
		}
	}

	,FilePathField:{
		/**
		 * @readonly
		 * @name FilePathField
		 * @alias module:tastypie/fields/filepath
		 * @memberof module:tastypie/fields
		 * @property {Field} character short cut for the {@link module:tastypie/fields/filepath|FilePath} class
		 **/
		get: function( ){
			return FilePathField;
		}
	}

	,filepath:{
		/**
		 * @readonly
		 * @name filepath
		 * @alias module:tastypie/fields/filepath
		 * @memberof module:tastypie/fields
		 * @property {Field} character short cut for the {@link module:tastypie/fields/filepath|FilePath} class
		 **/
		get: function( ){
			return FilePathField;
		}
	}

	, ArrayField:{
		/**
		 * @readonly
		 * @name ArrayField
		 * @alias module:tastypie/fields/array
		 * @memberof module:tastypie/fields
		 * @property {Field} array short cut for the {@link module:tastypie/fields/array|ArrayField} class
		 **/
		get: function( ){
			return ArrayField;
		}
	}

	, array:{
		/**
		 * @readonly
		 * @name array
		 * @alias module:tastypie/fields/array
		 * @memberof module:tastypie/fields
		 * @property {Field} array short cut for the {@link module:tastypie/fields/array|ArrayField} class
		 **/
		get: function( ){
			return ArrayField;
		}
	}

	, IntegerField:{
		/**
		 * @readonly
		 * @name IntegerField
		 * @alias module:tastypie/fields/integer
		 * @memberof module:tastypie/fields
		 * @property {Field} int short cut for the {@link module:tastypie/fields/integer|IntegerField} class
		 **/
		get: function( ){
			return IntegerField;
		}
	}
	, 'int':{
		/**
		 * @readonly
		 * @name int
		 * @alias module:tastypie/fields/integer
		 * @memberof module:tastypie/fields
		 * @property {Field} int short cut for the {@link module:tastypie/fields/integer|IntegerField} class
		 **/
		get: function( ){
			return IntegerField;
		}
	}
	, 'integer':{
		/**
		 * @readonly
		 * @name integer
		 * @alias module:tastypie/fields/integer
		 * @memberof module:tastypie/fields
		 * @property {Field} integer short cut for the {@link module:tastypie/fields/integer|IntegerField} class
		 **/
		get: function( ){
			return IntegerField;
		}
	}
	, FloatField:{
		/**
		 * @readonly
		 * @name FloatField
		 * @alias module:tastypie/fields/float
		 * @memberof module:tastypie/fields
		 * @property {Field} float short cut for the {@link module:tastypie/fields/float|FloatField} class
		 **/
		get: function( ){
			return FloatField;
		}
	}
	, 'float':{
		/**
		 * @readonly
		 * @name float
		 * @alias module:tastypie/fields/float
		 * @memberof module:tastypie/fields
		 * @property {Field} float short cut for the {@link module:tastypie/fields/float|FloatField} class
		 **/
		get: function( ){
			return FloatField;
		}
	}

	, BooleanField:{
		/**
		 * @readonly
		 * @name BooleanField
		 * @alias module:tastypie/fields/boolean
		 * @memberof module:tastypie/fields
		 * @property {Field} bool short cut for the {@link module:tastypie/fields/boolean|BooleanField} class
		 **/
		get: function( ){
			return BooleanField;
		}
	}

	, 'bool':{
		/**
		 * @readonly
		 * @name bool
		 * @alias module:tastypie/fields/boolean
		 * @memberof module:tastypie/fields
		 * @property {Field} bool short cut for the {@link module:tastypie/fields/boolean|BooleanField} class
		 **/
		get: function( ){
			return BooleanField;
		}
	}

	, 'boolean':{
		/**
		 * @readonly
		 * @name boolean
		 * @alias module:tastypie/fields/boolean
		 * @memberof module:tastypie/fields
		 * @property {Field} boolean short cut for the {@link module:tastypie/fields/boolean|BooleanField} class
		 **/
		get: function( ){
			return BooleanField;
		}
	}
	
	, DateField:{
		/**
		 * @readonly
		 * @name DateField
		 * @alias module:tastypie/fields/date
		 * @memberof module:tastypie/fields
		 * @property {Field} date short cut for the {@link module:tastypie/fields/date|DateField} class
		 **/
		get: function( ){
			return DateField;
		}
	}

	, 'date':{
		/**
		 * @readonly
		 * @name date
		 * @alias module:tastypie/fields/date
		 * @memberof module:tastypie/fields
		 * @property {Field} date short cut for the {@link module:tastypie/fields/date|DateField} class
		 **/
		get: function( ){
			return DateField;
		}
	}

	, DateTimeField:{
		/**
		 * @readonly
		 * @name DateTimeField
		 * @alias module:tastypie/fields/datetime
		 * @memberof module:tastypie/fields
		 * @property {Field} datetime short cut for the {@link module:tastypie/fields/datetime|DateTimeField} class
		 **/
		get: function( ){
			return DateTimeField;
		}
	}

	, 'datetime':{
		/**
		 * @readonly
		 * @name datetime
		 * @alias module:tastypie/fields/datetime
		 * @memberof module:tastypie/fields
		 * @property {Field} datetime short cut for the {@link module:tastypie/fields/datetime|DateTimeField} class
		 **/
		get: function( ){
			return DateTimeField;
		}
	}

	, ObjectField:{
		/**
		 * @readonly
		 * @name ObjectField
		 * @alias module:tastypie/fields/object
		 * @memberof module:tastypie/fields
		 * @property {Field} object short cut for the {@link module:tastypie/fields/object|ObjectField} class
		 **/
		get: function( ){
			return ObjectField;
		}
	}

	, 'object':{
		/**
		 * @readonly
		 * @name object
		 * @alias module:tastypie/fields/object
		 * @memberof module:tastypie/fields
		 * @property {Field} object short cut for the {@link module:tastypie/fields/object|ObjectField} class
		 **/
		get: function( ){
			return ObjectField;
		}
	}
});
