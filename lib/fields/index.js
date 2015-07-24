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

var ApiField
  , RelatedField
  , CharField
  , ArrayField
  , IntegerField
  , FloatField
  , BooleanField
  , DateField
  , DateTimeField
  , ObjectField
  , FileField
  , FilePathField
  ;



exports.ApiField      = ApiField      = require('./api');
exports.RelatedField  = RelatedField  = require('./related');
exports.CharField     = CharField     = require('./char');
exports.ArrayField    = ArrayField    = require('./array');
exports.IntegerField  = IntegerField  = require('./integer');
exports.FloatField    = FloatField    = require('./float');
exports.BooleanField  = BooleanField  = require('./boolean');
exports.DateField     = DateField     = require('./date');
exports.DateTimeField = DateTimeField = require('./datetime');
exports.ObjectField   = ObjectField   = require('./object');
exports.FileField     = FileField     = require('./file');
exports.FilePathField = FilePathField = require('./filepath');


Object.defineProperties( exports,{
	field:{
		/**
		 * @readonly
		 * @name field
		 * @alias module:tastypie/fields.ApiField
		 * @memberof module:tastypie/fields
		 * @property {Field} field short cut for the {@link module:tastypie/fields.ApiField|ApiField} class
		 **/
		get: function(){
			return ApiField;
		}
	}
	, 'char':{
		/**
		 * @readonly
		 * @name char
		 * @alias module:tastypie/fields.CharField
		 * @memberof module:tastypie/fields
		 * @property {Field} char short cut for the {@link module:tastypie/fields.CharField|CharField} class
		 **/
		get:function( ){
			return CharField;
		}
	}
	, character:{
		/**
		 * @readonly
		 * @name character
		 * @alias module:tastypie/fields.CharField
		 * @memberof module:tastypie/fields
		 * @property {Field} character short cut for the {@link module:tastypie/fields.CharField|CharField} class
		 **/
		get:function( ){
			return CharField;
		}
	}

	, file: {
		/**
		 * @readonly
		 * @name file
		 * @alias module:tastypie/fields.FileField
		 * @memberof module:tastypie/fields
		 * @property {Field} character short cut for the {@link module:tastypie/fields.FileField|FileField} class
		 **/
		get: function( ){
			return FileField;
		}
	}

	,filepath:{
		/**
		 * @readonly
		 * @name filepath
		 * @alias module:tastypie/fields.FilePathField
		 * @memberof module:tastypie/fields
		 * @property {Field} character short cut for the {@link module:tastypie/fields.FilePath|FilePath} class
		 **/
		get: function( ){
			return FilePathField;
		}
	}

	, array:{
		/**
		 * @readonly
		 * @name array
		 * @alias module:tastypie/fields.ArrayField
		 * @memberof module:tastypie/fields
		 * @property {Field} array short cut for the {@link module:tastypie/fields.ArrayField|ArrayField} class
		 **/
		get: function( ){
			return ArrayField;
		}
	}

	, 'int':{
		/**
		 * @readonly
		 * @name int
		 * @alias module:tastypie/fields.IntegerField
		 * @memberof module:tastypie/fields
		 * @property {Field} int short cut for the {@link module:tastypie/fields.IntegerField|IntegerField} class
		 **/
		get: function( ){
			return IntegerField;
		}
	}
	, 'integer':{
		/**
		 * @readonly
		 * @name integer
		 * @alias module:tastypie/fields.IntegerField
		 * @memberof module:tastypie/fields
		 * @property {Field} integer short cut for the {@link module:tastypie/fields.IntegerField|IntegerField} class
		 **/
		get: function( ){
			return IntegerField;
		}
	}

	, 'float':{
		/**
		 * @readonly
		 * @name float
		 * @alias module:tastypie/fields.FloatField
		 * @memberof module:tastypie/fields
		 * @property {Field} float short cut for the {@link module:tastypie/fields.FloatField|FloatField} class
		 **/
		get: function( ){
			return FloatField;
		}
	}

	, 'bool':{
		/**
		 * @readonly
		 * @name bool
		 * @alias module:tastypie/fields.BooleanField
		 * @memberof module:tastypie/fields
		 * @property {Field} bool short cut for the {@link module:tastypie/fields.BooleanField|BooleanField} class
		 **/
		get: function( ){
			return BooleanField;
		}
	}

	, 'boolean':{
		/**
		 * @readonly
		 * @name boolean
		 * @alias module:tastypie/fields.BooleanField
		 * @memberof module:tastypie/fields
		 * @property {Field} boolean short cut for the {@link module:tastypie/fields.BooleanField|BooleanField} class
		 **/
		get: function( ){
			return BooleanField;
		}
	}

	, 'date':{
		/**
		 * @readonly
		 * @name date
		 * @alias module:tastypie/fields.DateField
		 * @memberof module:tastypie/fields
		 * @property {Field} date short cut for the {@link module:tastypie/fields.DateField|DateField} class
		 **/
		get: function( ){
			return DateField;
		}
	}

	, 'datetime':{
		/**
		 * @readonly
		 * @name datetime
		 * @alias module:tastypie/fields.DateTimeField
		 * @memberof module:tastypie/fields
		 * @property {Field} datetime short cut for the {@link module:tastypie/fields.DateTimeField|DateTimeField} class
		 **/
		get: function( ){
			return DateTimeField;
		}
	}

	, 'object':{
		/**
		 * @readonly
		 * @name object
		 * @alias module:tastypie/fields.ObjectField
		 * @memberof module:tastypie/fields
		 * @property {Field} object short cut for the {@link module:tastypie/fields.ObjectField|ObjectField} class
		 **/
		get: function( ){
			return ObjectField;
		}
	}
});
