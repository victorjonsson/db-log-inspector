'use strict';

const
    _ = require('lodash'),
    utils = require('../utils'),
    removeSpaceAroundParenthesis = function(sql) {
        return utils.removeRedundantWhitespace(
                sql.replace(/[? ]\)|\([? ]/g ,')')
        );
    },
    normalizationCommands = {
        removeSelectedValues: function(sql) {
            let newSqlChunks = [],
                removeFromNext = false,
                statementRegex = /(SELECT)/gi;

            sql.split(statementRegex).forEach(function(chunk) {
                if (statementRegex.test(chunk)) {
                    newSqlChunks.push(chunk);
                    removeFromNext = true;
                } else if (removeFromNext) {
                    let subChunks = chunk.split(/ FROM /i);
                    subChunks.splice(0, 1);
                    subChunks.unshift(' ? ');
                    removeFromNext = false;
                    newSqlChunks.push(subChunks.join(' FROM '));
                } else {
                    newSqlChunks.push(chunk);
                }
            });

            return newSqlChunks.join('');
        },
        removeSpaceAroundParenthesis: removeSpaceAroundParenthesis,
        removeAsStatements: function(sql) {
            sql = sql.replace(/AS(\s+)[a-zA-Z0-9_]+/g, ' ');
            return utils.removeRedundantWhitespace(sql);
        },
        removeInStatements: function(sql) {
            sql = sql.replace(/IN[\s|]\([^(SELECT)][a-zA-Z0-9\.,'"\s\\]+\)/gi, ' IN ? ');
            return sql.replace(/IN[\s|]\([a-zA-Z0-9\.,'"\s\\]+\)/gi, ' IN ? ');
        },
        removeValues: function(sql) {
            sql = utils.removeRedundantWhitespace(sql).replace(/! =/g, '!=');
            sql = sql.replace(/[\s]+(=|!=|<|>|<>)[\s]+/g, '=');
            sql = sql.replace(/(=|<|>|<>)[a-zA-Z0-9\._]+/g, '=##');
            let newSqlParts = [];
            sql.split(/=|<|>|<>/g).forEach(function(data) {
                if (newSqlParts.length == 0) {
                    newSqlParts.push(data);
                } else {
                    let firstChar = data[0];
                    if (firstChar === '?') {
                        newSqlParts.push(data);
                    } else {
                        try {
                            let dataParts = data.substr(1).replace(new RegExp(firstChar+'[^ |)]', 'g'), '__').split(firstChar);
                            //let dataParts = data.substr(1).split(firstChar);
                            newSqlParts.push('? '+dataParts.slice(1).join(''));
                        } catch(err) {
                            newSqlParts.join(data.substr(1));
                        }
                    }
                }
            });

            let newSql = newSqlParts.join('=').trim();
            newSql = utils.removeRedundantWhitespace(newSql);
            newSql = removeSpaceAroundParenthesis(newSql);

            return newSql;
        },
        removeSortingAndLimits:  function(sql) {
            sql = sql.replace(/ORDER BY [^ ]* (DESC|ASC)/gi, '');
            return sql.replace(/LIMIT [0-9,]+/gi, '');
        }
    },
    normalizeQuery = function(sql) {
        let normalized = utils.removeRedundantWhitespace(sql);

        _.each(normalizationCommands, function(command) {
            normalized = command(normalized);
        });

        normalized = utils.removeRedundantWhitespace(normalized);

        return {
            hash: utils.strToHash(normalized),
            sql: normalized
        }
    };


module.exports = {
    commands: normalizationCommands,
    normalize: normalizeQuery
};