/**
 * Created by Bob on 7/12/2017.
 */

let _ = require('lodash');
const profiler = require('screeps-profiler');

function role(creep) {
    creep.borderCheck();
    if (!creep.memory.lastRoom || creep.memory.lastRoom !== creep.room.roomName) creep.room.cacheRoomIntel();
    creep.memory.lastRoom = creep.room.roomName;
    if (!creep.memory.targetRooms || !creep.memory.destination) {
        creep.memory.targetRooms = Game.map.describeExits(creep.pos.roomName);
        let target = _.sample(creep.memory.targetRooms);
        if (Game.map.isRoomAvailable(target)) {
            creep.memory.destination = target;
        } else {
            return;
        }
    }
    if (creep.memory.destinationReached !== true) {
        creep.shibMove(new RoomPosition(25, 25, creep.memory.destination), {allowHostile: true});
        if (creep.pos.roomName === creep.memory.destination) {
            if (((creep.room.controller && creep.room.controller.sign && creep.room.controller.sign['username'] !== 'Shibdib') || (creep.room.controller && !creep.room.controller.sign)) && creep.room.controller.pos.findInRange(creep.room.structures, 1).length === 0) {
                let signs = ["#overlords was here.", "#overlords has collected intel from this room. We See You.", "Join Overlords! #overlords"];
                switch (creep.signController(creep.room.controller, _.sample(signs))) {
                    case OK:
                        creep.memory.destinationReached = true;
                        break;
                    case ERR_NOT_IN_RANGE:
                        creep.shibMove(creep.room.controller);
                }
            } else if (!creep.moveToHostileConstructionSites()) {
                creep.memory.destinationReached = true;
            }
        }
    } else {
        creep.memory.destination = undefined;
        creep.memory.targetRooms = undefined;
        creep.memory.destinationReached = undefined;
    }
}

module.exports.role = profiler.registerFN(role, 'explorerRole');