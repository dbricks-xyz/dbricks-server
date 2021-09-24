import {dedupObject, parseObjectType} from "./docs.generator";

describe('docs generation logic', () => {
  const o = {
    //basic types
    a: 's',
    b: true,
    c: 123,
    //triple nested array
    d: [{
      a: 's',
      b: true,
      c: 123,
      d: [{
        a: 's',
        b: true,
        c: 123,
        d: [{
          a: 's',
          b: true,
          c: 123,
        }, {
          a: 's',
          b: true,
          c: 123,
        }]
      }, {
        a: 's',
        b: true,
        c: 123,
        d: [{
          a: 's',
          b: true,
          c: 123,
        }, {
          a: 's',
          b: true,
          c: 123,
        }]
      }]
    }, {
      a: 's',
      b: true,
      c: 123,
      d: [{
        a: 's',
        b: true,
        c: 123,
      }, {
        a: 's',
        b: true,
        c: 123,
      }]
    }],
    //triple nested object
    e: {
      a: 's',
      b: true,
      c: 123,
      d: {
        a: 's',
        b: true,
        c: 123,
        d: {
          a: 's',
          b: true,
          c: 123,
          d: [5, 6, 7],
          e: [[8,9,10]]
        }
      }
    }
  }

  it('dedups objects and arrays', () => {
    const result = dedupObject(o);
    //all arrays must be shortened to 1
    //this includes arrays inside arrays
    expect(result.d.length).toEqual(1);
    expect(result.d[0].d.length).toEqual(1);
    expect(result.d[0].d[0].d.length).toEqual(1);
    //and arrays inside objects
    expect(result.e.d.d.d.length).toEqual(1);
    expect(result.e.d.d.d[0]).toEqual(5);
    expect(result.e.d.d.e[0][0]).toEqual(8);
  })

  it('parses objects and arrays', () => {
    const result = parseObjectType(o);
    expect(result.a).toEqual('string')
    expect(result.b).toEqual('boolean')
    expect(result.c).toEqual('number')
    expect(result.d[0].a).toEqual('string')
    expect(result.d[0].d[0].a).toEqual('string')
    expect(result.d[0].d[0].d[0].a).toEqual('string')
    expect(result.e.a).toEqual('string');
    expect(result.e.d.a).toEqual('string');
    expect(result.e.d.d.a).toEqual('string');
    expect(result.e.d.d.d[0]).toEqual('number');
    expect(result.e.d.d.e[0][0]).toEqual('number');
  })
})