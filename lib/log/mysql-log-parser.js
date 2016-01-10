'use strict';

const
    utils = require('../utils'),
    LogEntry = require('./log-entry'),
    queryNormalizer = require('./query-normalizer'),
    ParseError = utils.ParseError,
    parseTimestamp = function(entryData) {
        try {
            const timeStamp = (entryData.split('timestamp=')[1] || '').split(';')[0];
            return parseInt(timeStamp || 0, 10) * 1000;
        } catch(err) {
            throw new ParseError(err.message);
        }
    },
    parseQueryTime = function(entryData) {
        let num;
        try {
            const time = entryData.split('Query_time: ')[1].split(' ')[0];
            num = parseFloat(time);
        } catch(err) {
            throw new ParseError(err.message);
        }
        return utils.roundToOneDecimal(num);
    },
    parseSqlStatement = function(entryData) {
        const parts = entryData.split(';');
        return parts[parts.length - 2];
    };


class MysqlLogParser {

    /**
     * @param entryData
     * @returns {LogEntry}
     */
    parse(entryData) {
        let sql = parseSqlStatement(entryData);
        if (!sql)
            throw new ParseError('Unable to parse SQL statement');
        sql = utils.removeRedundantWhitespace(sql);
        return new LogEntry(
            parseTimestamp(entryData),
            parseQueryTime(entryData),
            sql,
            queryNormalizer.normalize(sql)
        );
    }

    isBeginningOfStatement(line) {
        return /^#/.test(line);
    }

}


module.exports = MysqlLogParser;