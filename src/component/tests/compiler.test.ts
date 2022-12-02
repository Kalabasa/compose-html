import { compile } from "component/compiler";
import { toHTML } from "dom/dom";

describe("Compiler", () => {
  it("on plain HTML", () => {
    const component = compile(
      "test",
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );

    expect(component.name).toBe("test");
    expect(toHTML(component.source)).toBe(
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );
    expect(toHTML(component.content)).toBe(
      `<div class="header"><h1>Welcome</h1></div><p>Let's go</p>`
    );
  });

  it("on <template>", () => {
    const component = compile("test", `<template>Quintessece</template>`);

    expect(toHTML(component.source)).toBe(
      `<template>Quintessece</template>`
    );
    expect(toHTML(component.content)).toBe(
      `<template>Quintessece</template>`
    );
  });
});
