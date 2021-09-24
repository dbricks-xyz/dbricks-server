import {Method} from "axios";
import fs from "fs";

//todo desc
//todo schema
export function saveReqResToJSON(
  name: string,
  desc: string,
  method: Method,
  route: string,
  req: any,
  res: any,
) {
  const reqSchema = {};
  const resSchema = {};
  for (const [key, value] of Object.entries(req)) {
    // @ts-ignore
    reqSchema[key] = parseType(value)
  }
  for (const [key, value] of Object.entries(res[0])) {
    // @ts-ignore
    resSchema[key] = parseType(value)
  }

  const finalObj = {
    route: `${method} ${route}`,
    desc,
    req,
    reqSchema,
    res: dedupObject(res),
    resSchema,
  }

  const finalObjStr = JSON.stringify(finalObj);
  fs.writeFileSync(`docs/out/${name}.json`, finalObjStr);
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