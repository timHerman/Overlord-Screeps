/*
 * Copyright (c) 2020.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

/**
 * Created by rober on 5/16/2017.
 */
let layouts = require('module.roomLayouts');
let minCut = require('util.minCut');

module.exports.buildRoom = function (room) {
    if (room.memory.layout && room.memory.bunkerHub) {
        if (room.memory.layoutVersion === LAYOUT_VERSION) {
            if (Memory.myRooms.length === 1 || room.controller.level >= 4) {
                return buildFromLayout(room);
            } else {
                return newClaimBuild(room);
            }
        } else {
            return updateLayout(room);
        }
    } else {
        findHub(room);
    }
};

module.exports.hubCheck = function (room) {
    return findHub(room)
};

function buildFromLayout(room) {
    if (!room.memory.bunkerVersion) room.memory.bunkerVersion = 1;
    let hub = new RoomPosition(room.memory.bunkerHub.x, room.memory.bunkerHub.y, room.name);
    let level = room.controller.level;
    let layout = JSON.parse(room.memory.layout);
    let extensionLevel = getLevel(room);
    let filter = _.filter(layout, (s) => s.structureType !== STRUCTURE_OBSERVER && s.structureType !== STRUCTURE_POWER_SPAWN && s.structureType !== STRUCTURE_NUKER && s.structureType !== STRUCTURE_TERMINAL && s.structureType !== STRUCTURE_TOWER && s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_LINK && s.structureType !== STRUCTURE_LAB);
    // Handle a rebuild
    let builtSpawn = _.filter(room.structures, (s) => s.structureType === STRUCTURE_SPAWN)[0];
    if (!builtSpawn && room.controller.safeMode >= 5000) {
        filter = _.filter(layout, (s) => s.structureType === STRUCTURE_SPAWN);
    } else {
        // Build preset layout
        if (level === 8) {
            filter = _.filter(layout, (s) => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_RAMPART);
        } else if (level === 7) {
            filter = _.filter(layout, (s) => s.structureType !== STRUCTURE_OBSERVER && s.structureType !== STRUCTURE_POWER_SPAWN && s.structureType !== STRUCTURE_NUKER && s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_RAMPART);
        } else if (level === 6) {
            filter = _.filter(layout, (s) => s.structureType !== STRUCTURE_OBSERVER && s.structureType !== STRUCTURE_POWER_SPAWN && s.structureType !== STRUCTURE_NUKER && s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_RAMPART);
        } else if (level < 6 && level >= 3) {
            filter = _.filter(layout, (s) => s.structureType !== STRUCTURE_OBSERVER && s.structureType !== STRUCTURE_POWER_SPAWN && s.structureType !== STRUCTURE_NUKER && s.structureType !== STRUCTURE_TERMINAL && s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_LAB);
        }
    }
    let built;
    for (let structure of shuffle(filter)) {
        let pos = new RoomPosition(structure.x, structure.y, room.name);
        if (level !== extensionLevel && (structure.structureType !== STRUCTURE_EXTENSION && structure.structureType !== STRUCTURE_SPAWN && structure.structureType !== STRUCTURE_TOWER && structure.structureType !== STRUCTURE_TERMINAL)) continue;
        if (level === extensionLevel && structure.structureType === STRUCTURE_EXTENSION) continue;
        if (_.filter(room.constructionSites, (s) => s.structureType === structure.structureType && s.progress < s.progressTotal * 0.99).length) continue;
        // Special case labs
        if (structure.structureType === STRUCTURE_LAB) {
            if (!_.filter(room.structures, (s) => s.structureType === STRUCTURE_LAB).length && _.filter(room.constructionSites, (s) => s.structureType === STRUCTURE_LAB).length && !pos.isNearTo(_.filter(room.constructionSites, (s) => s.structureType === STRUCTURE_LAB)[0])) continue;
            if (_.filter(room.structures, (s) => s.structureType === STRUCTURE_LAB).length === 1 && !pos.isNearTo(_.filter(room.structures, (s) => s.structureType === STRUCTURE_LAB)[0])) continue;
            if (_.filter(room.structures, (s) => s.structureType === STRUCTURE_LAB).length === 2 && !pos.isNearTo(_.filter(room.structures, (s) => s.structureType === STRUCTURE_LAB)[0])) continue;
        }
        if (!pos.checkForConstructionSites() && !pos.checkForAllStructure().length) {
            if (pos.createConstructionSite(structure.structureType) === OK) {
                built = true;
                break;
            }
        }
    }
    // Handle special buildings
    if (!built && level === 8 && level === extensionLevel) {
        let factory = _.filter(room.structures, (s) => s.structureType === STRUCTURE_FACTORY)[0] || _.filter(room.constructionSites, (s) => s.structureType === STRUCTURE_FACTORY)[0];
        let power = _.filter(room.structures, (s) => s.structureType === STRUCTURE_POWER_SPAWN)[0] || _.filter(room.constructionSites, (s) => s.structureType === STRUCTURE_POWER_SPAWN)[0];
        let nuker = _.filter(room.structures, (s) => s.structureType === STRUCTURE_NUKER)[0] || _.filter(room.constructionSites, (s) => s.structureType === STRUCTURE_NUKER)[0];
        if (!factory || !power || !nuker) {
            let filter = _.filter(layout, (s) => s.structureType === STRUCTURE_EXTENSION);
            let buildThis = STRUCTURE_FACTORY;
            if (!power) buildThis = STRUCTURE_POWER_SPAWN; else if (!nuker) buildThis = STRUCTURE_NUKER;
            for (let structure of shuffle(filter)) {
                let pos = new RoomPosition(structure.x, structure.y, room.name);
                if (!pos.checkForConstructionSites() && !pos.checkForAllStructure().length) {
                    if (pos.createConstructionSite(buildThis) === OK) {
                        built = true;
                        break;
                    }
                }
            }
        }
    }
    // Hub
    if (room.memory.bunkerVersion < 2 || room.memory.bunkerVersion > 5) {
        if (level >= 5 || room.memory.hubLink) {
            delete room.memory.hubContainer;
            if (hub.checkForAllStructure()[0]) {
                if (hub.checkForAllStructure()[0].structureType === STRUCTURE_LINK) room.memory.hubLink = hub.checkForAllStructure()[0].id;
                if (hub.checkForAllStructure()[0].structureType === STRUCTURE_LINK && !hub.checkForAllStructure()[0].isActive()) room.memory.hubLink = undefined;
                if (hub.checkForAllStructure()[0].structureType === STRUCTURE_CONTAINER) hub.checkForAllStructure()[0].destroy();
            }
            if (!hub.checkForConstructionSites() && !hub.checkForAllStructure().length) hub.createConstructionSite(STRUCTURE_LINK);
        }
    } else if (level >= 5) {
            delete room.memory.hubContainer;
            let links = _.filter(room.structures, (s) => s.structureType === STRUCTURE_LINK && s.id !== room.memory.controllerLink && s.pos.getRangeTo(s.pos.findClosestByRange(FIND_SOURCES)) > 2 && s.pos.getRangeTo(s.pos.findClosestByRange(FIND_EXIT)) > 3 && s.isActive());
            if (links.length) {
                let a = [];
                links.forEach((l) => a.push(l.id))
                room.memory.hubLinks = a;
            }
        }
    // Bunker Ramparts
    if (level >= 2 && !_.filter(room.constructionSites, (s) => s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL).length) {
        if (!room.memory.rampartsSet || Math.random() > 0.98) {
            // Clean old ramparts from new claims
            if (!room.memory.rampartSpots) {
                let cleaner = _.filter(room.structures, (s) => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_RAMPART && s.pos.checkForRampart());
                cleaner.forEach((s) => s.pos.checkForRampart().destroy())
            }
            room.memory.rampartSpots = undefined;
            room.memory.rampartsSet = 1;
            let hubBuffer = 8;
            let hub = new RoomPosition(room.memory.bunkerHub.x, room.memory.bunkerHub.y, room.name);
            let closestExit = hub.getRangeTo(hub.findClosestByRange(FIND_EXIT)) - 2;
            if (closestExit < hubBuffer) hubBuffer = closestExit;
            let rect_array = [];
            rect_array.push({
                x1: room.memory.bunkerHub.x - hubBuffer,
                y1: room.memory.bunkerHub.y - hubBuffer,
                x2: room.memory.bunkerHub.x + hubBuffer,
                y2: room.memory.bunkerHub.y + hubBuffer
            });
            // Sources
            for (let source of room.sources) {
                rect_array.push({
                    x1: source.x - 1,
                    y1: source.y - 1,
                    x2: source.x + 1,
                    y2: source.y + 1
                });
            }
            rect_array.push({
                x1: room.controller.pos.x - 1,
                y1: room.controller.pos.y - 1,
                x2: room.controller.pos.x + 1,
                y2: room.controller.pos.y + 1
            });
            let bounds = {x1: 0, y1: 0, x2: 49, y2: 49};
            room.memory.rampartSpots = JSON.stringify(minCut.GetCutTiles(room.name, rect_array, bounds));
        } else if (room.memory.rampartSpots) {
            let buildPositions = JSON.parse(room.memory.rampartSpots);
            for (let rampartPos of buildPositions) {
                let pos = new RoomPosition(rampartPos.x, rampartPos.y, room.name);
                if (level >= 2) {
                    // Handle tunnels
                    if (pos.checkForWall()) {
                        for (let xOff = -1; xOff <= 1; xOff++) {
                            for (let yOff = -1; yOff <= 1; yOff++) {
                                if (xOff !== 0 || yOff !== 0) {
                                    let newPos = new RoomPosition(pos.x + xOff, pos.y + yOff, pos.roomName);
                                    if (!newPos.checkForWall() && !newPos.checkForBarrierStructure() && !newPos.checkForConstructionSites() && newPos.createConstructionSite(STRUCTURE_RAMPART) === OK) break;
                                }
                            }
                        }
                    } else if (!pos.isNearTo(room.controller) && !pos.isNearTo(room.mineral) && !pos.isNearTo(pos.findClosestByRange(FIND_SOURCES)) && ((isEven(pos.x) && isOdd(pos.y)) || (isOdd(pos.x) && isEven(pos.y))) && !pos.checkForBuiltWall() && !pos.checkForConstructionSites() && pos.isNearTo(pos.findClosestByRange(_.filter(room.structures, (s) => s.structureType === STRUCTURE_RAMPART)))) {
                        if (pos.checkForRampart()) pos.checkForRampart().destroy();
                        if (pos.checkForRoad()) pos.checkForRoad().destroy();
                        pos.createConstructionSite(STRUCTURE_WALL);
                        break;
                    } else if (!pos.checkForRampart() && !pos.checkForBuiltWall() && !pos.checkForConstructionSites()) {
                        pos.createConstructionSite(STRUCTURE_RAMPART);
                        break;
                    } else if (pos.checkForBuiltWall() && pos.checkForRampart()) {
                        pos.checkForRampart().destroy();
                    } else if (pos.checkForBuiltWall() && pos.checkForRoad()) {
                        pos.checkForRoad().destroy();
                    }
                } else if (pos.isNearTo(room.controller)) {
                    if (!pos.checkForBarrierStructure() && !pos.checkForConstructionSites() && pos.createConstructionSite(STRUCTURE_RAMPART) === OK) break;
                }
                /**else if (!pos.checkForObstacleStructure() && !pos.checkForRoad() &&
                 !_.filter(room.constructionSites, (s) => s.structureType === STRUCTURE_ROAD && s.progress < s.progressTotal * 0.95).length) pos.createConstructionSite(STRUCTURE_ROAD);**/
            }
        }
    }
    // Controller
    let controllerContainer = Game.getObjectById(room.memory.controllerContainer);
    if (!controllerContainer) {
        controllerContainer = _.filter(room.controller.pos.findInRange(room.structures, 1), (s) => s.structureType === STRUCTURE_CONTAINER)[0];
        if (!controllerContainer) {
            let controllerBuild = _.filter(room.controller.pos.findInRange(FIND_CONSTRUCTION_SITES, 1), (s) => s.structureType === STRUCTURE_CONTAINER)[0];
            if (!controllerBuild && room.controller.level >= 2) {
                for (let xOff = -1; xOff <= 1; xOff++) {
                    for (let yOff = -1; yOff <= 1; yOff++) {
                        if (xOff !== 0 || yOff !== 0) {
                            let pos = new RoomPosition(room.controller.pos.x + xOff, room.controller.pos.y + yOff, room.name);
                            if (!pos.checkForImpassible()) return pos.createConstructionSite(STRUCTURE_CONTAINER);
                        }
                    }
                }
            }
        } else {
            room.memory.controllerContainer = controllerContainer.id;
        }
    } else if (room.controller.level >= 7) {
        let controllerLink = _.filter(room.controller.pos.findInRange(room.structures, 2), (s) => s.structureType === STRUCTURE_LINK)[0];
        if (!controllerLink) {
            let zoneTerrain = room.lookForAtArea(LOOK_TERRAIN, controllerContainer.pos.y - 1, controllerContainer.pos.x - 1, controllerContainer.pos.y + 1, controllerContainer.pos.x + 1, true);
            for (let key in zoneTerrain) {
                if (_.filter(controllerContainer.pos.findInRange(FIND_CONSTRUCTION_SITES, 1), (s) => s.structureType === STRUCTURE_LINK)[0]) break;
                let position = new RoomPosition(zoneTerrain[key].x, zoneTerrain[key].y, room.name);
                if (position.checkForAllStructure().length || position.checkForImpassible()) continue;
                position.createConstructionSite(STRUCTURE_LINK);
                break;
            }
        } else {
            room.memory.controllerLink = controllerLink.id;
        }
    }
    // Mineral Container
    let extractor = _.filter(room.structures, (s) => s.structureType === STRUCTURE_EXTRACTOR)[0];
    if (extractor) {
        let extractorContainer = _.filter(extractor.pos.findInRange(room.structures, 1), (s) => s.structureType === STRUCTURE_CONTAINER)[0];
        if (!extractorContainer) {
            let extractorBuild = _.filter(extractor.pos.findInRange(FIND_CONSTRUCTION_SITES, 1), (s) => s.structureType === STRUCTURE_CONTAINER)[0];
            if (!extractorBuild) {
                let containerSpots = room.lookForAtArea(LOOK_TERRAIN, extractor.pos.y - 1, extractor.pos.x - 1, extractor.pos.y + 1, extractor.pos.x + 1, true);
                for (let key in containerSpots) {
                    let position = new RoomPosition(containerSpots[key].x, containerSpots[key].y, room.name);
                    if (position && position.getRangeTo(extractor) === 1) {
                        if (!position.checkForImpassible()) {
                            position.createConstructionSite(STRUCTURE_CONTAINER);
                            break;
                        }
                    }
                }
            }
        } else {
            room.memory.extractorContainer = extractorContainer.id;
        }
    }
    // Roads
    let inBuild = false;
    if (_.filter(room.constructionSites, (s) => s.structureType === STRUCTURE_ROAD && s.progress < s.progressTotal * 0.95).length) {
        inBuild = true;
    }
    if (!inBuild && level >= 3 && _.size(room.constructionSites) < 5 && level === extensionLevel) {
        if (level >= 4) {
            let filter = _.filter(layout, (s) => s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_RAMPART);
            for (let structure of filter) {
                let pos = new RoomPosition(structure.x, structure.y, room.name);
                if (!pos.checkForRoad() && !pos.checkForConstructionSites() && !pos.checkForImpassible() && !pos.checkForWall()) {
                    if (pos.createConstructionSite(STRUCTURE_ROAD) === OK) {
                        inBuild = true;
                        break;
                    }
                }
            }
        }
        if (!inBuild && !room.constructionSites.length) {
            let spawn = shuffle(_.filter(room.structures, (s) => s.structureType === STRUCTURE_SPAWN))[0];
            // Source Roads
            for (let source of room.sources) {
                let harvester = _.filter(room.creeps, (s) => s.my && s.memory.role === 'stationaryHarvester' && s.memory.containerID && s.memory.source === source.id)[0];
                if (harvester) {
                    let container = Game.getObjectById(harvester.memory.containerID);
                    if (container && buildRoadFromTo(room, spawn, container)) {
                        inBuild = true;
                        break;
                    }
                }
            }
            // Neighboring Roads
            let neighboring = Game.map.describeExits(spawn.pos.roomName);
            if (!inBuild && neighboring) {
                if (neighboring['1']) {
                    let exits = spawn.room.find(FIND_EXIT_TOP);
                    let middle = _.round(exits.length / 2);
                    if (buildRoadFromTo(spawn.room, spawn, exits[middle])) {
                        inBuild = true;
                    }
                }
                if (!inBuild && neighboring['3']) {
                    let exits = spawn.room.find(FIND_EXIT_RIGHT);
                    let middle = _.round(exits.length / 2);
                    if (buildRoadFromTo(spawn.room, spawn, exits[middle])) {
                        inBuild = true;
                    }
                }
                if (!inBuild && neighboring['5']) {
                    let exits = spawn.room.find(FIND_EXIT_BOTTOM);
                    let middle = _.round(exits.length / 2);
                    if (buildRoadFromTo(spawn.room, spawn, exits[middle])) {
                        inBuild = true;
                    }
                }
                if (!inBuild && neighboring['7']) {
                    let exits = spawn.room.find(FIND_EXIT_LEFT);
                    let middle = _.round(exits.length / 2);
                    if (buildRoadFromTo(spawn.room, spawn, exits[middle])) {
                        inBuild = true;
                    }
                }
            }
            // Controller Road
            let container = Game.getObjectById(room.memory.controllerContainer);
            if (!inBuild && container) {
                buildRoadFromTo(room, spawn, container);
            }
            // Mineral Roads/Harvester
            if (!inBuild && level >= 6) {
                let mineral = room.find(FIND_MINERALS)[0];
                let container = Game.getObjectById(room.memory.extractorContainer);
                let spawn = shuffle(_.filter(room.structures, (s) => s.structureType === STRUCTURE_SPAWN))[0];
                if (!mineral.pos.checkForAllStructure().length && !mineral.pos.checkForConstructionSites()) mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
                buildRoadFromTo(room, spawn, container);
            }
        }
    }
    // Cleanup
    let noRoad = _.filter(room.structures, (s) => OBSTACLE_OBJECT_TYPES.includes(s.structureType) && s.pos.checkForRoad());
    if (noRoad.length) noRoad.forEach((s) => s.pos.checkForRoad().destroy());
    let badStructure = _.filter(room.structures, (s) => (s.owner && s.owner.username !== MY_USERNAME && s.structureType !== STRUCTURE_STORAGE && s.structureType !== STRUCTURE_TERMINAL));
    if (level >= 6) {
        badStructure = _.filter(room.structures, (s) => (s.owner && s.owner.username !== MY_USERNAME));
    } else if (level >= 4) {
        badStructure = _.filter(room.structures, (s) => (s.owner && s.owner.username !== MY_USERNAME && s.structureType !== STRUCTURE_TERMINAL));
    }
    if (badStructure.length) badStructure.forEach((s) => s.destroy());
}

