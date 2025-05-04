"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const weaviate_1 = require("../config/weaviate");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.listen(3000, () => {
    // startBot();
    (0, weaviate_1.setUpVectorDBschema)().then(() => {
        console.log('Weaviate schema setup complete');
    }).catch((error) => {
        console.error('Error setting up Weaviate schema:', error);
    });
    console.log('Server is running on port 3000');
});
