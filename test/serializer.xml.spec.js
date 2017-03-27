var assert = require("assert")
   ,Serializer = require("../lib/serializer");

describe('serializer#xml', function(){
  var doc = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<response>',
  ' <key type="string">value</key>',
  ' <foo type="object">',
  '  <alt type="object">',
  '   <test type="number">1</test>',
  '  </alt>',
  ' </foo>',
  ' <more type="array">',
  '   <test type="number">1</test>',
  '   <test type="number">1</test>',
  '   <test type="number">1</test>',
  ' </more>',
  ' </response>'
  ].join('\n');

  it("should deserialize an XML string into a javascript object", function(){
    var s = new Serializer({
      defaultFormat:"text/xml"
    });
    s.deserialize(doc, 'text/xml', function( err, content){
      assert.ok( content );
      assert.equal( content.key, 'value');
      assert.equal( content.foo.alt.test, 1 );
    });
  });

  it('should serialize a javascript object into an xml string', function(){
    var expected = '<?xml version="1.0" encoding="UTF-8"?>\n<response>\n <key type="string">value</key>\n <foo type="object">\n  <alt type="object">\n   <test type="number">1</test>\n  </alt>\n </foo>\n</response>\n';
    var s = new Serializer();
    s.serialize({key:'value', foo:{alt:{test:1}}}, 'text/xml', function(e,xml){
      assert.equal( xml, expected );
    });
  });
});

