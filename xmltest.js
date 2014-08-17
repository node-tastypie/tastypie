var serializer = require('./lib/serializer');
var util = require('util')
var jstoxml = require("jstoxml")
var xml2js = require("xml2js")
var data = {
	meta:{
		 limit:1000
		,total:10
	}

	,objects:[{
		name:'test'
		,"a":1
		,"b":2
		,"c":3
		,"d":4
	},{
		name:'foo'
	},{
		test:"3"
	}]
	
	,strings:[ "1", "2" ]

	,nested: {
		more:{
			foo:"bar"
		}
	}
}
var xml = '<response> <meta type="object"> <limit type="number">1000</limit> <total type="number">10</total> </meta> <objects type="array"> <object type="object"> <name type="string">test</name> <a type="number">1</a> <b type="number">2</b> <c type="number">3</c> <d type="number">4</d> </object> <object type="object"> <name type="string">foo</name> </object> <object type="object"> <test type="string">3</test> </object> </objects> <strings type="array"> <value type="string">1</value> <value type="string">2</value> </strings> <nested type="object"> <more type="object"> <foo type="string">bar</foo> </more> </nested> </response>'
var compiled = {
	_name:'response'
	,_content:[{
		_name:'meta'
		,_attrs:{
			type:'object'
		}
		,_content:[{
			_name:"limit"
			,_content:1000
			,_attrs:{
				type:'number'
			}
		}
		,{
			_name:"total"
			,_content:'10'
			,_attrs:{
				type:"number"
			}
		}]
	}
	,{
		_name:'data'
		,_attrs:{
			type:'array'
		}
		,_content:[{
			_name:"perms"
			,_content:[{
				_name:"value"
				,_attrs:{
					type:"string"
				}
				,_content:"esatterwhite"
			}
			,{
				_name:"value"
				,_attrs:{
					type:"string"
				}
				,_content:"satterwhite"	
			}]
		}]
	}]
}
var s = new serializer();
var builder = new xml2js.Builder();
// console.log( util.inspect( s.to_jstree( data ), {depth:7, colors:true}));
// console.log( s.serialize( data, 'application/xml') )

// s.from_xml( xml, console.log )
// console.log( jstoxml.toXML( compiled ) )
// console.log( builder.buildObject( data ))

console.log( 'json' )
console.time('json')
for( var x=0;x<10000;x++){
	s.serialize( data, "application/json", function(){
		console.timeEnd('json')
	});
}


// console.log( 'xml' )
// console.time('xml')
// for( var x=0;x<10000;x++){
// 	s.serialize( data, "application/xml" )
// }
// console.timeEnd('xml')
