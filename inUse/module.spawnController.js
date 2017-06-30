/**
 * Created by rober on 6/29/2017.
 */
//Number generator
//CREEP SPAWNING
let _ = require('lodash');
const profiler = require('screeps-profiler');

function creepRespawn() {
    for (let name in Game.spawns) {
        let spawn = Game.spawns[name];
        if (spawn.spawning === null) {
            let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader' && creep.memory.assignedRoom === spawn.room.name);
            let basicHauler = _.filter(Game.creeps, (creep) => creep.memory.role === 'hauler' && creep.memory.assignedRoom === spawn.room.name);
            if (harvesters(spawn) === true) {
                continue;
            }
            if (workers(spawn) === true) {
                continue;
            }
            if (upgraders.length > 0 && basicHauler.length === 2) {
                if (spawn.room.memory.responseNeeded === true) {
                    if (responseForce(spawn) === true) {
                        continue;
                    }
                    continue;
                }
                if (attackForce(spawn) === true) {
                    continue;
                }
                if (scouts(spawn) === true) {
                    continue;
                }
                if (remotes(spawn) === true) {

                }
            }
        } else {
            let spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                spawningCreep.memory.role,
                spawn.pos.x + 1,
                spawn.pos.y,
                {align: 'left', opacity: 0.8}
            );
        }
    }
}
module.exports.creepRespawn = profiler.registerFN(creepRespawn, 'creepRespawn');

function responseForce(spawn) {
    if (spawn.room.controller.level >= 4) {
        let assistNeeded = _.filter(Game.rooms, (room) => room.memory.responseNeeded === true);
        if (assistNeeded.length > 0) {
            for (let key in assistNeeded) {
                if (neighborCheck(spawn.pos.roomName, assistNeeded[key].name) === true) {
                    let responder = _.filter(Game.creeps, (creep) => creep.memory.responseTarget === assistNeeded[key].name && creep.memory.role === 'responder');
                    if (responder.length < assistNeeded[key].memory.numberOfHostiles && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].responder, 'responder' + Game.time, {
                            role: 'responder',
                            assignedSpawn: spawn.id,
                            assignedRoom: spawn.room.name,
                            responseTarget: assistNeeded[key].name
                        }) === 'responder' + Game.time) {
                        console.log(spawn.room.name + ' Spawning an responder');
                        return true;
                    }
                }
            }
        }
    }
}
responseForce = profiler.registerFN(responseForce, 'responseForceSpawn');

