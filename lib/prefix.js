/**
 * prefix.js
 */


"use strict";

var prefix = "";

module.exports = function (s) {
    if (s === undefined) {
        return prefix;  // GET
    }
    if (!s) {    // SET
        console.error("ERROR: prefix can't be null.");
    } else if (!s.match(/^\//)) {
        console.error("ERROR: prefix must begin with a slash");
    } else if (s.match(/\/$/)) {
        console.error("ERROR: prefix must not end with a slash");
    } else if (s.match(/\s+/)) {
        console.error("ERROR: prefix must not contain whitepace");
    } else {
        prefix = s.toLowerCase();
    }
};
