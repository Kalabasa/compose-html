# compose-html

Yet another static site generator.

This is still a work-in-progress!

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
