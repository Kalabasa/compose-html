import * as acorn from "acorn";
declare module "acorn-loose" {
  export const parse: typeof acorn.parse;
}
