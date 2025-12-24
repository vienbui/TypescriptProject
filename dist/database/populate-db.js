"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = require("dotenv");
var result = dotenv.config();
require("reflect-metadata");
var db_data_1 = require("./db-data");
var logger_1 = require("../logger");
var data_source_1 = require("./data-source");
var course_1 = require("../entitites/course");
var lesson_1 = require("../entitites/lesson");
function populateDB() {
    return __awaiter(this, void 0, void 0, function () {
        var courses, courseRepository, lessonRepository, _i, courses_1, courseData, course, _a, _b, lessonData, lesson, totalCourses, totalLessons;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, data_source_1.AppDataSource.initialize()];
                case 1:
                    _c.sent();
                    logger_1.logger.info('Database connection established');
                    courses = Object.values(db_data_1.COURSES);
                    courseRepository = data_source_1.AppDataSource.getRepository(course_1.Course);
                    lessonRepository = data_source_1.AppDataSource.getRepository(lesson_1.Lesson);
                    _i = 0, courses_1 = courses;
                    _c.label = 2;
                case 2:
                    if (!(_i < courses_1.length)) return [3 /*break*/, 8];
                    courseData = courses_1[_i];
                    logger_1.logger.info("Inserted course ".concat(courseData.title));
                    course = courseRepository.create(courseData);
                    return [4 /*yield*/, courseRepository.save(course)];
                case 3:
                    _c.sent();
                    _a = 0, _b = courseData.lessons;
                    _c.label = 4;
                case 4:
                    if (!(_a < _b.length)) return [3 /*break*/, 7];
                    lessonData = _b[_a];
                    logger_1.logger.info("Inserted lesson ".concat(lessonData.title));
                    lesson = lessonRepository.create(lessonData);
                    //link a lesson to a course
                    lesson.course = course;
                    return [4 /*yield*/, lessonRepository.save(lesson)];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6:
                    _a++;
                    return [3 /*break*/, 4];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [4 /*yield*/, courseRepository.createQueryBuilder("course").getCount()];
                case 9:
                    totalCourses = _c.sent();
                    return [4 /*yield*/, lessonRepository.createQueryBuilder("lesson").getCount()];
                case 10:
                    totalLessons = _c.sent();
                    logger_1.logger.info("Total courses inserted: ".concat(totalCourses));
                    logger_1.logger.info("Total lessons inserted: ".concat(totalLessons));
                    return [2 /*return*/];
            }
        });
    });
}
populateDB()
    .then(function () {
    logger_1.logger.info("Database has been populated successfully");
    process.exit(0);
})
    .catch(function (error) {
    console.error("Error populating database", error);
    process.exit(1);
});
