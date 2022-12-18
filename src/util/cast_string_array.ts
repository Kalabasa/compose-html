import { check } from "util/preconditions";

export function castStrArr<T extends any[]>(array: T): T & string[] {
  check(array.every((item) => typeof item === "string"));
  return array;
}
