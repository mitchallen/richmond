/**
 * model.js
 */

"use strict";

var models = [];

module.exports = {
    normalizeModelName: function (modelName) {
        if (!modelName) {
            throw new Error("normalizeModelName: model name can't be null.");
        }
        if (modelName.match(/\s+/)) {
            throw new Error("normalizeModelName: model name must not contain whitespace");
        }
        return modelName.toLowerCase();
    },

    model: function (name) {
        name = this.normalizeModelName(name);
        return models[name.toLowerCase()];
    },

    addModel: function (modelName, schema, conn) {
        if (!conn) {
            throw new Error(".addModel: must connect to database first.");
        }
        if (!schema) {
            throw new Error(".addModel: schema can't be null.");
        }
        modelName = this.normalizeModelName(modelName);
        models[modelName] = conn.model(modelName, schema);
        return models[modelName];
    }
};
