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

    date = function(d) {
        return moment(d).format(dateFormat);
    },

    duration = function(seconds, unit) {
        if (seconds < 60) {
            return seconds +' seconds';
        } else {
            const during = moment.duration(seconds, 'seconds').humanize();
            return during == 'a minute' ? '1 minute':during;
        }
    },

    createTableWithTopSlowest = function(stats) {

        const table = new Table({
            head: ['#', 'Date', 'SQL', 'Time']
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

            table.push([i+1, date(entry.created), out.trim(), duration(entry.queryTimeSeconds)]);
        });
        return table.toString();
    },

    createTableWithAllNormalizedQueries = function(stats) {
        const
            table = new Table({
                head: ['ID', 'Executions', 'Average time']
            }),
            maxRows = 30;

        let i=0;
        _.each(stats.normalizedQueries, function(normalizedQuery) {
            table.push([normalizedQuery.id, normalizedQuery.num, duration(normalizedQuery.avg)]);
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

    renderNormalizedQuery = function(id, stats, callback, errCallback) {
        const query = _.find(stats.normalizedQueries, 'id', id);
        if (query) {
            callback([
                label('Average:',1) + duration(query.avg),
                label('Executions:',1) + query.num,
                title('NORMALIZED SQL:'),
                query.sql,
                title('EXAMPLE:'),
                query.example,
            ].join('\n'));
        } else {
            errCallback('No normalized query with id "'+id+'" could be found');
        }
    },

    renderFullReport = function(inputConfig, stats, callback) {
        const execTimeDiff = new Date().getTime() - inputConfig.beginTime,
            execTime = execTimeDiff < 1000 ? execTimeDiff+' ms' : moment.duration(execTimeDiff).seconds()+' seconds',
            unknownQueryText = stats.numUnknownEntries ? '  ('+stats.numUnknownEntries+' unknown entries)':'',
            entryLabel = stats.avgEntriesPerDay === 1 ? 'entry':'entries';

        var out = [
            label('From:') + date(stats.from),
            label('To:') + date(stats.to),
            label('Entries:', 1) + stats.numEntries + unknownQueryText,
            label('Average:', 1) + stats.avgEntriesPerDay+' '+entryLabel+' per day',
            label('Execution time:', 1) + execTime
        ];

        if (inputConfig.captureUnknown) {
            out.push(title('UNKOWN LOG ENTRIES:'));
            stats.unknownEntries.forEach(function(entryData) {
                out.push(entryData);
                out.push('------------');
            });
        } else {
            out.push(title('SLOWEST QUERIES:'));
            out.push(createTableWithTopSlowest(stats));
            out.push(title('NORMALIZED QUERIES:'));
            out.push(createTableWithAllNormalizedQueries(stats));
        }

        callback(out.join('\n'));
    },

    renderQueryFromTopList = function(inputConfig, stats, callback, errCallback) {
        if (stats.slowest.length < inputConfig.query) {
            errCallback('Index '+inputConfig.query+' does not exist in slow list');
        } else {
            var entry = stats.slowest[inputConfig.query -1];
            callback([
                label('Date:') + date(entry.created),
                label('Time:') + duration(entry.queryTimeSeconds),
                label('normalizedId:', 1) + entry.normalizedId,
                title('SQL:'),
                entry.sqlQuery
            ].join('\n'));
        }
    },

    renderView = function(inputConfig, stats, callback, errCallback) {
        if (inputConfig.query) {
            renderQueryFromTopList(inputConfig, stats, callback, errCallback);
        } else if(inputConfig.normalizedQuery) {
            renderNormalizedQuery(inputConfig.normalizedQuery, stats, callback, errCallback);
        } else {
            renderFullReport(inputConfig, stats, callback);
        }
    };


module.exports = renderView;
