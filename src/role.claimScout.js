/**
 * Created by Bob on 7/12/2017.
 */

const profiler = require('screeps-profiler');

function role(creep) {
    creep.claimScout();
}

module.exports.role = profiler.registerFN(role, 'scoutRole');
