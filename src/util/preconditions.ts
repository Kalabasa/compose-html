export function check(condition: boolean, message?: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function checkNotNull<T>(value: T, message?: string): NonNullable<T> {
  check(value != null, message);
  return value;
}
