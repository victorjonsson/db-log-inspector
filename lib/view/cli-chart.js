'use strict';


const
    _ = require('lodash'),
    blessed = require('blessed'),
    contrib = require('blessed-contrib'),
    moment = require('moment'),


    getLine = function() {
        const consoleDimensions = process.stdout.getWindowSize();
        return contrib.line({
                width: Math.round(consoleDimensions[0] *  0.75),
                height: Math.round(consoleDimensions[1] *  0.9),
                left: 0,
                top: 0,
                xPadding: 5,
                label: 'Num slow queries',
                showLegend: true,
                legend: {
                    width: 12
                }
            });
    },


    /**
     * @param {Map} entriesPerDay
     */
    getDataForChart = function(entriesPerDay) {
        return [{
            title: 'Queries',
            x: Array.from(entriesPerDay.keys()).reverse(),
            y: Array.from(entriesPerDay.values()).reverse(),
            style: {
                line: 'blue'
            }
        }];
    },

    renderCliChart = function(config, stats, callback, errCallback) {
        const
            screen = blessed.screen(),
            line = getLine(),
            data = getDataForChart(stats.entriesPerDay);

        screen.append(line);
        line.setData(data);

        screen.key(['escape', 'q', 'C-c'], function() {
            return process.exit(0);
        });

        callback(screen.render());
    };



module.exports = renderCliChart;