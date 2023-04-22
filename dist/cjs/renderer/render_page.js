"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPage = void 0;
const preconditions_1 = require("util/preconditions");
const query_page_skeleton_1 = require("util/query_page_skeleton");
function renderPage(bodyContent, pageData) {
    const page = ((0, preconditions_1.check)(pageData.page), (0, preconditions_1.checkNotNull)(pageData.page));
    const { html, head, body } = (0, query_page_skeleton_1.queryPageSkeleton)(page.skeleton.cloneNode(true));
    // These are ReadonlyArrays. Expect immutability of nodes, so clone
    (0, preconditions_1.checkNotNull)(head).replaceChildren(...cloneNodes(pageData.metadata), ...cloneNodes(pageData.styles), ...cloneNodes(pageData.clientScripts.filter(not(isDeferredScript))));
    (0, preconditions_1.checkNotNull)(body).replaceChildren(
    // No need to clone bodyContent, it's an incremental object
    ...bodyContent, ...removeDeferAttr(cloneNodes(pageData.clientScripts.filter(isDeferredScript))));
    return (0, preconditions_1.checkNotNull)(html);
}
exports.renderPage = renderPage;
function isDeferredScript(script) {
    return script.hasAttribute("defer");
}
function not(predicate) {
    return (...args) => !predicate(...args);
}
// mutates input directly
function* removeDeferAttr(scripts) {
    for (const script of scripts) {
        script.defer = false;
        yield script;
    }
}
function* cloneNodes(nodes) {
    for (const node of nodes) {
        yield node.cloneNode(true);
    }
}
