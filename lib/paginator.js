/*jshint laxcomma:true, smarttabs: true, node:true */
'use strict';
/**
 * @module tastypie/lib/paginator
 * @author Eric Satterwhite
 * @requires util
 * @requires module:class
 * @requires module:class/options
 * @requires module:class/parent
 * @requires mout/lang/kindOf
 * @since 0.1.0

 **/

exports.local = function page(prefix, limit = 25, offset = 0, objects = [], total = null, max = 1000, property = 'data'){

    const next = offset + limit
    const prev = offset - limit
    const count = objects.length

    return {
      meta: {
         next: (next < count) ? `${prefix}?limit=${limit}&offset=${next}` : null
       , previous: prev < 0 ? null : `${prefix}?limit=${limit}&offset=${prev}` 
       , count
       , limit
       , offset
      }
      ,  [property]: objects.slice(offset, limit < 0 ? count : offset + limit )
    }
}

exports.remote = function page(prefix, limit = 25, offset = 0, objects = [], total = 0, max = 1000, property = 'data'){
    const next     = offset + limit
    const prev     = offset - limit

    return {
      meta: {
         next: (next < total) ? `${prefix}?limit=${limit}&offset=${next}` : null
       , previous: prev < 0 ? null : `${prefix}?limit=${limit}&offset=${prev}` 
       , count: objects.length
      }
      ,  [property]: objects
    }
}