function newClaimBuild(room) {
    let level = room.controller.level;
    let badStructure = _.filter(room.structures, (s) => (s.owner && s.owner.username !== MY_USERNAME));
    if (badStructure.length) badStructure.forEach((s) => s.destroy());
    if (level < 2) return;
    // Cleanup
    let noRoad = _.filter(room.structures, (s) => OBSTACLE_OBJECT_TYPES.includes(s.structureType) && s.pos.checkForRoad());
    if (noRoad.length) noRoad.forEach((s) => s.pos.checkForRoad().destroy());
    let layout = JSON.parse(room.memory.layout);
    // Rampart the controller to counter unclaimers
    buildRampartAround(room, room.controller.pos);
    // Build tower rampart, then tower, then spawn
    let towers = _.filter(room.structures, (s) => s.structureType === STRUCTURE_TOWER);
    let spawns = _.filter(room.structures, (s) => s.structureType === STRUCTURE_SPAWN);
    if (!spawns.length) {
        let spawn = _.filter(layout, (s) => s.structureType === STRUCTURE_SPAWN)[0];
        let pos = new RoomPosition(spawn.x, spawn.y, room.name);
        // Spawn Rampart
        if (!pos.checkForConstructionSites() && !pos.checkForRampart()) return pos.createConstructionSite(STRUCTURE_RAMPART);
        // Spawn
        if (!pos.checkForConstructionSites() && !pos.checkForObstacleStructure()) return pos.createConstructionSite(STRUCTURE_SPAWN);
    } else if (!towers.length) {
        let tower = _.filter(layout, (s) => s.structureType === STRUCTURE_TOWER)[0];
        let pos = new RoomPosition(tower.x, tower.y, room.name);
        // Tower Rampart
        if (!pos.checkForConstructionSites() && !pos.checkForRampart()) return pos.createConstructionSite(STRUCTURE_RAMPART);
        // Tower
        if (!pos.checkForConstructionSites() && !pos.checkForObstacleStructure()) return pos.createConstructionSite(STRUCTURE_TOWER);
    } else {
        return buildFromLayout(room);
    }
}

