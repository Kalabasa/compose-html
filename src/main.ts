import { parse } from "dom/dom";
import { Renderer } from "renderer/renderer";

const renderer = new Renderer();
const element = parse('<div>hello</div>');
console.log(renderer.render(element));
console.log("Hello");
