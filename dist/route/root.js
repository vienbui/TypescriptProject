"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.root = root;
function root(request, response) {
    response.status(200).send("Express server is running...");
}
