'use strict';

let previousYear;

const
    moment = require('moment'),
    _ = require('lodash'),
    extend = require('util')._extend,
    roundToOneDecimal = require('../utils').roundToOneDecimal,

    isFirstJanOfANewYear = function(date) {
        return date.getMonth() === 0 && date.getDate() === 1 ||
            (previousYear && previousYear != date.getYear());
    },

    getDateLabel = function(date) {
        let format = 'DD MMM';
        if (isFirstJanOfANewYear(date)) {
            format = 'YYYY'
        }
        previousYear = date.getYear();

        return moment(date).format(format);
    },

    /**
     * @param {*} stats
     * @param {LogEntry} entry
     */
    handleDailyStats = function(stats, entry) {
        const date = getDateLabel(entry.created),
            currentVal = stats.entriesPerDay.get(date) || 0;

        stats.entriesPerDay.set(date, currentVal+1);
    },

    /**
     * @param {*} stats
     * @param {LogEntry} entry
     * @param {Boolean} capture
     */
    handleNormalizedQuery = function(stats, entry, capture) {
        if (entry.normalizedId in stats.normalized) {
            stats.normalized[entry.normalizedId].executionTimes.push(entry.queryTimeSeconds);
        } else {
            stats.normalized[entry.normalizedId] = {executionTimes: [entry.queryTimeSeconds]};
            if (capture) {
                stats.normalized[entry.normalizedId].sql = entry.normalizedSqlQuery;
                stats.normalized[entry.normalizedId].example = entry.sqlQuery;
            }
        }
    },

    /**
     * @param {*} stats
     * @param {LogEntry} entry
     * @param {Number} captureSize
     */
    handleSlowest = function(stats, entry, captureSize) {
        stats.slowest.push(entry);
        stats.slowest = _.sortBy(stats.slowest, 'queryTimeSeconds').reverse();
        if (stats.slowest.length > captureSize)
            stats.slowest.splice(-1);
    },

    /**
     * @param {*} stats
     * @param {LogEntry} entry
     */
    handleFromAndTo = function(stats, entry) {
        const entryTime = entry.created.getTime(),
            setTime = function(prop) {
                stats[prop] = new Date(entryTime);
                stats[prop].setHours(0);
                stats[prop].setMinutes(0);
                stats[prop].setSeconds(0);
            };
        if (!stats.from || stats.from.getTime() > entryTime) {
            setTime('from');
        }
        if (!stats.to || stats.to.getTime() < entryTime) {
            setTime('to');
        }
    },

    /**
     * @param {*} stats
     */
    computeAverageEntriesPerDay = function(stats) {
        try {
            const
                DAY_MS = 86400000,
                days = (stats.to.getTime() - stats.from.getTime() + DAY_MS) / DAY_MS;

            stats.avgEntriesPerDay = roundToOneDecimal(stats.numEntries / days);

        } catch(err) {
        }
    },

    /**
     * @param {*} stats
     */
    sortAndAnalyzeNormalizedQueries = function(stats) {
        stats.normalizedQueries = [];
        _.forEach(stats.normalized, function(normalized, id) {
            const sum = normalized.executionTimes.reduce(function(a, b) { return a + b; }),
                obj = {
                    id: id,
                    num: normalized.executionTimes.length,
                    avg: roundToOneDecimal(sum / normalized.executionTimes.length)
                };

            if (normalized.example) {
                obj.example = normalized.example;
                obj.sql = normalized.sql;
            }

            stats.normalizedQueries.push(obj);
        });

        stats.normalizedQueries = _.sortBy(stats.normalizedQueries, 'num').reverse();
        stats.numNormalizedQueries = stats.normalizedQueries.length;
        delete stats.normalized;
    };



/**
 * Class that can take a bunch of log entries and so some
 * very simplistic statistical computations
 */
class LogAnalyzer {

    /**
     * @param {Number} numSlowestQueriesToCapture
     * @param {Boolean} captureUnknownEntries
     * @param {Boolean} captureNormalizedQuery
     * @param {Boolean} gatherDailyStats
     */
    constructor(
        numSlowestQueriesToCapture,
        captureUnknownEntries,
        captureNormalizedQuery,
        gatherDailyStats
    ) {
        this._stats = {
            from: false,
            to: false,
            numEntries: 0,
            avgEntriesPerDay: 0,
            normalized: {},
            slowest: [],
            numUnknownEntries: 0,
            entriesPerDay: new Map(),
            unknownEntries: []
        };
        this.numSlowestQueriesToCapture = numSlowestQueriesToCapture || LogAnalyzer.DEFAULT_CAPTURE_SIZE;
        this.captureUnknownEntries = captureUnknownEntries;
        this.captureNormalizedQuery = captureNormalizedQuery;
        this.gatherDailyStats = gatherDailyStats;
    }

    /**
     * @param {LogEntry} entry
     */
    addEntry(entry) {
        this._stats.numEntries++;
        handleNormalizedQuery(this._stats, entry, entry.normalizedId == this.captureNormalizedQuery);
        handleSlowest(this._stats, entry, this.numSlowestQueriesToCapture);
        handleFromAndTo(this._stats, entry);
        if (this.gatherDailyStats)
            handleDailyStats(this._stats, entry);
    }

    /**
     * @param {String} data
     */
    addUnknownEntry(data) {
        this._stats.numUnknownEntries++;
        if (this.captureUnknownEntries) {
            this._stats.unknownEntries.push(data);
        }
    }

    /**
     * @returns {*}
     */
    get logStats() {
        let measures = extend({}, this._stats);
        computeAverageEntriesPerDay(measures);
        sortAndAnalyzeNormalizedQueries(measures);
        return measures;
    }
}

LogAnalyzer.DEFAULT_CAPTURE_SIZE = 10;


module.exports = LogAnalyzer;