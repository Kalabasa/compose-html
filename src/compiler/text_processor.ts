import { childNodesOf, isText } from "dom/dom";
import { check } from "util/preconditions";

// Tool for iterating over top-level text contents of a node
export class TextProcessor {
  private totalScannedLength = 0;
  private currentNodeIndex: number;
  private currentNodeTextOffset: number = 0;
  private readonly sourceNodes: Node[];

  constructor(sourceNode: Node) {
    this.sourceNodes = isText(sourceNode)
      ? [sourceNode]
      : Array.from(childNodesOf(sourceNode));

    this.currentNodeIndex = 0;
    while (
      !isText(this.sourceNodes[this.currentNodeIndex]) &&
      this.currentNodeIndex < this.sourceNodes.length
    ) {
      this.currentNodeIndex++;
    }
  }

  public readUntil(targetIndex: number): (string | Node)[] {
    check(targetIndex >= this.totalScannedLength);
    if (this.currentNodeIndex >= this.sourceNodes.length) return [];

    let read = [];

    let localText: string;
    let localTargetIndex: number;
    while (true) {
      const currentNode = this.sourceNodes[this.currentNodeIndex];
      check(isText(currentNode));
      localText = currentNode.textContent ?? "";
      localTargetIndex = targetIndex - this.currentNodeTextOffset;

      const substring = localText.substring(
        this.totalScannedLength - this.currentNodeTextOffset,
        localTargetIndex
      );
      if (substring) {
        read.push(substring);
      }

      if (localTargetIndex <= localText.length) {
        // target index is within current node
        this.totalScannedLength = targetIndex;
        return read;
      } else {
        // target index is beyond current node

        // find next text node
        while (true) {
          this.currentNodeIndex++;
          if (this.currentNodeIndex >= this.sourceNodes.length) return read;
          if (isText(this.sourceNodes[this.currentNodeIndex])) {
            break;
          } else {
            read.push(this.sourceNodes[this.currentNodeIndex]);
          }
        }

        this.currentNodeTextOffset =
          this.currentNodeTextOffset + localText.length;

        this.totalScannedLength = this.currentNodeTextOffset;

        if (this.currentNodeIndex >= this.sourceNodes.length) return read;
      }
    }
  }
}
