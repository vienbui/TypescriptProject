"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = require("dotenv");
var result = dotenv.config();
if (result.error) {
    console.warn("No .env file found or error in loading .env file");
    process.exit(1);
}
console.log(process.env.PORT);
var express = require("express");
var root_1 = require("./route/root");
var utils_1 = require("./utils");
var app = express();
function setupExpress() {
    app.route("/").get(root_1.root);
}
function startServer() {
    var port;
    var portEnv = process.env.PORT;
    var portArg = process.argv[2];
    if ((0, utils_1.isInteger)(portEnv)) {
        port = parseInt(portEnv);
    }
    if (!port && (0, utils_1.isInteger)(portArg)) {
        port = parseInt(portArg);
    }
    if (!port) {
        port = 9000;
    }
    app.listen(port, function () {
        console.log("Server is running on http://localhost:".concat(port));
    });
}
setupExpress();
startServer();
