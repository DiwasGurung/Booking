"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixieAxios = void 0;
const axios_1 = __importDefault(require("axios"));
const https_proxy_agent_1 = require("https-proxy-agent");
function buildFixieAxios() {
    const fixieUrl = process.env.FIXIE_URL;
    if (!fixieUrl) {
        return axios_1.default.create();
    }
    const agent = new https_proxy_agent_1.HttpsProxyAgent(fixieUrl);
    return axios_1.default.create({
        httpsAgent: agent,
        proxy: false,
    });
}
exports.fixieAxios = buildFixieAxios();
