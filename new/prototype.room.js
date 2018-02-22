/**
 * Created by rober on 7/5/2017.
 */
'use strict';

Room.prototype.getConstructionSites = function () {
    if (!this.constructionSites) {
        this.constructionSites = JSON.parse(JSON.stringify(this.find(FIND_CONSTRUCTION_SITES)));
    }
    return this.constructionSites;
};

Room.prototype.getDroppedResources = function () {
    if (!this.droppedResources) {
        this.droppedResources = this.find(FIND_DROPPED_RESOURCES);
    }
    return this.droppedResources;
};

Room.prototype.getAssignedCreeps = function () {
    return _.filter(Game.creeps, (c) => c.memory.overlord === this.name);
};

Room.prototype.getCreepsInRoom = function () {
    return _.filter(Game.creeps, (c) => c.pos.roomName === this.name);
};

Room.prototype.getExtensionCount = function () {
    let level = this.controller.level;
    if (level === 1) {
        return RCL_1_EXTENSIONS;
    } else if (level === 2) {
        return RCL_2_EXTENSIONS
    } else if (level === 3) {
        return RCL_3_EXTENSIONS
    } else if (level === 4) {
        return RCL_4_EXTENSIONS
    } else if (level === 5) {
        return RCL_5_EXTENSIONS
    } else if (level === 6) {
        return RCL_6_EXTENSIONS
    } else if (level === 7) {
        return RCL_7_EXTENSIONS
    } else if (level === 8) {
        return RCL_8_EXTENSIONS
    }
};


//Room Cache
///////////////////////////////////////////////////
//STRUCTURE CACHE
///////////////////////////////////////////////////
Room.prototype.cacheRoomStructures = function (id) {
    let structure = Game.getObjectById(id);
    if (structure) {
        let room = structure.room;
        let cache = room.memory.structureCache || {};
        let key = room.name + '.' + structure.pos.x + '.' + structure.pos.y;
        cache[key] = {
            id: structure.id,
            type: structure.structureType
        };
        room.memory.structureCache = cache;
    }
};

