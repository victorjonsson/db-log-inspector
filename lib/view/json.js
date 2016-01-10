'use strict';

module.exports = renderView;


function renderView(program, logStats, cb) {
    cb(JSON.stringify(logStats));
}