function findHub(room) {
    if (room.memory.bunkerHub) return;
    let pos;
    if (!room.memory.typeSearch) room.memory.typeSearch = 1;
    let spawn = _.filter(room.structures, (s) => s.my && s.structureType === STRUCTURE_SPAWN)[0];
    primary:
        for (let i = 1; i < 2000; i++) {
            let searched = [];
            let hubSearch = room.memory.newHubSearch || 0;
            if (hubSearch >= layouts.layoutArray.length * 2500 && !room.memory.bunkerHub) {
                abandonRoom(room.name);
                if (!Memory.noClaim) Memory.noClaim = [];
                Memory.noClaim.push(room.name);
                log.a(room.name + ' has been abandoned due to being unable to find a suitable hub location.');
                Game.notify(room.name + ' has been abandoned due to being unable to find a suitable hub location.');
                return;
            }
            let buildTemplate = _.sample(layouts.layoutArray);
            let layoutVersion = buildTemplate[0]['layout'];
            let xOffset, yOffset;
            if (spawn) {
                let spawnPos;
                for (let type of buildTemplate) {
                    if (type.type !== STRUCTURE_SPAWN) continue;
                    spawnPos = type.pos[0];
                }
                let yVar, xVar;
                if (layoutVersion === 1) {
                    yVar = 16;
                    xVar = 15;
                } else {
                    yVar = 25;
                    xVar = 25;
                }
                xOffset = difference(spawnPos.x, xVar);
                if (spawnPos.x > xVar) xOffset *= -1;
                yOffset = difference(spawnPos.y, yVar);
                if (spawnPos.y > yVar) yOffset *= -1;
                pos = new RoomPosition(spawn.pos.x + xOffset, spawn.pos.y + yOffset, room.name);
                xOffset = difference(pos.x, xVar);
                if (pos.x < xVar) xOffset *= -1;
                yOffset = difference(pos.y, yVar);
                if (pos.y < yVar) yOffset *= -1;
            } else {
                pos = new RoomPosition(getRandomInt(9, 40), getRandomInt(9, 40), room.name);
                let yVar, xVar;
                if (layoutVersion === 1) {
                    yVar = 16;
                    xVar = 15;
                } else {
                    yVar = 25;
                    xVar = 25;
                }
                xOffset = difference(pos.x, xVar);
                if (pos.x < xVar) xOffset *= -1;
                yOffset = difference(pos.y, yVar);
                if (pos.y < yVar) yOffset *= -1;
            }
            let clean = pos.x + '.' + pos.y;
            if (!_.includes(searched, clean)) {
                searched.push(clean);
                room.memory.newHubSearch = hubSearch + 1;
                let controller = room.controller;
                let closestSource = pos.findClosestByRange(FIND_SOURCES);
                let layout = [];
                for (let type of buildTemplate) {
                    for (let s of type.pos) {
                        let structure = {};
                        structure.structureType = type.type;
                        structure.x = s.x + xOffset;
                        structure.y = s.y + yOffset;
                        let structurePos = new RoomPosition(structure.x, structure.y, room.name);
                        if (type.type !== STRUCTURE_RAMPART && (structurePos.checkIfOutOfBounds() || pos.getRangeTo(controller) < 2 || pos.getRangeTo(closestSource) < 2 || structurePos.checkForWall())) {
                            continue primary;
                        }
                        layout.push(structure);
                    }
                }
                room.memory.bunkerHub = {};
                room.memory.bunkerHub.x = pos.x;
                room.memory.bunkerHub.y = pos.y;
                room.memory.hubSearch = undefined;
                room.memory.layout = JSON.stringify(layout);
                room.memory.layoutVersion = LAYOUT_VERSION;
                room.memory.bunkerVersion = layoutVersion;
                return true;
            }
        }
}

