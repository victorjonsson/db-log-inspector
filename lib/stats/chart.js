'use strict';

const
    _ = require('lodash');


class Chart {

    constructor() {
        this._data = {};
    }

    /**
     * @param {LogEntry} logEntry
     */
    addEntry(logEntry) {
        const date = logEntry.created.getTime().toString();
        if (date in this._data) {
            this._data[date] += 1;
        } else {
            this._data[date] = 1;
        }    }

    get data() {
        let arr = [],
            i=0;

        _.each(this._data, function(num) {
            arr.push([i++, num]);
        });

        return arr;
    }
}


module.exports = Chart;