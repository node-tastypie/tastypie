var async = require('async')
  , hapi = require('hapi')
  , sinon = require('sinon')
  , Api = require('../lib/api')
  , Resource = require("../lib/resource")
  , Cache = require('../lib/cache')
  ;

describe('resource', function(){
  var resource, server, c, instance;
  before( function( done ){
    server = new hapi.Server({});
    server.connection({host:'localhost'})
    resource = Resource.extend({
      options:{
        cache: {
          engine: 'catbox-memory'
        }
        
      }
      ,get_object:function( bundle, callback ){
        callback(null, { key:new Date() } )
      }
    });
    done();
  })
  describe('cached', function(){
    before(function( done ){
      var api = new Api('resource/spec')
      instance = new resource();
      api.use('cached', instance);

      instance.get_object = sinon.spy( instance.get_object );
      server.register( [api], done )
    });

    it('should cache detail GET requests', function( done ){
      async.series([
        function( callback ){
          server.inject({
            url:'/resource/spec/cached/1',
            method:'get',
            headers:{
              Accept:'application/json'
            }
          },function( response ){
            response.statusCode.should.equal( 200 );
            callback()
          })
        },
        function( callback ){
          server.inject({
            url:'/resource/spec/cached/1',
            method:'get',
            headers:{
              Accept:'application/json'
            }
          },function( response ){
            response.statusCode.should.equal( 200 );
            callback()
          })
        }
      ], function( ){
        instance.get_object.calledOnce.should.equal( true )
        Object
          .keys( instance.cache  )
          .forEach(function( partition ){
            Object.keys( instance.cache[ partition ] ).length.should.be.greaterThan(0)
          })
        done();
      })
    });
  });
});
