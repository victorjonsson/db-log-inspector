'use strict';

module.exports = renderView;


function renderView(inputConfig, logStats, cb) {
    cb(JSON.stringify(logStats));
}