"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const desensitize_1 = require("dom/desensitize");
describe("desensitize", () => {
    const cases = [
        [
            "fragment",
            `<div class="ready">Prep</div>`,
            `<div class="ready">Prep</div>`,
        ],
        [
            "attribute w/o value",
            `<div disabled>Prep</div>`,
            `<div disabled>Prep</div>`,
        ],
        ["unclosed", `<img disabled>`, `<img disabled>`],
        [
            "body",
            `<body onready="ready"><div>In the body</div></body>`,
            `<dz-body onready="ready"><div>In the body</div></dz-body>`,
        ],
        [
            "head",
            `<head onready="ready"><link rel="stylesheet" href="style.css"></head>`,
            `<dz-head onready="ready"><link rel="stylesheet" href="style.css"></dz-head>`,
        ],
        [
            "document",
            `<html><body>Yo</body></html>`,
            `<dz-html><dz-body>Yo</dz-body></dz-html>`,
        ],
    ];
    it.each(cases)("%s", (name, sensitive, unsensitive) => {
        expect((0, desensitize_1.desensitizeHTML)(sensitive)).toBe(unsensitive);
    });
    it.each(cases)("undo %s", (name, sensitive, unsensitive) => {
        expect((0, desensitize_1.undesensitizeHTML)(unsensitive)).toBe(sensitive);
    });
});
