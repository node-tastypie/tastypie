var assert = require('assert')
var server = require('./server')
var Api    = require('../lib/api')
var Resource = require( '../lib/resource' )

describe('resoruce', function(){

	before(function( done ){
		var api = new Api('api/resource')
		api.add('more', new Resource)
		server.register([api], function( e ){
			server.start( done )
		})
	});

	describe('api', function(){
		
		it('should accept a request',function( done ){
			server.inject({
				url:'/api/resource'
				,method:'get'
				,headers:{
					Accept:'application/json',
					'Content-Type':'application/json'
				}
			}, function( response ){
				var reply = response.result
				assert.equal( reply.more.schema, "/api/resource/more/schema" )
				assert.equal( reply.more.list, "/api/resource/more" )
				assert.equal( reply.more.detail, "/api/resource/more/{pk}" )
				done();
			})
		})

	})
})
