var Serializer = require("../lib/serializer")
  , assert     = require("assert")

var fake_data ={
	key1:"value1"
	,key2:"value2"
}

describe("serializer",function(){
	describe("json", function(){
		describe('#serialize', function(){
			it("should do encoding", function( done ){
				var s = new Serializer()
				s.serialize( fake_data).then(function( d ){
					assert.equal( JSON.stringify( fake_data ).key1, d.key1 ) 
					done();
				});
			})
		})

		describe('#deserialize', function(){
			it("should decode json objects", function( done ){
				var s = new Serializer();
				var string_data = JSON.stringify( fake_data )
				s.deserialize( string_data).then(function( decoded_data ){
					assert.equal( decoded_data.key1, fake_data.key1 )
					assert.equal( decoded_data.key2, fake_data.key2 )
					done();
				});
			})
		})
	})
})