function attackForce(spawn) {
    if (spawn.room.controller.level >= 3) {
        for (let name in Game.flags) {
            let attackerAmount = undefined;
            let healerAmount = undefined;
            let rangedAmount = undefined;
            let deconstructorAmount = undefined;
            let staging = undefined;
            let multiRoom = undefined;
            if (_.startsWith(name, 'attack')) {
                let info = name.split(".");
                info = info[1].split("/");
                attackerAmount = info[0];
                healerAmount = info[1];
                rangedAmount = info[2];
                deconstructorAmount = info[3];
                staging = info[4];
                multiRoom = info[5];
                if (Game.flags['staging' + staging].pos.roomName === spawn.pos.roomName || multiRoom === '1') {
                    let attackers = _.filter(Game.creeps, (creep) => creep.memory.attackTarget === Game.flags[name].name && creep.memory.role === 'attacker');
                    if (attackers.length < attackerAmount && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].attacker, 'attacker' + Game.time, {
                            role: 'attacker',
                            assignedSpawn: spawn.id,
                            assignedRoom: spawn.room.name,
                            attackTarget: Game.flags[name].name,
                            staging: 'staging' + staging,
                            waitForHealers: healerAmount,
                            waitForAttackers: attackerAmount,
                            waitForRanged: rangedAmount,
                            waitForDeconstructor: deconstructorAmount
                        }) === 'attacker' + Game.time) {
                        console.log(spawn.room.name + ' Spawning an attacker');
                        return true;
                    }
                    let healer = _.filter(Game.creeps, (creep) => creep.memory.attackTarget === Game.flags[name].name && creep.memory.role === 'healer');
                    if (healer.length < healerAmount && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].healer, 'healer' + Game.time, {
                            role: 'healer',
                            assignedSpawn: spawn.id,
                            assignedRoom: spawn.room.name,
                            attackTarget: Game.flags[name].name,
                            staging: 'staging' + staging,
                            waitForHealers: healerAmount,
                            waitForAttackers: attackerAmount,
                            waitForRanged: rangedAmount,
                            waitForDeconstructor: deconstructorAmount
                        }) === 'healer' + Game.time) {
                        console.log(spawn.room.name + ' Spawning an healer');
                        return true;
                    }
                    if (spawn.room.controller.level >= 5) {
                        let ranged = _.filter(Game.creeps, (creep) => creep.memory.attackTarget === Game.flags[name].name && creep.memory.role === 'ranged');
                        if (ranged.length < rangedAmount && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].ranged, 'ranged' + Game.time, {
                                role: 'ranged',
                                assignedSpawn: spawn.id,
                                assignedRoom: spawn.room.name,
                                attackTarget: Game.flags[name].name,
                                staging: 'staging' + staging,
                                waitForHealers: healerAmount,
                                waitForAttackers: attackerAmount,
                                waitForRanged: rangedAmount,
                                waitForDeconstructor: deconstructorAmount
                            }) === 'ranged' + Game.time) {
                            console.log(spawn.room.name + ' Spawning a ranged');
                            return true;
                        }
                        let deconstructor = _.filter(Game.creeps, (creep) => creep.memory.attackTarget === Game.flags[name].name && creep.memory.role === 'deconstructor');
                        if (deconstructor.length < deconstructorAmount && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].deconstructor, 'deconstructor' + Game.time, {
                                role: 'deconstructor',
                                assignedSpawn: spawn.id,
                                assignedRoom: spawn.room.name,
                                attackTarget: Game.flags[name].name,
                                staging: 'staging' + staging,
                                waitForHealers: healerAmount,
                                waitForAttackers: attackerAmount,
                                waitForRanged: rangedAmount,
                                waitForDeconstructor: deconstructorAmount
                            }) === 'deconstructor' + Game.time) {
                            console.log(spawn.room.name + ' Spawning an deconstructor');
                            return true;
                        }
                    }
                }
            }
        }
    }
}
attackForce = profiler.registerFN(attackForce, 'attackForceSpawn');

function harvesters(spawn) {
    if (spawn.room.controller.level >= 2) {
        let sources = spawn.room.find(FIND_SOURCES);
        for (let i = 0; i < sources.length; i++) {
            let stationaryHarvester = _.filter(Game.creeps, (creep) => creep.memory.assignedSource === sources[i].id && creep.memory.role === 'stationaryHarvester');
            let level;
            if (_.filter(Game.creeps, (creep) => creep.memory.assignedRoom === spawn.room.name && creep.memory.role === 'stationaryHarvester').length === 0) {
                level = 1;
            } else {
                level = spawn.room.controller.level
            }
            if (stationaryHarvester.length === 0 && spawn.createCreep(Memory.creepBodies[level].stationaryHarvester, 'stationaryHarvester' + Game.time, {
                    role: 'stationaryHarvester',
                    assignedSpawn: spawn.id,
                    assignedRoom: spawn.room.name,
                    assignedSource: sources[i].id
                }) === 'stationaryHarvester' + Game.time) {
                console.log(spawn.room.name + ' Spawning a stationaryHarvester');
                return true;
            }
        }
    }
}
harvesters = profiler.registerFN(harvesters, 'harvestersSpawn');

