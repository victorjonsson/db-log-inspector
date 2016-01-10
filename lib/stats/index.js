'use strict';

const
    _ = require('lodash'),
    extend = require('util')._extend,
    roundToOneDecimal = require('../utils').roundToOneDecimal,

    /**
     * @param {*} stats
     * @param {LogEntry} entry
     */
    handleNormalizedQuery = function(stats, entry) {
        if (entry.normalizedId in stats.normalized) {
            stats.normalized[entry.normalizedId].push(entry.queryTimeSeconds);
        } else {
            stats.normalized[entry.normalizedId] = [entry.queryTimeSeconds];
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
        _.forEach(stats.normalized, function(executionTimes, id) {
            const sum = executionTimes.reduce(function(a, b) { return a + b; });
            stats.normalizedQueries.push({
                id: id,
                num: executionTimes.length,
                avg: roundToOneDecimal(sum / executionTimes.length)
            })
        });

        stats.normalizedQueries = _.sortBy(stats.normalizedQueries, 'num').reverse();
        stats.numNormalizedQueries = stats.normalizedQueries.length;
        delete stats.normalized;
    };


class LogAnalyzer {

    constructor(captureSize, captureUnknownEntries) {
        this._stats = {
            from: false,
            to: false,
            numEntries: 0,
            avgEntriesPerDay: 0,
            normalized: {},
            slowest: [],
            numUnknownEntries: 0,
            unknownEntries: []
        };
        this.captureSize = captureSize || LogAnalyzer.DEFAULT_CAPTURE_SIZE;
        this.captureUnknownEntries = captureUnknownEntries;
    }

    /**
     * @param {LogEntry} entry
     */
    addEntry(entry) {
        this._stats.numEntries++;
        handleNormalizedQuery(this._stats, entry);
        handleSlowest(this._stats, entry, this.captureSize);
        handleFromAndTo(this._stats, entry);
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

    /**
     * @returns {Array}
     */
    get statsMeasures() {
        return Object.keys(this._stats);
    }
}

LogAnalyzer.DEFAULT_CAPTURE_SIZE = 10;


module.exports = {

    LogAnalyzer: LogAnalyzer

};