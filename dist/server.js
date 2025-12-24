"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = require("dotenv");
var result = dotenv.config();
if (result.error) {
    console.warn("No .env file found or error in loading .env file");
    process.exit(1);
}
// console.log(process.env.PORT);
require("reflect-metadata");
var express = require("express");
var root_1 = require("./route/root");
var utils_1 = require("./utils");
var logger_1 = require("./logger");
var data_source_1 = require("./database/data-source");
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
        logger_1.logger.info("Server is running on http://localhost:".concat(port));
    });
}
console.log('DB_PASSWORD =', process.env.DB_PASSWORD);
console.log('DB_USERNAME =', process.env.DB_USERNAME);
data_source_1.AppDataSource.initialize()
    .then(function () {
    logger_1.logger.info("Data Source has been initialized!");
    setupExpress();
    startServer();
})
    .catch(function (error) {
    logger_1.logger.error("Error during Data Source initialization", error);
});
