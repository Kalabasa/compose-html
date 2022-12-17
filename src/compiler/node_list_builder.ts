import { isText, createTextNode } from "dom/dom";

export class NodeListBuilder {
  private nodes: Node[] = [];

  public collect(): Node[] {
    return this.nodes;
  }

  public append(...content: (string | Node)[]) {
    for (let item of content) {
      if (isText(item)) {
        item = item.textContent ?? "";
      }

      if (typeof item === "string") {
        if (!item) continue;

        const lastNode = this.nodes[this.nodes.length - 1];
        if (isText(lastNode)) {
          lastNode.textContent += item;
        } else {
          this.nodes.push(createTextNode(item));
        }
      } else {
        this.nodes.push(item);
      }
    }
  }
}
