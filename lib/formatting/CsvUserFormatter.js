"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvUserFormatter = void 0;
class CsvUserFormatter {
    constructor(config) {
        // placeholder for consistency with other formatters
    }
    Format(type, users) {
        return users.map(user => `${user.name} <${user.email}>`).join(', ');
    }
}
exports.CsvUserFormatter = CsvUserFormatter;
