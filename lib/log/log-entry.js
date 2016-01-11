'use strict';

class LogEntry {

    /**
     * @param {Number} createdTimeStamp
     * @param {Number} queryTimeSeconds
     * @param {String} sqlQuery
     * @param {*} normalizedQuery
     */
    constructor(createdTimeStamp, queryTimeSeconds, sqlQuery, normalizedQuery) {
        this.created = new Date(createdTimeStamp);
        this.queryTimeSeconds = queryTimeSeconds;
        this.sqlQuery = sqlQuery;
        this.normalizedSqlQuery = normalizedQuery.sql;
        this.normalizedId = normalizedQuery.hash;
    }
}


module.exports = LogEntry;