function scouts(spawn) {
    if (spawn.room.controller.level >= 2) {
        let explorers = _.filter(Game.creeps, (creep) => creep.memory.assignedRoom === spawn.pos.roomName && creep.memory.role === 'explorer');
        if (explorers.length < 2 && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].explorer, 'explorer' + Game.time, {
                role: 'explorer',
                assignedSpawn: spawn.id,
                assignedRoom: spawn.room.name
            }) === 'explorer' + Game.time) {
            console.log(spawn.room.name + ' Spawning an explorer');
            return true;
        }
        for (let i = 0; i < 20; i++) {
            let scout = 'scout' + i;
            if (Game.flags[scout]) {
                let scouts = _.filter(Game.creeps, (creep) => creep.memory.destination === Game.flags[scout].name && creep.memory.role === 'scout');
                if (scouts.length === 0 && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].scout, 'scout' + Game.time, {
                        role: 'scout',
                        assignedSpawn: spawn.id,
                        assignedRoom: spawn.room.name,
                        destination: Game.flags[scout].name,
                    }) === 'scout' + Game.time) {
                    console.log(spawn.room.name + ' Spawning a scout');
                    return true;
                }
            }
        }
    }
}
scouts = profiler.registerFN(scouts, 'scoutsSpawn');

function workers(spawn) {
    if (spawn.room.controller.level >= 1) {
        const upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader' && creep.memory.assignedRoom === spawn.room.name);
        const basicHauler = _.filter(Game.creeps, (creep) => creep.memory.role === 'hauler' && creep.memory.assignedRoom === spawn.room.name);
        if (basicHauler.length < 2 && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].hauler, 'hauler' + Game.time, {
                role: 'hauler',
                assignedSpawn: spawn.id,
                assignedRoom: spawn.room.name
            }) === 'hauler' + Game.time) {
            console.log(spawn.room.name + ' Spawning a hauler');
            return true;
        }
        if (spawn.room.memory.responseNeeded !== true) {
            const worker = _.filter(Game.creeps, (creep) => creep.memory.role === 'worker' && creep.memory.assignedRoom === spawn.room.name);
            if (worker.length < 2 && upgraders.length > 0 && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].worker, 'worker' + Game.time, {
                    role: 'worker',
                    assignedSpawn: spawn.id,
                    assignedRoom: spawn.room.name
                }) === 'worker' + Game.time) {
                console.log(spawn.room.name + ' Spawning a worker');
                return true;
            }
            if (upgraders.length < 2 && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].upgrader, 'upgrader' + Game.time, {
                    role: 'upgrader',
                    assignedSpawn: spawn.id,
                    assignedRoom: spawn.room.name
                }) === 'upgrader' + Game.time) {
                console.log(spawn.room.name + ' Spawning an upgrader');
                return true;
            }
            if (spawn.room.controller.level >= 4) {
                const basicHaulerLarge = _.filter(Game.creeps, (creep) => creep.memory.role === 'largeHauler' && creep.memory.assignedRoom === spawn.room.name);
                if (basicHaulerLarge.length < 1 && upgraders.length > 0 && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].largeHauler, 'largeHauler' + Game.time, {
                        role: 'largeHauler',
                        assignedSpawn: spawn.id,
                        assignedRoom: spawn.room.name
                    }) === 'largeHauler' + Game.time) {
                    console.log(spawn.room.name + ' Spawning a largeHauler');
                    return true;
                }
            }
            if (spawn.room.controller.level >= 6) {
                let minerals = spawn.pos.findClosestByRange(FIND_MINERALS);
                let mineralHarvester = _.filter(Game.creeps, (creep) => creep.memory.assignedMineral === minerals.id && creep.memory.role === 'mineralHarvester');
                if (mineralHarvester.length < 2 && upgraders.length > 0 && minerals.mineralAmount > 0 && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].mineralHarvester, 'mineralHarvester' + Game.time, {
                        role: 'mineralHarvester',
                        assignedSpawn: spawn.id,
                        assignedRoom: spawn.room.name,
                        assignedMineral: minerals.id
                    }) === 'mineralHarvester' + Game.time) {
                    console.log(spawn.room.name + ' Spawning a mineralHarvester');
                    return true;
                }
                let mineralHauler = _.filter(Game.creeps, (creep) => creep.memory.role === 'mineralHauler' && creep.memory.assignedRoom === spawn.room.name);
                if (mineralHauler.length < 1 && upgraders.length > 0 && minerals.mineralAmount > 0 && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].mineralHauler, 'mineralHauler' + Game.time, {
                        role: 'mineralHauler',
                        assignedSpawn: spawn.id,
                        assignedRoom: spawn.room.name,
                        assignedMineral: minerals.id
                    }) === 'mineralHauler' + Game.time) {
                    console.log(spawn.room.name + ' Spawning a mineralHauler');
                    return true;
                }
            }
        }
    }
}
workers = profiler.registerFN(workers, 'workersSpawn');

