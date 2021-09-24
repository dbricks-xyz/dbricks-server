import {Method} from "axios";
import fs from "fs";

export function saveReqResToJSON(
  name: string,
  method: Method,
  route: string,
  req: any,
  res: any,
) {
  const dedupedRes = dedupHighLevel(res);
  const finalObj = {
    route: `${method} ${route}`,
    req,
    reqSchema: parseHighLevelType(req),
    res: dedupedRes,
    resSchema: parseHighLevelType(dedupedRes),
  }

  const finalObjStr = JSON.stringify(finalObj);
  fs.writeFileSync(`docs/out/${name}.json`, finalObjStr);
}

// --------------------------------------- dedup logic

export function dedupHighLevel(x: any): any {
  if (parseType(x) === 'dict') {
    return dedupObject(x)
  } else if (parseType(x) === 'array') {
    return dedupArray(x)
  }
  return x
}

export function dedupObject(o: any): any {
  const newObj = {};
  for (const [key, value] of Object.entries(o)) {
    if (parseType(value) === 'array') {
      // @ts-ignore
      newObj[key] = dedupArray(value)
    } else if (parseType(value) === 'dict') {
      // @ts-ignore
      newObj[key] = dedupObject(value)
    } else {
      // @ts-ignore
      newObj[key] = value;
    }
  }
  return newObj;
}

export function dedupArray<T>(a: Array<T>): Array<T> {
  const firstItem = a[0];
  if (parseType(firstItem) === 'dict') {
    return [dedupObject(firstItem)]
  }
  return [a[0]]
}

// --------------------------------------- parsing logic

export function parseHighLevelType(x: any): any {
  if (parseType(x) === 'dict') {
    return parseObjectType(x)
  } else if (parseType(x) === 'array') {
    return parseArrayType(x)
  }
  return x
}

export function parseObjectType(o: any): any {
  const newObj = {};
  for (const [key, value] of Object.entries(o)) {
    if (parseType(value) === 'array') {
      // @ts-ignore
      newObj[key] = parseArrayType(value)
    } else if (parseType(value) === 'dict') {
      // @ts-ignore
      newObj[key] = parseObjectType(value)
    } else {
      // @ts-ignore
      newObj[key] = parseType(value);
    }
  }
  return newObj;
}

export function parseArrayType<T>(a: Array<T>): Array<T> {
  const firstItem = a[0];
  if (parseType(firstItem) === 'dict') {
    return [parseObjectType(firstItem)]
  } else if (parseType(firstItem) === 'array') {
    // @ts-ignore
    return [parseArrayType(firstItem)]
  }
  // @ts-ignore
  return [parseType(a[0])]
}

export function parseType<T>(v: T): string {
  if (v === null || v === undefined) {
    return 'null';
  } else if (typeof (v) === 'object') {
    if (v instanceof Array) {
      return 'array';
    } else if (v instanceof Date) {
      return 'date'
    }
    return 'dict'
  }
  return typeof (v)
}