function updateLayout(room) {
    let buildTemplate;
    let layoutVersion = room.memory.bunkerVersion;
    for (let i = 0; i < layouts.allLayouts.length; i++) {
        if (layouts.allLayouts[i][0]['layout'] === layoutVersion) {
            buildTemplate = layouts.allLayouts[i];
            break;
        }
    }
    let pos = new RoomPosition(room.memory.bunkerHub.x, room.memory.bunkerHub.y, room.name);
    let yVar, xVar, xOffset, yOffset;
    if (layoutVersion === 1) {
        yVar = 16;
        xVar = 15;
    } else {
        yVar = 25;
        xVar = 25;
    }
    xOffset = difference(pos.x, xVar);
    if (pos.x < xVar) xOffset *= -1;
    yOffset = difference(pos.y, yVar);
    if (pos.y < yVar) yOffset *= -1;
    let layout = [];
    for (let type of buildTemplate) {
        for (let s of type.pos) {
            let structure = {};
            structure.structureType = type.type;
            structure.x = s.x + xOffset;
            structure.y = s.y + yOffset;
            layout.push(structure);
        }
    }
    room.memory.layoutVersion = LAYOUT_VERSION;
    room.memory.layout = JSON.stringify(layout);
}

function abandonRoom(room) {
    let overlordFor = _.filter(Game.creeps, (c) => c.memory && c.memory.overlord === room);
    if (overlordFor.length) {
        for (let key in overlordFor) {
            overlordFor[key].memory.recycle = true;
        }
    }
    for (let key in Game.rooms[room].structures) {
        Game.rooms[room].structures[key].destroy();
    }
    for (let key in Game.rooms[room].constructionSites) {
        Game.rooms[room].constructionSites[key].remove();
    }
    let noClaim = Memory.noClaim || [];
    noClaim.push(room);
    delete Game.rooms[room].memory;
    Game.rooms[room].controller.unclaim();
};

