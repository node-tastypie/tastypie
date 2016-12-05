'use strict'

const assert    = require('assert')
    , should    = require('should')
    , paginator = require('../lib/paginator')
    ;

describe('paginator', () => {
    describe('local', () => {
        const page = paginator.local
            , prefix = '/foo/bar'
            ;
            
        it('should not page when set is smaller than limit', (  ) => {
            const limit = 25
            const objects = [1,2,3,4,5,6,7,8,9,10]
            const offset = 0
            const values = page(prefix, limit, offset, objects)

            assert.strictEqual(values.meta.next, null)
            assert.strictEqual(values.meta.previous, null)
        });

        it('next page', () => {
          const limit = 25
          const objects = new Array(26).fill('x')
          const offset = 0
          const values = page(prefix, limit, offset, objects)
          const expected = `${prefix}?limit=${limit}&offset=${offset + limit}`
          values.meta.next.should.equal( expected )
          assert.equal(values.meta.previous, null )
        })

        it('prev page', () => {
          const limit = 25
          const objects = new Array(26).fill('x')
          const offset = 25
          const values = page(prefix, limit, offset, objects)
          const expected = `${prefix}?limit=${limit}&offset=${offset - limit}`
          assert.equal(values.meta.next, null )
          values.meta.previous.should.equal( expected )
        })

        it('both pages', () => {
          const limit = 10
          const objects = new Array(25).fill('x')
          const offset = 10
          const values = page(prefix, limit, offset, objects)
          const prev = `${prefix}?limit=${limit}&offset=${offset - limit}`
          const next = `${prefix}?limit=${limit}&offset=${offset + limit}`
          values.meta.next.should.equal( next )
          values.meta.previous.should.equal( prev )
        })
    });
});
