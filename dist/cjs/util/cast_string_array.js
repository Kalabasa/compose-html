"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.castStrArr = void 0;
const preconditions_1 = require("util/preconditions");
function castStrArr(array) {
    (0, preconditions_1.check)(array.every((item) => typeof item === "string"));
    return array;
}
exports.castStrArr = castStrArr;