function remotes(spawn) {
    if (spawn.room.controller.level >= 3) {
        for (let key in Memory.roomCache) {
            if (neighborCheck(spawn.room.name, key) === true) {
                let remoteHarvester = _.filter(Game.creeps, (creep) => creep.memory.destination === key && creep.memory.role === 'remoteHarvester');
                if (remoteHarvester.length < Memory.roomCache[key].sources.length && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].remoteHarvester, 'remoteHarvester' + Game.time, {
                        role: 'remoteHarvester',
                        assignedSpawn: spawn.id,
                        assignedRoom: spawn.room.name,
                        destination: key
                    }) === 'remoteHarvester' + Game.time) {
                    console.log(spawn.room.name + ' Spawning a remoteHarvester');
                    return true;
                }
                let remoteHauler = _.filter(Game.creeps, (creep) => creep.memory.destination === key && creep.memory.role === 'remoteHauler');
                if (remoteHauler.length < 1 && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].remoteHauler, 'remoteHauler' + Game.time, {
                        role: 'remoteHauler',
                        assignedSpawn: spawn.id,
                        assignedRoom: spawn.room.name,
                        destination: key
                    }) === 'remoteHauler' + Game.time) {
                    console.log(spawn.room.name + ' Spawning an remoteHauler');
                    return true;
                }
            }
        }
        for (let i = 0; i < 20; i++) {
            let pioneer = 'pioneer' + i;
            if (Game.flags[pioneer]) {
                let pioneers = _.filter(Game.creeps, (creep) => creep.memory.destination === pioneer && creep.memory.role === 'pioneer');
                if (pioneers.length < 1 && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].pioneer, 'pioneer' + Game.time, {
                        role: 'pioneer',
                        assignedSpawn: spawn.id,
                        assignedRoom: spawn.room.name,
                        destination: pioneer
                    }) === 'pioneer' + Game.time) {
                    console.log(spawn.room.name + ' Spawning a pioneer');
                    return true;
                }
            }
        }
        if (spawn.room.controller.level >= 4) {
            let reserver = _.filter(Game.creeps, (creep) => creep.memory.assignedRoom === spawn.room.name && creep.memory.role === 'reserver');
            if (reserver.length < _.round(Object.keys(Game.map.describeExits(spawn.room.name)).length, 0) / 2 && spawn.createCreep(Memory.creepBodies[spawn.room.controller.level].reserver, 'reserver' + Game.time, {
                    role: 'reserver',
                    assignedSpawn: spawn.id,
                    assignedRoom: spawn.room.name
                }) === 'reserver' + Game.time) {
                console.log(spawn.room.name + ' Spawning a reserver');
                return true;
            }
        }
    }
}
remotes = profiler.registerFN(remotes, 'remotesSpawn');

function neighborCheck(spawnRoom, remoteRoom) {
    let neighboringRooms = Game.map.describeExits(spawnRoom);
    for (let key in neighboringRooms) {
        if (neighboringRooms[key] && remoteRoom && (neighboringRooms[key] === remoteRoom || spawnRoom === remoteRoom)) {
            return true;
        }
    }
    return false;
}
neighborCheck = profiler.registerFN(neighborCheck, 'neighborCheckSpawn');


const RCL_1_ENERGY = 300;
const RCL_2_ENERGY = 550;
const RCL_3_ENERGY = 800;
const RCL_4_ENERGY = 1300;
const RCL_5_ENERGY = 1800;
const RCL_6_ENERGY = 2300;
const RCL_7_ENERGY = 5600;
const RCL_8_ENERGY = 12900;