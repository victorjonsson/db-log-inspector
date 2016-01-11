'use strict';

const
    _ = require('lodash'),
    moment = require('moment'),
    Table = require('cli-table'),
    dateFormat = 'ddd DD, MMM YYYY',

    label = function(str, numTabs) {
        if (numTabs === undefined) {
            numTabs = 2;
        }
        return str.underline.bold + (new Array(numTabs+1).join('\t'));
    },

    title = function(str) {
        return '\n' + (' '+str+' ').inverse.bold;
    },

    createTableWithTopSlowest = function(stats) {

        const table = new Table({
            head: ['#', 'Date', 'SQL', 'Time (sec)']
        });

        stats.slowest.forEach(function(entry, i) {
            let out = '',
                sqlParts = entry.sqlQuery.split(''),
                charIndex = 0,
                lineLength = 50,
                statementMaxSize = 140;

            while(charIndex < sqlParts.length) {
                out += sqlParts.slice(charIndex, charIndex+50).join('') +'\n';
                charIndex += lineLength;
                if(charIndex > statementMaxSize) {
                    let tooLongMessage = '... (run -q '+(i+1)+' to view entire SQL statement)';
                    out += tooLongMessage.bold.italic;
                    break;
                }
            }

            table.push([i+1, moment(entry.created).format(dateFormat), out.trim(), entry.queryTimeSeconds]);
        });
        return table.toString();
    },

    createTableWithAllNormalizedQueries = function(stats) {
        const
            table = new Table({
                head: ['ID', 'Executions', 'Average time (sec)']
            }),
            maxRows = 30;

        let i=0;
        _.each(stats.normalizedQueries, function(normalizedQuery) {
            table.push([normalizedQuery.id, normalizedQuery.num, normalizedQuery.avg]);
            return (++i) < maxRows;
        });

        let str = table.toString() +'\n';
        if (stats.normalizedQueries.length > maxRows) {
            str += 'Showing '+maxRows+' of '+stats.normalizedQueries.length+' normalized queries';
        } else {
            str += 'Totally '+stats.normalizedQueries.length+' normalized queries';
        }

        str += ' (' + 'use "-n [ID]" to inspect a specific normalized query'.bold + ') ';

        return str;
    },

    renderFullReport = function(program, stats, callback) {
        const execTimeDiff = new Date().getTime() - program.beginTime,
            execTime = execTimeDiff < 1000 ? execTimeDiff+' ms' : moment.duration(execTimeDiff).seconds()+' seconds';

        callback([
            label('From:') + moment(stats.from).format(dateFormat),
            label('To:') + moment(stats.to).format(dateFormat),
            label('Entries:', 1) + stats.numEntries+ ' ('+stats.avgEntriesPerDay+' entries per day)',
            label('Execution time:', 1) + execTime,
            title('SLOWEST QUERIES:'),
            createTableWithTopSlowest(stats),
            title('NORMALIZED QUERIES:'),
            createTableWithAllNormalizedQueries(stats)
        ].join('\n'));
    },

    renderQueryFromTopList = function(program, stats, callback, errCallback) {
        if (stats.slowest.length < program.query) {
            errCallback('Index '+program.query+' does not exist in slow list');
        } else {
            var entry = stats.slowest[program.query -1];
            callback([
                label('Date:') + moment(entry.created).format(dateFormat),
                label('Time:') + entry.queryTimeSeconds+' seconds',
                label('normalizedId:', 1) + entry.normalizedId,
                title('SQL:'),
                entry.sqlQuery
            ].join('\n'));
        }
    },

    renderView = function(program, stats, callback, errCallback) {
        if (program.query) {
            renderQueryFromTopList(program, stats, callback, errCallback);
        } else {
            renderFullReport(program, stats, callback);
        }
    };


module.exports = renderView;
