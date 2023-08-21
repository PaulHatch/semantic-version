"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationProvider = void 0;
const CsvUserFormatter_1 = require("./formatting/CsvUserFormatter");
const DefaultTagFormatter_1 = require("./formatting/DefaultTagFormatter");
const DefaultVersionFormatter_1 = require("./formatting/DefaultVersionFormatter");
const JsonUserFormatter_1 = require("./formatting/JsonUserFormatter");
const DefaultCommitsProvider_1 = require("./providers/DefaultCommitsProvider");
const DefaultCurrentCommitResolver_1 = require("./providers/DefaultCurrentCommitResolver");
const DefaultVersionClassifier_1 = require("./providers/DefaultVersionClassifier");
const DefaultLastReleaseResolver_1 = require("./providers/DefaultLastReleaseResolver");
const BumpAlwaysVersionClassifier_1 = require("./providers/BumpAlwaysVersionClassifier");
const DebugManager_1 = require("./DebugManager");
class ConfigurationProvider {
    constructor(config) {
        this.config = config;
        DebugManager_1.DebugManager.getInstance().setDebugEnabled(config.debug);
    }
    GetCurrentCommitResolver() { return new DefaultCurrentCommitResolver_1.DefaultCurrentCommitResolver(this.config); }
    GetLastReleaseResolver() { return new DefaultLastReleaseResolver_1.DefaultLastReleaseResolver(this.config); }
    GetCommitsProvider() { return new DefaultCommitsProvider_1.DefaultCommitsProvider(this.config); }
    GetVersionClassifier() {
        if (this.config.bumpEachCommit) {
            return new BumpAlwaysVersionClassifier_1.BumpAlwaysVersionClassifier(this.config);
        }
        return new DefaultVersionClassifier_1.DefaultVersionClassifier(this.config);
    }
    GetVersionFormatter() { return new DefaultVersionFormatter_1.DefaultVersionFormatter(this.config); }
    GetTagFormatter() { return new DefaultTagFormatter_1.DefaultTagFormatter(this.config); }
    GetUserFormatter() {
        switch (this.config.userFormatType) {
            case 'json': return new JsonUserFormatter_1.JsonUserFormatter(this.config);
            case 'csv': return new CsvUserFormatter_1.CsvUserFormatter(this.config);
            default:
                throw new Error(`Unknown user format type: ${this.config.userFormatType}, supported types: json, csv`);
        }
    }
}
exports.ConfigurationProvider = ConfigurationProvider;
