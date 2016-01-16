'use strict';

let previousYear;

const
    _ = require('lodash'),
    blessed = require('blessed'),
    contrib = require('blessed-contrib'),
    moment = require('moment'),

    isNewYearInChart = function(date) {
        return date.getMonth() === 0 && date.getDate() === 1 ||
            (previousYear && previousYear != date.getYear());
    },

    getDateLabel = function(date) {
        let format = 'DDD MMM';
        if (isNewYearInChart(date)) {
            format = 'YYYY'
        }
        previousYear = date.getYear();

        return moment(date).format(format);
    };


class Chart {

    constructor() {
        this._data = new Map();
    }

    /**
     * @param {LogEntry} logEntry
     */
    addEntry(logEntry) {
        const date = getDateLabel(logEntry.created),
            currentVal = this._data.get(date) || 0;

        this._data.set(date, currentVal+1);
    }

    render () {
        const screen = blessed.screen(),
            line = contrib.line(
                {
                    width: 80
                    , height: 30
                    , left: 0
                    , top: 0
                    , xPadding: 5
                    , label: 'Num slow queries'
                    , showLegend: true
                    , legend: {width: 12}
                }),
            data = [{
                title: 'Queries',
                x: Array.from(this._data.keys()).reverse(),
                y: Array.from(this._data.values()).reverse(),
                style: {
                    line: 'blue'
                }
            }];

        screen.append(line);
        line.setData(data);

        screen.key(['escape', 'q', 'C-c'], function(ch, key) {
            return process.exit(0);
        });

        screen.render();
    }
}


module.exports = Chart;