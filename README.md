# compose-html

Yet another static site generator.

## A simple example

### Source files

```html
<!-- card.html -->
<div class="card">
  <h1>{attrs.title}</h1>
  <slot />
</div>
```

```html
<!-- page.html -->
<card title="Hello">
  <p>Hello, world!</p>
  <p>How's it going?</p>
</card>
```

### Output file

```html
<!-- out/page.html -->
<div class="card">
  <h1>Hello</h1>
  <p>Hello, world!</p>
  <p>How's it going?</p>
</div>
```

## Status

This project is in very low maintenance mode. I'm looking to migrate to Astro anyway.

## Syntax

| Example | Description |
|-|-|
| `<div {...attrs}` | Inherit attributes from current component. |
| `<script client>` | Run script in the client (normal script). |
| `<script render>` | Run script at build time and render the return value or output in place. | 
| `<script static>` | Run script at build time (once per file). |
| `` return attrs.myVar `` | In a render script, use `attrs` to access current component's attributes. | 
| `` return children.length `` | In a render script, use `children` to access current component's children for processing. (But use `<slot>` for rendering) | 
| `` return html`<div>` `` | In a render script, use the `html` tag to render HTML (processed further by compose-html). | 
| `` return raw`<div>` `` | In a render script, use the `raw` tag to render unprocessed HTML. | 
| `` `<div ${spreadAttrs(map)}>` `` | In a render script, use the `spreadAttrs` function to render multiple attributes. |
