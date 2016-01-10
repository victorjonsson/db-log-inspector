'use strict';

class LogEntry {
    constructor(createdTimeStamp, queryTimeSeconds, sqlQuery, normalizedQuery) {
        this.created = new Date(createdTimeStamp);
        this.queryTimeSeconds = queryTimeSeconds;
        this.sqlQuery = sqlQuery;
        this.normalizedSqlQuery = normalizedQuery.sql;
        this.normalizedId = normalizedQuery.hash;
    }
}


module.exports = LogEntry;