export function isIterable(obj: any): obj is Iterable<any> {
  return typeof (obj as Iterable<any>)[Symbol.iterator] === "function";
}

export function isAsyncIterable(obj: any): obj is AsyncIterable<any> {
  return typeof (obj as AsyncIterable<any>)[Symbol.asyncIterator] === "function";
}