function difference(num1, num2) {
    return (num1 > num2) ? num1 - num2 : num2 - num1
}

function buildRoadFromTo(room, start, end) {
    let target;
    if (end instanceof RoomPosition) target = end; else target = end.pos;
    let path = getRoad(room, start.pos, target);
    if (!path) {
        path = start.pos.findPathTo(end, {
            maxOps: 10000,
            serialize: false,
            ignoreCreeps: true,
            maxRooms: 1,
            costCallback: function (roomName, costMatrix) {
                let terrain = Game.map.getRoomTerrain(room.name);
                for (let y = 0; y < 50; y++) {
                    for (let x = 0; x < 50; x++) {
                        let tile = terrain.get(x, y);
                        if (tile === 0) costMatrix.set(x, y, 25);
                        if (tile === 1) costMatrix.set(x, y, 225);
                        if (tile === 2) costMatrix.set(x, y, 35);
                    }
                }
                for (let structures of room.structures) {
                    if (_.includes(OBSTACLE_OBJECT_TYPES, structures.structureType)) {
                        costMatrix.set(structures.pos.x, structures.pos.y, 256);
                    }
                }
                for (let site of room.constructionSites) {
                    if (site.structureType === STRUCTURE_ROAD) {
                        costMatrix.set(site.pos.x, site.pos.y, 1);
                    }
                }
                for (let road of room.structures) {
                    if (road.structureType === STRUCTURE_ROAD) {
                        costMatrix.set(road.pos.x, road.pos.y, 1);
                    }
                    if (road.structureType === STRUCTURE_CONTAINER) {
                        costMatrix.set(road.pos.x, road.pos.y, 71);
                    }
                }
            },
        });
        if (path.length) cacheRoad(room, start.pos, target, path); else return;
        for (let point of path) {
            let pos = new RoomPosition(point.x, point.y, room.name);
            if (buildRoad(pos, room)) return true;
        }
    } else {
        for (let point of JSON.parse(path)) {
            let pos = new RoomPosition(point.x, point.y, room.name);
            if (buildRoad(pos, room)) return true;
        }
    }
}

