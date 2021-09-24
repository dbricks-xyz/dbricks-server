import {dedupObject} from "./docs.generator";

describe('docs generation logic', () => {
  it('dedups objects and arrays ok', () => {
    const o = {
      //basic types
      a: 'string',
      b: true,
      c: 123,
      //triple nested array
      d: [{
        a: 'string',
        b: true,
        c: 123,
        d: [{
          a: 'string',
          b: true,
          c: 123,
          d: [{
            a: 'string',
            b: true,
            c: 123,
          }, {
            a: 'string',
            b: true,
            c: 123,
          }]
        }, {
          a: 'string',
          b: true,
          c: 123,
          d: [{
            a: 'string',
            b: true,
            c: 123,
          }, {
            a: 'string',
            b: true,
            c: 123,
          }]
        }]
      }, {
        a: 'string',
        b: true,
        c: 123,
        d: [{
          a: 'string',
          b: true,
          c: 123,
        }, {
          a: 'string',
          b: true,
          c: 123,
        }]
      }],
      //triple nested object
      e: {
        a: 'string',
        b: true,
        c: 123,
        d: {
          a: 'string',
          b: true,
          c: 123,
          d: {
            a: 'string',
            b: true,
            c: 123,
            d: [5,6,7]
          }
        }
      }
    }
    const result = dedupObject(o);
    //all arrays must be shortened to 1
    expect(result.d.length).toEqual(1);
    expect(result.d[0].d.length).toEqual(1);
    expect(result.d[0].d[0].d.length).toEqual(1);
    //max depth is indeed reached
    expect(result.e.d.d.d.length).toEqual(1);
    expect(result.e.d.d.d[0]).toEqual(5);
  })
})