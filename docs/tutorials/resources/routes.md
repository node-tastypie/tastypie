While tastypie makes it easy to quickly create CRUD endpoints for data soures, it is certainly not restricted to dealing only with CRUD operations. You can define any number of endpoints to do whatever you want. To create a custom set of endpoints there are three basic things you need to do:


* Define a route
* Define a handler
* Define Method Access

[Last time](/2015/06/25/custom-api-resources-with-node-tastypie) we wrote a very simple resource that allowed use to just return simple objects. We are going to continue with that example by adding some custom routes to it. If you are joining in late, here is the example as we left it last time.

```
var Resource = require('tastypie').Resource; 
 
var Simple = Resource.extend({  
    get_list: function( bundle ){ 
        // use the respond method if you 
        // want serialization, status code, etc... 
        bundle.data = { key:'value' }; 
        return this.respond( bundle ) 
    } 
    , get_detail: function( bundle ){ 
        // or just send a straight response. 
        return bundle.res({succes:1}).code( 200 ) 
    } 
    , put_detail: function( bundle ){ 
        return bundle.res({any:'data you want'}).code( 202 ) 
    } 
    , post_list: function( bundle ){ 
        var data = bundle.req.payload; 
        // do something with the data. 
        return bundle.res({any:'data you want'}).code( 201 ) 
    } 
    , delete_detail: function( bundle ){ 
        return bundle.res().code( 204 ) 
    } 
});
```

#### Define A Route

For this example we are going to add a sub resource onto the detail endpoint ( `/api/v1/simple/{id}/foobar` ). Resources have two instance methods that are used to create route definitions, [base\_urls](https://github.com/esatterwhite/node-tastypie/blob/v0.4.4/lib/resource/index.js#L242) and [prepend\_urls](https://github.com/esatterwhite/node-tastypie/blob/v0.4.4/lib/resource/index.js#L715). `base_urls` is the method that defines the `list`, `detail` and `schema` routes. You don't really need to worry about this one unless you want to remove something. `prepend_url` returns an array of objects that gets added on to the base urls. By default it returns an empty array, so we just need to fill it in. Each definition in the array needs to have a `name`, `route` and `handler` property

<table class="striped hoverable">
  <thead>
     <th>property</th><th>usage</th>
  </thead>
  <tbody>
     <tr>
        <td>path</td>
        <td>a full relative url</td>
     </tr>
     <tr>
        <td>name</td>
        <td>A unique name of the endpoint</td>
     </tr>
     <tr>
        <td>handler</td>
        <td>A route handler for hapi.js</td>
     </tr>
  </tbody>
</table>

So we just define the `prepend_urls` method here:

```
var Resource = require('tastypie').Resource; 
 
var Simple = Resource.extend({
    prepend_urls: function( ){
        return[{
           path: '/api/v1/simple/{pk}/foobar',
           name:'foobar',
           handler: this.dispatch_foobar.bind( this )
        }]
    }
});
```

#### Define A Handler

What the *handler* function does is really up to you. This method is used as the Hapi route handler, and will be passed the `request` and `reply` object directly from hapi. However, to take the advantage of all of the tastypie infrastructure, you will want to funnel everything through the [dispatch](https://github.com/esatterwhite/node-tastypie/blob/v0.4.4/lib/resource/index.js#L280) function on the resource. In the example above, we have told the resource to call `dispatch_foobar`, which would look something like this

```
, dispatch_foobar: function( req, reply ){
   // Do some custom logic & fancy magic

   return this.dispatch( 'foobar', this.bundle( req, reply ) );
}
```

That is it -  `dispatch` kicks off the rest; **throttling**, **method checks**, **caching**, and determines the right instance method to call, `<HTTPVERB>_<ACTION>`. For example, to handle **GET** requests for particular example, we need to define a `get_foobar` method. You can do what ever you really want, but the general pattern is to give the request bundle a data property, and pass it to the `respond` instance method. The `respond` method handles content negotiation, serialization and status codes.

```
, get_foobar: function( bundle ){
   // all the magic you want
   bundle.data = { foo: 'bar' };
   return this.respond( bundle, tastypie.http.ok );
}
```  

If you want to make use of defined fields for advanced data preperation, you can use the hydrate ( incoming ) / dehydrate ( outgoing ) methods on the instance. 

```
, get_foobar: function( bundle ){
   // all the magic you want
   getData( function( err, data ){
       this.full_dehydtate( data, bundle, function(e, dhyd ){
             bundle.data = dhyd;
             return this.respond( bundle );
       }.bind( this ) );
   }.bind( this ) );
}
```  

#### Define Method Access

A resource allows you to specifiy which HTTP Verbs are allowed for each action that is defined, `foobar` in our case. To do that you can define an object in options, `allowed` where the **keys** a hash of the actions & the allowed http verbs for the actions. So too allow get requests, we set the get property to true.

If the property is set to `false`, tastypie will automatically respond with a `405` Method Not Allowed. If the property is true, but you have not defined the appropriate instance methods, tastypie will respond with a `501` Not Implemented.

**NOTE**: things in `options` are configurable when an instance of your resource is created ( `new Simple( { options } )` ). they are also inherited by sub classes, 

```
var Simple = Resource.extend({
    options:{
      allowed:{ 
        foobar:{ get: true }
      }
    }
});
```

That is all there is to it. You can really be as simple or as complex as you need and/or want to be, and make use of as much tastypie as you want. Our final resource with a custom *foobar* action might look like this:

```
var Resource = require('tastypie').Resource; 
 
var Simple = Resource.extend({
    options:{
      allowed: {
        foobar:{ get: true }
      }
    }

   , fields: {
      // default field definitions
   }

    , get_list: function( bundle ){ 
        // use the respond method if you 
        // want serialization, status code, etc... 
        bundle.data = { key:'value' }; 
        return this.respond( bundle ) 
    } 

    , get_detail: function( bundle ){ 
        // or just send a straight response. 
        return bundle.res({succes:1}).code( 200 ) 
    } 

    , put_detail: function( bundle ){ 
        return bundle.res({any:'data you want'}).code( 202 ) 
    } 

    , post_list: function( bundle ){ 
        var data = bundle.req.payload; 
        // do something with the data. 
        return bundle.res({any:'data you want'}).code( 201 ) 
    } 

    , delete_detail: function( bundle ){ 
        return bundle.res().code( 204 ) 
    }

   // CUSTOM Resource Action setup
   , prepend_urls: function( ){
        return[{
           path: '/api/v1/simple/{pk}/foobar',
           name:'foobar',
           handler: this.dispatch_foobar.bind( this )
        }]
    }

   , dispatch_foobar: function( req, reply ){
      // Do some custom logic & fancy magic

      return this.dispatch( 'foobar', this.bundle( req, reply ) );
   }

   , get_foobar: function( bundle ){
      // all the magic you want
      getData( function( err, data ){
         this.full_dehydtate( data, bundle, function(e, dhyd ){
            // set data & respond
            bundle.data = dhyd;
            return this.respond( bundle );
         }.bind( this ) );
      }.bind( this ) );
   }
});
```