function buildRoadAround(room, position) {
    for (let xOff = -1; xOff <= 1; xOff++) {
        for (let yOff = -1; yOff <= 1; yOff++) {
            if (xOff !== 0 || yOff !== 0) {
                let pos = new RoomPosition(position.x + xOff, position.y + yOff, room.name);
                buildRoad(pos, room);
            }
        }
    }
}

function buildRampartAround(room, position) {
    for (let xOff = -1; xOff <= 1; xOff++) {
        for (let yOff = -1; yOff <= 1; yOff++) {
            if (xOff !== 0 || yOff !== 0) {
                let pos = new RoomPosition(position.x + xOff, position.y + yOff, room.name);
                if (!pos.checkForWall() && !pos.checkForConstructionSites() && !pos.checkForRampart()) pos.createConstructionSite(STRUCTURE_RAMPART);
            }
        }
    }
}

function buildRoad(position, room) {
    if (room.constructionSites.length >= 10 || position.checkForImpassible(true) || _.filter(room.constructionSites, (s) => s.structureType === STRUCTURE_ROAD).length > 2) {
        return false;
    } else if (position.checkForRoad()) {
        room.memory.roadsBuilt = true;
        return false;
    } else if (room.controller.level < 5 && position.checkForSwamp()) {
        if (position.createConstructionSite(STRUCTURE_ROAD) === OK) {
            room.memory.roadsBuilt = undefined;
            return true;
        }
    } else {
        if (position.createConstructionSite(STRUCTURE_ROAD) === OK) {
            room.memory.roadsBuilt = undefined;
            return true;
        }
    }
}

function cacheRoad(room, from, to, path) {
    let key = getPathKey(from, to);
    let cache = ROAD_CACHE[room.name] || {};
    let tick = Game.time;
    cache[key] = {
        path: JSON.stringify(path),
        tick: tick
    };
    ROAD_CACHE[room.name] = cache;
}

function getRoad(room, from, to) {
    if (room.memory._roadCache) room.memory._roadCache = undefined;
    let cache = ROAD_CACHE[room.name] || undefined;
    if (!cache) return;
    let cachedPath = cache[getPathKey(from, to)];
    if (cachedPath) {
        return cachedPath.path;
    } else {
        return;
    }
}

function getPathKey(from, to) {
    return getPosKey(from) + '$' + getPosKey(to);
}

function getPosKey(pos) {
    return pos.x + 'x' + pos.y;
}

let protectedStructures = [
    STRUCTURE_SPAWN,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_TERMINAL,
    STRUCTURE_NUKER,
    STRUCTURE_OBSERVER,
    STRUCTURE_LINK,
    STRUCTURE_LAB
];