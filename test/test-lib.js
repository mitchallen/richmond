/**
 * test-lib.js
 */

"use strict";

module.exports = {
    // Returns a random number between min (inclusive) and max (exclusive)
    getRandomInt:
        function (min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }
};