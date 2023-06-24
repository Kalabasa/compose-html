export function check(
  condition: any,
  message: string = "Precondition not satisfied."
): asserts condition {
  if (!condition) {
    console.error(message);
    throwError(message);
  }
}

export function checkNotNull<T>(
  value: T,
  message: string = "Unexpected null value."
): NonNullable<T> {
  check(value != null, message);
  return value;
}

function throwError(message: string): never {
  const error = new Error(message);

  // clean stack trace
  if (error.stack && typeof error.stack === "string") {
    const lines = error.stack.split("\n");
    // omit util/precondition calls
    const cleanLines = lines.filter(
      (line) => !/^\s+at .*?\butil\/preconditions\.ts\b/.test(line)
    );
    error.stack = cleanLines.join("\n");
  }

  throw error;
}
