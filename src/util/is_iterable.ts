export function isIterable(obj: any): obj is Iterable<any> {
  return typeof (obj as Iterable<any>)[Symbol.iterator] === "function";
}
