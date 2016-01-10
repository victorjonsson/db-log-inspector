'use strict';

const
    fs = require('fs'),
    readLineLib = require('readline'),
    view = require('../view'),
    ParseError = require('../utils').ParseError,
    shouldAddEntry = function(from, to, entry) {
        return (
            (!from || entry.created.getTime() >= from.getTime()) &&
            (!to || entry.created.getTime() <= to.getTime())
        );
    };

class LogFileProcessor {

    constructor(logEntryParser, logAnalyzer, from, to) {
        this.logEntryParser = logEntryParser;
        this.logAnalyzer = logAnalyzer;
        this._entryData = '';
    }

    handleLogEntryData(entryData) {
        try {
            let entry = this.logEntryParser.parse(entryData);
            if (shouldAddEntry(this.from, this.to, entry)) {
                this.logAnalyzer.addEntry(entry);
            }
        } catch (err) {
            if (err instanceof ParseError) {
                this.logAnalyzer.addUnknownEntry(entryData);
            } else {
                throw err;
            }
        }
    }

    processLogLine(line) {
        if (this.logEntryParser.isBeginningOfStatement(line)) {
            if (this._entryData !== '') {
                this.handleLogEntryData(this._entryData);
            }
            this._entryData = '';
        }
        this._entryData += line;
    }

    readAndProcess(file) {
        return new Promise((resolve, reject) => {
            readLineLib
                .createInterface({
                    input: fs.createReadStream(file)
                })
                .on('line', this.processLogLine.bind(this))
                .on('close', resolve);
        });
    }

    renderResult(config, callback, errorCallback) {

        let viewRenderer;
        switch((config.view || '').toLowerCase()) {
            case 'json':
                viewRenderer = view.json;
                break;
            default:
                viewRenderer = view.cli;
                break;
        }

        viewRenderer(config, this.logAnalyzer.logStats, callback, errorCallback);
    }

}

module.exports = LogFileProcessor;