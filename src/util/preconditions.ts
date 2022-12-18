export function check(condition: any, message?: string): asserts condition {
  if (!condition) {
    console.error(message);
    throw new Error(message);
  }
}

export function checkNotNull<T>(value: T, message?: string): NonNullable<T> {
  check(value != null, message);
  return value;
}
