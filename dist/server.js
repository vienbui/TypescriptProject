"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var root_1 = require("./route/root");
var app = express();
function setupExpress() {
    app.route("/").get(root_1.root);
}
function startServer() {
    app.listen(9000, function () {
        console.log("Server is running on http://localhost:9000");
    });
}
setupExpress();
startServer();
