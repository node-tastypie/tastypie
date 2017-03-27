/*jshint laxcomma: true, smarttabs: true, esnext: true, mocha: true, node:true*/
'use strict';
var should = require('should')
  , hapi = require('hapi')
  , tastypie = require('../')
  , HttpResource
  ;


HttpResource = tastypie.Resource.extend({
  options:{}
  ,constructor: function( options ){
    this.parent('constructor', options);
  }
  ,prepend_urls: function(){
    return [{
      name: 'status'
      ,path: '/api/v1/http/status/{status}'
      ,method:'*'
      ,handler: this.get_status.bind( this )
    },{
      name: 'redirect'
      ,path: '/api/v1/http/redirect/{status}'
      ,method:'*'
      ,handler: this.get_redirect.bind( this )
    }]
  }

  ,get_status: function(request, reply){
    var status = request.params.status
    return this.respond(this.bundle(request,reply), tastypie.http[status] || tastypie.http.noFound );
  }

  ,get_redirect: function( request, reply ){
    var status = request.params.status
    return this.respond(this.bundle(request,reply), tastypie.http[status] || tastypie.http.noFound, `/api/v1/fake/${status}` );
  }
});


describe('Resource', function(){
  describe('http responses',function(){
    var server
    before(function(done){
      server = new hapi.Server();
      server.connection({host:'localhost'})

      var api = new tastypie.Api('/api/v1');
      api.use('http',new HttpResource())
      server.register( api, done )
    })

    it('should responsd with a 101 using http.switching', function( done ){
      server.inject({
        url:'/api/v1/http/status/switching'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 101 );
        done()
      })
    })

    it('should responsd with a 102 using http.processing', function( done ){
      server.inject({
        url:'/api/v1/http/status/processing'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 102 );
        done()
      })
    })

    it('should responsd with a 201 using http.created', function( done ){
      server.inject({
        url:'/api/v1/http/status/created'
        ,method:'POST'
      },function( response ){
        response.statusCode.should.equal( 201 );
        done()
      })
    })

    it('should responsd with a 202 using http.accepted', function( done ){
      server.inject({
        url:'/api/v1/http/status/accepted'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 202 );
        done()
      })
    })

    it('should responsd with a 203 using http.nonAutoritative', function( done ){
      server.inject({
        url:'/api/v1/http/status/nonAutoritative'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 203 );
        done()
      })
    })

    it('should responsd with a 204 using http.noContent', function( done ){
      server.inject({
        url:'/api/v1/http/status/noContent'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 204 );
        done()
      })
    })

    it('should responsd with a 205 using http.resetContent', function( done ){
      server.inject({
        url:'/api/v1/http/status/resetContent'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 205 );
        done()
      })
    })

    it('should responsd with a 206 using http.partialContent', function( done ){
      server.inject({
        url:'/api/v1/http/status/partialContent'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 206 );
        done()
      })
    })


    it('should responsd with a 400 using http.badRequest', function( done ){
      server.inject({
        url:'/api/v1/http/status/badRequest'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 400 );
        done()
      })
    })

    it('should responsd with a 401 using http.unauthorized', function( done ){
      server.inject({
        url:'/api/v1/http/status/unauthorized'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 401 );
        done()
      })
    })

    it('should responsd with a 403 using http.forbidden', function( done ){
      server.inject({
        url:'/api/v1/http/status/forbidden'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 403 );
        done()
      })
    })


    it('should responsd with a 404 using http.notFound', function( done ){
      server.inject({
        url:'/api/v1/http/status/notFound'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 404 );
        done()
      })
    });

    it('should responsd with a 405 using http.methodNotAllowed', function( done ){
      server.inject({
        url:'/api/v1/http/status/methodNotAllowed'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 405 );
        done()
      })
    })

    it('should responsd with a 406 using http.notAcceptable', function( done ){
      server.inject({
        url:'/api/v1/http/status/notAcceptable'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 406 );
        done()
      })
    });

    it('should responsd with a 407 using http.proxyAuthenticationRequired', function( done ){
      server.inject({
        url:'/api/v1/http/status/proxyAuthenticationRequired'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 407 );
        done()
      })
    });

    it('should responsd with a 408 using http.requestTimeout', function( done ){
      server.inject({
        url:'/api/v1/http/status/requestTimeout'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 408 );
        done()
      })
    });

    it('should responsd with a 409 using http.conflict', function( done ){
      server.inject({
        url:'/api/v1/http/status/conflict'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 409 );
        done()
      })
    });

    it('should responsd with a 410 using http.gone', function( done ){
      server.inject({
        url:'/api/v1/http/status/gone'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 410 );
        done();
      })
    });

    it('should responsd with a 411 using http.lengthRequired', function( done ){
      server.inject({
        url:'/api/v1/http/status/lengthRequired'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 411 );
        done()
      })
    });

    it('should responsd with a 412 using http.preconditionFailed', function( done ){
      server.inject({
        url:'/api/v1/http/status/preconditionFailed'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 412 );
        done()
      })
    });

    it('should responsd with a 413 using http.payloadTooLarge', function( done ){
      server.inject({
        url:'/api/v1/http/status/payloadTooLarge'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 413 );
        done()
      })
    });

    it('should responsd with a 415 using http.unsupportedMediaType', function( done ){
      server.inject({
        url:'/api/v1/http/status/unsupportedMediaType'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 415 );
        done()
      })
    });

    it('should responsd with a 417 using http.expectationFailed', function( done ){
      server.inject({
        url:'/api/v1/http/status/expectationFailed'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 417 );
        done()
      })
    });

    it('should responsd with a 422 using http.unprocessableEntity', function( done ){
      server.inject({
        url:'/api/v1/http/status/unprocessableEntity'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 422 );
        done()
      })
    });

    it('should responsd with a 429 using http.tooManyRequests', function( done ){
      server.inject({
        url:'/api/v1/http/status/tooManyRequests'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 429 );
        done()
      })
    });

    it('should responsd with a 500 using http.serverError', function( done ){
      server.inject({
        url:'/api/v1/http/status/serverError'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 500 );
        done()
      })
    });

    it('should responsd with a 501 using http.notImplemented', function( done ){
      server.inject({
        url:'/api/v1/http/status/notImplemented'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 501 );
        done()
      })
    });

    it('should responsd with a 502 using http.badGateway', function( done ){
      server.inject({
        url:'/api/v1/http/status/badGateway'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 502 );
        done()
      })
    });

    it('should responsd with a 503 using http.serviceUnavailable', function( done ){
      server.inject({
        url:'/api/v1/http/status/serviceUnavailable'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 503 );
        done()
      })
    });

    it('should responsd with a 504 using http.gatewayTimeout', function( done ){
      server.inject({
        url:'/api/v1/http/status/gatewayTimeout'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 504 );
        done()
      })
    });

    it('should responsd with a 505 using http.httpVersionNotSupported', function( done ){
      server.inject({
        url:'/api/v1/http/status/httpVersionNotSupported'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 505 );
        done()
      })
    });

    it('should responsd with a 507 using http.insufficientStorage', function( done ){
      server.inject({
        url:'/api/v1/http/status/insufficientStorage'
        ,method:'GET'
      },function( response ){
        response.statusCode.should.equal( 507 );
        done()
      })
    });

    describe("redirects", function(){

      it('should responsd with a 301 using http.movedPermanently', function( done ){
        server.inject({
          url:'/api/v1/http/redirect/movedPermanently'
          ,method:'GET'
        },function( response ){
          response.statusCode.should.equal( 301 );
          response.headers.location.should.equal('/api/v1/fake/movedPermanently')
          done()
        })
      });

      it('should responsd with a 302 using http.found', function( done ){
        server.inject({
          url:'/api/v1/http/redirect/found'
          ,method:'GET'
        },function( response ){
          response.statusCode.should.equal( 302 );
          response.headers.location.should.equal('/api/v1/fake/found')
          done()
        })
      });

      it('should responsd with a 303 using http.seeOther', function( done ){
        server.inject({
          url:'/api/v1/http/redirect/seeOther'
          ,method:'GET'
        },function( response ){
          response.statusCode.should.equal( 303 );
          response.headers.location.should.equal('/api/v1/fake/seeOther')
          done()
        })
      });

      it('should responsd with a 306 using http.switchProxy', function( done ){
        server.inject({
          url:'/api/v1/http/redirect/switchProxy'
          ,method:'GET'
        },function( response ){
          response.statusCode.should.equal( 306 );
          response.headers.location.should.equal('/api/v1/fake/switchProxy')
          done()
        })
      });

      it('should responsd with a 307 using http.temporaryRedirect', function( done ){
        server.inject({
          url:'/api/v1/http/redirect/temporaryRedirect'
          ,method:'GET'
        },function( response ){
          response.statusCode.should.equal( 307 );
          response.headers.location.should.equal('/api/v1/fake/temporaryRedirect')
          done()
        })
      });

    })

  })
})
