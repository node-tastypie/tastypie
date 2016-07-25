'use strict';
var Serializer = require("../lib/serializer")
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

			s._mime.lookup('fake').should.equal('application/vnd+fakescript')
			s.types.indexOf('application/vnd+fakescript').should.not.equal(-1)
		})
	})

	describe('custom formats', function(){
		let serializer;
		before(function(){
			var serializer = new Serializer({
				content_types:{
					'application/vnd+fakescript':'fake'
				}
				,to_fake: function( data, callback ){}
				,from_fake: function( data, callback ){}
			});

		})

		it('should serialize to a user defined format', function(done){
			let reference = {a:{b:1}}
			serialize.serialize(reference, 'application/vnd+fakescript', function(err, data){
				assert.equal( data, qs.stringify( reference ), data )
				done()
			})
		})

		it('should deserialize a serialized string back to a javascript object', function(done){
			serialize.deserialize( qs.stringify( {a:{b:1}}, {encode:false} ), 'application/vnd+fakescript', function(err, data ){
				data.a.b.should.equal( 1 )
				done()
			})
		})
	})
})
