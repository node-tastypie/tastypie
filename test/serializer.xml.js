var assert = require("assert")
   ,serializer = require("../lib/serializer")

describe('serializer#xml', function(){
	it("should do some things", function(){
		var s = new serializer();
		console.log( s.serialize({key:'value', foo:{alt:{test:1}}}, 'application/xml') )
	})

	it('should do other things', function(){
		var s = new serializer({
			xmlattr:true
		})

		console.log( s.serialize({key:'value', foo:{alt:{test:1}}}, 'application/xml') )

	})
})