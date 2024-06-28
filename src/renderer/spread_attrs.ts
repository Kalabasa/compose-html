import {
  SCRIPT_DELIMITER_CLOSE,
  SCRIPT_DELIMITER_OPEN,
} from "compiler/compiler";
import { check } from "util/preconditions";
import { mapAttrsFromScript } from "./map_attrs";

export function isSpread(attr: Attr) {
  return (
    attr.name.startsWith(SCRIPT_DELIMITER_OPEN + "...") &&
    attr.name.endsWith(SCRIPT_DELIMITER_CLOSE)
  );
}

export async function spreadAttrToAttrs(
  attr: Attr,
  runCode: (code: string) => unknown
) {
  check(isSpread(attr));

  const expr = attr.name.slice(4, -1);
  const map = await runCode(`(async function(){ return ${expr} })()`);

  if (map && typeof map === "object") {
    return toAttrs(map).map(([name, value]) => ({
      name,
      value,
    }));
  }

  return [];
}

export function toAttrs(object: object) {
  return Object.entries(mapAttrsFromScript(object)).filter(
    ([, value]) => value != null
  );
}
