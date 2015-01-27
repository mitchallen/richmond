/**
 * model.js
 */

"use strict";

var models = [];

module.exports = {
    normalizeModelName: function (modelName) {
        if (!modelName) {
            throw new Error("ERROR: model name can't be null.");
        }
        if (modelName.match(/\s+/)) {
            throw new Error("ERROR: model name must not contain whitespace");
        }
        return modelName.toLowerCase();
    },

    model: function (name) {
        name = this.normalizeModelName(name);
        return models[name.toLowerCase()];
    },

    addModel: function (modelName, schema, conn) {
        modelName = this.normalizeModelName(modelName);
        models[modelName] = conn.model(modelName, schema);
        return models[modelName];
    }
};
