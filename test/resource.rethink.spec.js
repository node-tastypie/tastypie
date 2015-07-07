/*jshint laxcomma: true, smarttabs: true, node: true, mocha: true*/
var should        = require('should')
  , assert        = require('assert')
  , server        = require('./server')
  , Api           = require('../lib/api')
  , Resource      = require( '../lib/resource' )
  , RethinkResource = require( '../lib/resource/rethink' )
  , xml2js        = require( 'xml2js' )
  , rethink       = require( 'thinky' )({db:'tastypie'})
  , fs            = require('fs')
  , path          = require('path')
  , fields        = require('../lib/fields')
  , http          = require('../lib/http')
  , type          = rethink.type
  ;

var  Model = rethink.createModel('tastypie_model',{
	index:      type.number()
  , guid:       type.string()
  , isActive:   type.boolean().default(false)
  , balance:    type.string()
  , picture:    type.string()
  , age:        type.number()
  , eyeColor:   type.string()
  , date:       type.date()
  , name:       type.string()
  , company:    {
  	name:type.string()
  	,address:{
  		city:type.string(),
  		state:type.string(),
  		street:type.string(),
  		country:type.string()
  	}
  }
  , email:      type.string()
  , phone:      type.string()
  , address:    type.string()
  , about:      type.string()
  , registered: type.string()
  , latitude:   type.number()
  , longitude:  type.number()
  , tags:       [type.string()]
  , range:      [type.number()]
  , friends:    [{name:type.string(), id:type.number() }]
});

describe('RethinkResource', function( ){
	var api = new Api('api/rethink')
	before(function( done ){
		var data = require('../example/data');
		
		Model.insert(data).then(function( records ){
			server.register([api], function(){
				server.start( done );
			});
		})
		.catch( console.error );
	});

	after(function( done ){
		Model.delete().then(function(){
			done()
		});
	});


	describe('filtering', function( ){

		var queryset, Mongo;
		before(function( done ){
			queryset = Model.filter({});

			Rethink = RethinkResource.extend({
				options:{

					queryset: queryset
					,filtering:{
						name:1,
						age:['lt', 'lte']
					}
				}
				,fields:{
					name:{type:'char', attribute:'name.first'},
					age:{type:'int'},
					eyes:{type:'char', attribute:'eyeColor'}
				}
			});

			api.use('test', new Rethink );
			done();
		})

		it('should respect the limit param', function( done ){
			debugger;
			server.inject({
				url:'/api/rethink/test?limit=10'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				var data = JSON.parse( response.result );
				data.data.length.should.equal( 10 );
				done();
			})
		})

		it('should respect filtering definition', function( done ){
			server.inject({
				url:'/api/rethink/test?name__istartswith=c&age__lt=100'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				var content = JSON.parse( response.result )
				done()
			})
		})

		it('should return  filters', function( done ){
			server.inject({
				url:'/api/rethink/test?name__istartswith=c&age__gt=100'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				assert.equal(response.statusCode, 400)
				done()
			})
		});

		it('should allow for nested look-ups',function( done ){
			server.inject({
				url:'/api/rethink/test?company__name__istartswith=c'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				var content = JSON.parse( response.result )
				assert.equal(response.statusCode, 200);
				content.data.length.should.be.greaterThan( 0 )
				content.data.forEach(function(item){
					if( item.company ){
						item.company.name.charAt(0).should.equal('c')
					}
				});
				
				done()
			})

		});


	})
})
