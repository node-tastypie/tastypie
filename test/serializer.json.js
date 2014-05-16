var Serializer = require("../lib/serializer")
  , assert     = require("assert")

var fake_data ={
	key1:"value1"
	,key2:"value2"
}

describe("serializer",function(){
	describe("json", function(){
		describe('#serialize', function(){
			it("should do encoding", function( ){
				var s = new Serializer()
				assert.equal( JSON.stringify( fake_data ), s.serialize( fake_data ) )
			})
		})

		describe('#deserialize', function(){

			it("should decode json objects", function(){
				var s = new Serializer();
				var string_data = JSON.stringify( fake_data )


				var decoded_data = s.deserialize( string_data );

				assert.equal( decoded_data.key1, fake_data.key1 )
				assert.equal( decoded_data.key2, fake_data.key2 )
				
			})
		})
	})
})