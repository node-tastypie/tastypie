var serializer = require('./lib/serializer');
var util = require('util')
var jstoxml = require("jstoxml")
var data = {
	meta:{
		 limit:1000
		,total:10

	}
	,data:[{
		foo:'bar'
		,bar:1
		,perms:[1,2,3,4,5 ]
	},{
		foo:'baz'
		,bar:'foo'
		,perms:[9,8,7,6]
	}]

}

var s = new serializer();
console.log( util.inspect( s.to_jstree( data ), {depth:7, colors:true}));
console.log( s.to_xml( data ) )


// console.log( 'json' )
// console.time('json')
// for( var x=0;x<10000;x++){
// 	s.serialize( data, "application/json" )
// }
// console.timeEnd('json')


// console.log( 'xml' )
// console.time('xml')
// for( var x=0;x<10000;x++){
// 	s.serialize( data, "application/xml" )
// }
// console.timeEnd('xml')
