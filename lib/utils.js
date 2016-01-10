'use strict';

const
    crypto = require('crypto'),
    strToHash = function(str) {
        return crypto.createHash('md5').update(str).digest('hex');
    },
    removeRedundantWhitespace = function(str) {
        return str
                .replace(/\s+/g, ' ')
                .replace(/= /g, '=')
                .trim();
    },
    roundToOneDecimal = function(num) {
        return Math.round(num * 10) / 10;
    };


class ParseError extends Error {}

module.exports = {
    strToHash: strToHash,
    removeRedundantWhitespace: removeRedundantWhitespace,
    roundToOneDecimal: roundToOneDecimal,
    ParseError: ParseError
};

