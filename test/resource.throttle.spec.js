var should = require('should')
  , assert = require('assert')
  , async  = require('async')
  , Api    = require('../lib/api')
  , hapi = require("hapi")
  , Resource = require('../lib/resource')
  , Throttle = require('../lib/throttle')


var Base = Resource.extend({
  get_objects: function( bundle, cb ){
    cb(null,JSON.stringify( [{key:'value'}] ) );  
  }
})

describe('resource', function(){
  var api, endpoints, server;
  
  before(function(){
    server = new hapi.Server({  });
    server.connection({host:'localhost'});

  });

  describe('throttled', function(){

    before(function( done ){
      api = new Api('spec/resource')

      api.use('throttled', new Base({
          throttle: new Throttle.Memory({ at: 5, timeframe:1000 })
        })
      )

      server.register( [api], function(e ){
        server.start( done )
      })
    });

    after(function( done ){
      server.stop( done )
    });

    it('should throttle requests', function(  done ){
      async.parallel({
        zero:function( callback ){
          server.inject({
            method:'get',
            url:'/spec/resource/throttled',
            headers:{
              Accept:'application/json',
              'Content-Type':"application/json"
            }
          },function( response ){
            callback(null,  response.statusCode );
          })          
        }
        ,one:function( callback ){
          server.inject({
            method:'get',
            url:'/spec/resource/throttled',
            headers:{
              Accept:'application/json',
              'Content-Type':"application/json"
            }
          },function( response ){

            callback(null,  response.statusCode );
          })
        }
        ,two:function( callback ){
          server.inject({
            method:'get',
            url:'/spec/resource/throttled',
            headers:{
              Accept:'application/json',
              'Content-Type':"application/json"
            }
          },function( response ){
            callback(null,  response.statusCode );
          })
        }
        ,three:function( callback ){
          server.inject({
            method:'get',
            url:'/spec/resource/throttled',
            headers:{
              Accept:'application/json',
              'Content-Type':"application/json"
            }
          },function( response ){
            callback(null,  response.statusCode );
          })
        }
        ,four:function( callback ){
          server.inject({
            method:'get',
            url:'/spec/resource/throttled',
            headers:{
              Accept:'application/json',
              'Content-Type':"application/json"
            }
          },function( response ){
            callback(null,  response.statusCode );
          })
        }
        ,five:function( callback ){
          server.inject({
            method:'get',
            url:'/spec/resource/throttled',
            headers:{
              Accept:'application/json',
              'Content-Type':"application/json"
            }
          },function( response ){
            callback(null,  response.statusCode );
          })
        }
        ,six:function( callback ){
          server.inject({
            method:'get',
            url:'/spec/resource/throttled',
            headers:{
              Accept:'application/json',
              'Content-Type':"application/json"
            }
          },function( response ){
            callback(null,  response.statusCode );
          })
        }
      }, function( err, results ){

        results.zero.should.equal( 200, "zero should be a 200 response" )
        results.one.should.equal( 200, "one should be a 200 response" )
        results.two.should.equal( 200, "two should be a 200 response" )
        results.three.should.equal( 200, "three should be a 200 response" )
        results.four.should.equal( 200, "four should be a 200 response" )
        results.five.should.equal( 429  )
        results.six.should.equal( 429  )
        done()
      })
    })
  })
})
