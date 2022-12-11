import { check } from "util/preconditions";
import { TextProcessor } from "./text_processor";

type FoundDelimiters = Array<{
  index: number;
  levelInside: number;
  type: string;
}>;

export function findDelimiters(
  open: string,
  close: string,
  node: Node
): FoundDelimiters {
  const text = new TextProcessor(node);
  const openMatcher = new GreedyMatcher(open);
  const closeMatcher = new GreedyMatcher(close);

  let found: FoundDelimiters = [];
  let currentLevel = 0;

  let i = 0;
  while (true) {
    const char = text
      .readUntil(++i)
      .find((item) => typeof item === "string") as string;
    if (!char) break;
    check(char.length === 1);

    if (char === "\\") {
      text.readUntil(++i);
      continue;
    }

    const matchesOpen = openMatcher.feed(char);
    const matchesClose = closeMatcher.feed(char);

    if (matchesOpen) {
      currentLevel++;
      found.push({
        index: i - open.length,
        levelInside: currentLevel,
        type: open,
      });
    } else if (matchesClose) {
      found.push({
        index: i - close.length,
        levelInside: currentLevel,
        type: close,
      });
      currentLevel--;
    }
  }

  return found;
}

class GreedyMatcher {
  private index: number = 0;

  constructor(private readonly target: string) {}

  public feed(char: string): boolean {
    if (this.target[this.index] === char) {
      this.index++;
      if (this.index >= this.target.length) {
        this.index = 0;
        return true;
      }
    } else {
      this.index = 0;
    }
    return false;
  }
}
