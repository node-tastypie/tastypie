'use strict';
var Serializer = require("../lib/serializer")
  , Class      = require('../lib/class')
  , should     = require('should')
  , assert     = require("assert")
  , qs         = require('qs')


describe("serializer",function(){
	describe('content_types', function(){
		it('should be registered during creation', function( ){
			var serializer = new Serializer({
				content_types:{
					'application/vnd+fakescript':'fake'
				}
			});

			serializer._mime.lookup('fake').should.equal('application/vnd+fakescript')
			serializer.types.indexOf('application/vnd+fakescript').should.not.equal(-1)
		})
	})

	describe('custom formats', function(){
		let serializer;
		before(function( ){
			Serializer = Class({
				inherits:Serializer
				,content_types:{
					'application/vnd+fakescript':'fake'
				}
				,to_fake: function( data ){
					return Promise.resolve(qs.stringify( data, {encode: false}));
				}
				,from_fake: function( data, callback ){
					return Promise.resolve( qs.parse( data ) );
				}
			});
			serializer = new Serializer();
		})

		it('should serialize to a user defined format', function(done){
			let reference = {a:{b:1}}
			serializer.serialize(reference, 'application/vnd+fakescript').then(function( data){
				assert.equal( data, qs.stringify( reference,{encode: false} ))
				done()
			}).catch( done )
		})

		it('should deserialize a serialized string back to a javascript object', function(done){
			serializer.deserialize( qs.stringify( {a:{b:1}}, {encode:false} ), 'application/vnd+fakescript').then(function(data ){
				parseInt(data.a.b,10).should.equal( 1 )
				done()
			}).catch( done )
		})
	})
})
