"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YamlUserFormatter = void 0;
class YamlUserFormatter {
    constructor(config) {
        this.lineBreak = config.userFormatLineBreak || '\n';
        this.includeType = config.includeType || false;
    }
    Format(type, users) {
        const result = users.flatMap(u => [`- name: "${u.name}"`, `  email: "${u.email}"`]).join(this.lineBreak);
        return this.includeType ?
            `${type}:${this.lineBreak}${result}` :
            result;
    }
}
exports.YamlUserFormatter = YamlUserFormatter;
