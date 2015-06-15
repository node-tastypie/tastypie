/*jshint laxcomma: true, smarttabs: true, node: true, mocha: true*/
var should        = require('should')
  , assert        = require('assert')
  , server        = require('./server')
  , Api           = require('../lib/api')
  , Resource      = require( '../lib/resource' )
  , MongoResource = require( '../lib/resource/mongoose' )
  , xml2js        = require( 'xml2js' )
  , mongoose      = require( 'mongoose' )
  , fs            = require('fs')
  , path          = require('path')
  , fields        = require('../lib/fields')
  , http          = require('../lib/http')
  ;

var connection = mongoose.createConnection('mongodb://127.0.0.1:27017/test')
var  Schema = new mongoose.Schema({
	index:      {type:Number}
  , guid:       {type:String}
  , isActive:   {type:Boolean}
  , balance:    {type:String}
  , picture:    {type:String}
  , age:        {type:Number}
  , eyeColor:   {type:String, enum:['green','blue', 'brown','hazel', 'black']}
  , date:       {type:Date}
  , name:       {type:String}
  , company:    {
  	name:{type:String}
  	,address:{
  		city:{type:String},
  		state:{type: String},
  		street:{type: String},
  		country:{type:String}
  	}
  }
  , email:      {type:String}
  , phone:      {type:String}
  , address:    {type:String}
  , about:      {type:String}
  , registered: {type:String}
  , latitude:   {type:Number}
  , longitude:  {type:Number}
  , tags:       [{type:String}]
  , range:      [{type:Number}]
  , friends:    {name:{type:String}, id:{type:Number} }
},{collection:'tastypie'});

var Model = connection.model("Test", Schema )
describe('MongoResource', function( ){
	var mongo = new Api('api/mongo')
	before(function( done ){

		Model.create( require('../example/data'), function( err, records){
			server.register([mongo], function(){
				server.start( done )
			})
		});
	});

	after(function( done ){
		Model.remove( done )
	});


	describe('filtering', function( ){

		var queryset, Mongo;
		before(function( done ){
			queryset = Model.find().limit( 25 ).toConstructor();

			Mongo = MongoResource.extend({
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

			mongo.use('test', new Mongo );
			done();
		})

		it('should respect the limit param', function( done ){
			server.inject({
				url:'/api/mongo/test?limit=10'
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
				url:'/api/mongo/test?name__istartswith=c&age__lt=100'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			},function( response ){
				done()
			})
		})

		it('should return  filters', function( done ){
			server.inject({
				url:'/api/mongo/test?name__istartswith=c&age__gt=100'
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
				url:'/api/mongo/test?company__name__istartswith=c'
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
