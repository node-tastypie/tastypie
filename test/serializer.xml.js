var assert = require("assert")
   ,serializer = require("../lib/serializer")

describe('serializer#xml', function(){
	var doc = [
	'<response>',
	' <key type="string">value</key>',
	' <foo type="object">',
	'  <alt type="object">',
	'   <test type="number">1</test>',
	'  </alt>',
	' </foo>',
	' </response>'
	].join('\n')

	it("should do some things 1", function(){
		var s = new serializer();
		s.deserialize(doc, 'application/xml', function( err, content){
			console.log( arguments )
		})
	})

	it('should do other things 2', function(){
		var expected = '<response>\n <key type="string">value</key>\n <foo type="object">\n  <alt type="object">\n   <test type="number">1</test>\n  </alt>\n </foo>\n</response>\n'
		var s = new serializer({
			xmlattr:true
		})
		s.serialize({key:'value', foo:{alt:{test:1}}}, 'application/xml', function(e,xml){
			assert.equal( xml, expected )
		})

	})
})