Room.prototype.handleNukeAttack = function () {
    let nukes = this.find(FIND_NUKES);
    if (nukes.length === 0) {
        return false;
    }

    let sorted = _.sortBy(nukes, function (object) {
        return object.timeToLand;
    });
    if (sorted[0].timeToLand < 100) {
        this.controller.activateSafeMode();
    }

    let findSaveableStructures = function (object) {
        if (object.structureType === STRUCTURE_ROAD) {
            return false;
        }
        if (object.structureType === STRUCTURE_RAMPART) {
            return false;
        }
        return object.structureType !== STRUCTURE_WALL;

    };

    let isRampart = function (object) {
        return object.structureType === STRUCTURE_RAMPART;
    };

    for (let nuke of nukes) {
        let structures = nuke.pos.findInRange(FIND_MY_STRUCTURES, 4, {
            filter: findSaveableStructures
        });
        this.log('Nuke attack !!!!!');
        for (let structure of structures) {
            let lookConstructionSites = structure.pos.lookFor(LOOK_CONSTRUCTION_SITES);
            if (lookConstructionSites.length > 0) {
                continue;
            }
            let lookStructures = structure.pos.lookFor(LOOK_STRUCTURES);
            let lookRampart = _.findIndex(lookStructures, isRampart);
            if (lookRampart > -1) {
                continue;
            }
            this.log('Build rampart: ' + JSON.stringify(structure.pos));
            structure.pos.createConstructionSite(STRUCTURE_RAMPART);
        }
    }

    return true;
};
Room.prototype.cacheRoomIntel = function (force = false) {
    if (this.memory.lastIntelCache > Game.time - 100 && !force) return;
    this.memory.lastIntelCache = Game.time;
    let room = Game.rooms[this.name];
    let owner = undefined;
    let reservation = undefined;
    let reservationTick = undefined;
    let level = undefined;
    let hostiles = undefined;
    let nonCombats = undefined;
    let sk = undefined;
    let towers = undefined;
    let claimValue = undefined;
    let claimWorthy = undefined;
    let needsCleaning = undefined;
    if (room) {
        let cache = Memory.roomCache || {};
        let sources = room.find(FIND_SOURCES);
        let structures = room.find(FIND_STRUCTURES, {filter: (e) => e.structureType !== STRUCTURE_WALL && e.structureType !== STRUCTURE_RAMPART && e.structureType !== STRUCTURE_ROAD && e.structureType !== STRUCTURE_CONTAINER && e.structureType !== STRUCTURE_CONTROLLER});
        hostiles = room.find(FIND_CREEPS, {filter: (e) => (e.getActiveBodyparts(ATTACK) >= 1 || e.getActiveBodyparts(RANGED_ATTACK) >= 1) && _.includes(FRIENDLIES, e.owner['username']) === false});
        nonCombats = room.find(FIND_CREEPS, {filter: (e) => (e.getActiveBodyparts(ATTACK) === 1 || e.getActiveBodyparts(RANGED_ATTACK) === 1) && _.includes(FRIENDLIES, e.owner['username']) === false});
        towers = room.find(structures, {filter: (e) => e.structureType === STRUCTURE_TOWER});
        if (room.find(FIND_STRUCTURES, {filter: (e) => e.structureType === STRUCTURE_KEEPER_LAIR}).length > 0) sk = true;
        let minerals = room.find(FIND_MINERALS);
        if (room.controller) {
            owner = room.controller.owner;
            level = room.controller.level;
            if (room.controller.reservation) {
                reservation = room.controller.reservation.username;
                reservationTick = room.controller.reservation.ticksToEnd + Game.time;
            }
            // Handle claim targets
            if (!owner && !reservation && sources.length > 1 && room.controller.pos.countOpenTerrainAround() > 0) {
                let wall = 0;
                let plains = 0;
                let terrain = room.lookForAtArea(LOOK_TERRAIN, 0, 0, 49, 49, true);
                for (let key in terrain) {
                    let position = new RoomPosition(terrain[key].x, terrain[key].y, room.name);
                    if (position.checkForWall()) {
                        wall++
                    } else if (position.checkForPlain()) {
                        plains++
                    }
                }
                if (wall < 700 && plains > 300) {
                    let sourceDist = sources[0].pos.getRangeTo(sources[1]);
                    claimValue = plains / sourceDist;
                    claimWorthy = true;
                } else {
                    claimWorthy = false;
                }
            } else {
                claimValue = undefined;
                claimWorthy = false;
            }
            // Handle abandoned rooms
            if (!owner && !reservation && structures.length > 2 && nonCombats + hostiles === 0) {
                needsCleaning = true;
            }
        }
        let key = room.name;
        cache[key] = {
            cached: Game.time,
            name: room.name,
            sources: sources,
            minerals: minerals,
            owner: owner,
            reservation: reservation,
            reservationTick: reservationTick,
            level: level,
            towers: towers.length,
            hostiles: hostiles.length,
            nonCombats: nonCombats.length,
            sk: sk,
            claimValue: claimValue,
            claimWorthy: claimWorthy,
            needsCleaning: needsCleaning
        };
        Memory.roomCache = cache;
        if ((sk || sources.length > 0) && !owner) {
            for (let key in Game.spawns) {
                if (Game.map.findRoute(Game.spawns[key].pos.roomName, room.name).length <= 2) {
                    if (sk) {
                        if (Game.spawns[key].room.memory.skRooms) {
                            if (_.includes(Game.spawns[key].room.memory.skRooms, room.name) === false) {
                                Game.spawns[key].room.memory.skRooms.push(room.name);
                            }
                        } else {
                            Game.spawns[key].room.memory.skRooms = [];
                        }
                    }
                    if (Game.map.findRoute(Game.spawns[key].pos.roomName, room.name).length <= 3 && !owner && !sk && !reservation) {
                        if (Game.spawns[key].room.memory.remoteRooms) {
                            if (_.includes(Game.spawns[key].room.memory.remoteRooms, room.name) === false) {
                                Game.spawns[key].room.memory.remoteRooms.push(room.name);
                            }
                        } else {
                            Game.spawns[key].room.memory.remoteRooms = [];
                        }
                    } else if (_.includes(Game.spawns[key].room.memory.remoteRooms, room.name) === true) {
                        _.remove(Game.spawns[key].room.memory.remoteRooms, room.name);
                    }
                }
            }
        } else if (owner) {
            for (let key in Game.spawns) {
                if (_.includes(Game.spawns[key].room.memory.remoteRooms, room.name) === true) {
                    let newArray = _.filter(Game.spawns[key].room.memory.remoteRooms, (e) => e !== room.name);
                    delete Game.spawns[key].room.memory.remoteRooms;
                    Game.spawns[key].room.memory.remoteRooms = newArray;
                }
            }
        }
    }
};


Room.prototype.invaderCheck = function () {
    let sk;
    if (this.memory.lastInvaderCheck === Game.time) return;
    if (this.find(FIND_STRUCTURES, {filter: (e) => e.structureType === STRUCTURE_KEEPER_LAIR}).length > 0) sk = true;
    if ((this.controller && this.controller.owner && !_.includes(FRIENDLIES, this.controller.owner.username)) || sk || (this.controller && this.controller.reservation && !_.includes(FRIENDLIES, this.controller.reservation.username))) return;
    this.memory.lastInvaderCheck = Game.time;
    let invader = _.filter(this.find(FIND_CREEPS), (c) => !_.includes(FRIENDLIES, c.owner['username']));
    if (invader.length > 0) {
        this.memory.responseNeeded = true;
        this.memory.tickDetected = Game.time;
        if (!this.memory.numberOfHostiles || this.memory.numberOfHostiles < invader.length) {
            this.memory.numberOfHostiles = invader.length;
        }
    } else if (this.memory.tickDetected < Game.time - 30 || this.memory.responseNeeded === false) {
        this.memory.numberOfHostiles = undefined;
        this.memory.responseNeeded = undefined;
        this.memory.alertEmail = undefined;
    }
};