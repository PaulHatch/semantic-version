"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonUserFormatter = void 0;
class JsonUserFormatter {
    constructor(config) {
        // placeholder for consistency with other formatters
    }
    Format(type, users) {
        let result = users.map(u => ({ name: u.name, email: u.email }));
        return JSON.stringify(result).replace('\n', '');
    }
}
exports.JsonUserFormatter = JsonUserFormatter;
