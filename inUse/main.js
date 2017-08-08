//modules
//Setup globals and prototypes
require("globals")();
require("prototype.roomPosition");
require("prototype.room");
let profiler = require('screeps-profiler');
let _ = require('lodash');
let screepsPlus = require('screepsplus');
require('module.pathFinder');

// This line monkey patches the global prototypes.
profiler.enable();

module.exports.loop = function () {
    profiler.wrap(function () {
        Memory.stats.cpu.init = Game.cpu.getUsed();

        //Get tick duration
        Memory.stats.tickLength = Math.round(new Date() / 1000) - Memory.stats.tickOldEpoch;
        Memory.stats.tickOldEpoch = Math.round(new Date() / 1000);

        //GRAFANA
        screepsPlus.collect_stats();

        if (Game.cpu.bucket < 1000) {
            let expendable = _.filter(Game.creeps, (h) => h.memory.attackType === 'raid' || h.memory.role === 'scout' || h.memory.role === 'explorer' || h.memory.role === 'remoteHarvester' || h.memory.role === 'remoteHauler' || h.memory.role === 'SKworker' || h.memory.role === 'pioneer');
            for (let i = 0; i < expendable.length; i++) {
                expendable[i].suicide();
            }
        }

        //CLEANUP
        Memory.stats.cpu.preCleanup = Game.cpu.getUsed();
        if (Game.time % 100 === 0) {
            cleanPathCacheByUsage(); //clean path and distance caches
            cleanDistanceCacheByUsage();
        }
        for (let name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
        Memory.stats.cpu.postCleanup = Game.cpu.getUsed();

        //Room Management
        Memory.stats.cpu.preRoom = Game.cpu.getUsed();
        if (Game.cpu.getUsed() < Game.cpu.limit) {
            let roomController = require('module.roomController');
            roomController.roomControl();
        }
        Memory.stats.cpu.postRoom = Game.cpu.getUsed();

        //Military management
        Memory.stats.cpu.preMilitary = Game.cpu.getUsed();
        let attackController = require('military.attack');
        let defenseController = require('military.defense');
        Memory.stats.cpu.preMilitaryDefense = Game.cpu.getUsed();
        defenseController.controller();
        Memory.stats.cpu.postMilitaryDefense = Game.cpu.getUsed();
        Memory.stats.cpu.preMilitaryAttack = Game.cpu.getUsed();
        attackController.controller();
        Memory.stats.cpu.postMilitaryAttack = Game.cpu.getUsed();
        Memory.stats.cpu.postMilitary = Game.cpu.getUsed();

        //Creep Management
        Memory.stats.cpu.preCreep = Game.cpu.getUsed();
        let creepController = require('module.creepController');
        creepController.creepControl();
        Memory.stats.cpu.postCreep = Game.cpu.getUsed();

        //Tower Management
        Memory.stats.cpu.preTower = Game.cpu.getUsed();
        let towerController = require('module.towerController');
        towerController.towerControl();
        Memory.stats.cpu.postTower = Game.cpu.getUsed();

        //Link Management
        Memory.stats.cpu.preLink = Game.cpu.getUsed();
        if (Game.cpu.getUsed() < Game.cpu.limit) {
            let linkController = require('module.linkController');
            linkController.linkControl();
        }
        Memory.stats.cpu.postLink = Game.cpu.getUsed();

        //Lab Management
        Memory.stats.cpu.preLab = Game.cpu.getUsed();
        if (Game.cpu.getUsed() < Game.cpu.limit && Game.time % 10 === 0) {
                //let labController = require('module.labController');
                // labController.labControl();
        }
        Memory.stats.cpu.postLab = Game.cpu.getUsed();

        //Terminal Management
        Memory.stats.cpu.preTerminal = Game.cpu.getUsed();
        if (Game.cpu.getUsed() < Game.cpu.limit && Game.time % 25 === 0) {
                let terminalController = require('module.terminalController');
                terminalController.terminalControl();
        }
        Memory.stats.cpu.postTerminal = Game.cpu.getUsed();

        //Alliance List Management
        Memory.stats.cpu.preSegments = Game.cpu.getUsed();
        let doNotAggress = [
            {"username": "Shibdib", "status": "alliance"},
            {"username": "PostCrafter", "status": "alliance"},
            {"username": "Rising", "status": "alliance"},
            {"username": "wages123", "status": "alliance"},
            {"username": "SpaceRedleg", "status": "alliance"},
            {"username": "Donat", "status": "alliance"},
            {"username": "KageJ", "status": "alliance"},
            {"username": "BrinkDaDrink", "status": "alliance"},
            {"username": "Tyac", "status": "alliance"},
            {"username": "herghost", "status": "alliance"},
            {"username": "kirk", "status": "alliance"},
            {"username": "arcath", "status": "alliance"},
            {"username": "Smokeman", "status": "alliance"},
            {"username": "Pav234", "status": "alliance"},
            {"username": "Picoplankton", "status": "alliance"},
            {"username": "Troedfach", "status": "alliance"},
            {"username": "droben", "status": "nap"}
        ];
        let doNotAggressArray = [
            'Shibdib',
            'PostCrafter',
            'Rising',
            'wages123',
            'SpaceRedleg',
            'Donat',
            'KageJ',
            'BrinkDaDrink',
            'Tyac',
            'herghost',
            'kirk',
            'arcath',
            'Smokeman',
            'Pav234',
            'Picoplankton',
            'Troedfach',
            'droben'];
        let mainRaw = {
            "api": {
                "version": "draft",
                "update": 19939494
            },
            "channels": {
                "needs": {
                    "protocol": "roomneeds",
                    "segments": [50],
                    "update": 20155510
                },
            }
        };
        let roomNeeds = {
            "W53N83": {
                "power": true,
                "G": true
            }
        };
        RawMemory.segments[1] = JSON.stringify(doNotAggress);
        RawMemory.segments[2] = JSON.stringify(doNotAggressArray);
        if (JSON.stringify(mainRaw) !== RawMemory.segments[10]) RawMemory.segments[10] = JSON.stringify(mainRaw);
        if (JSON.stringify(roomNeeds) !== RawMemory.segments[50]) RawMemory.segments[50] = JSON.stringify(roomNeeds);
        RawMemory.setPublicSegments([1, 2, 10, 50]);
        RawMemory.setDefaultPublicSegment(1);
        RawMemory.setActiveSegments([1, 2, 10, 50]);

        //Cache Foreign Segments
        RawMemory.setActiveForeignSegment("Bovius");
        if (RawMemory.foreignSegment && RawMemory.foreignSegment.username === "Bovius" && RawMemory.foreignSegment.id === 0) {
            // Can't use data if you can't see it.
            Memory.marketCache = RawMemory.foreignSegment.data;
        }
        Memory.stats.cpu.postSegments = Game.cpu.getUsed();

        Memory.stats.cpu.used = Game.cpu.getUsed();
        let used = Memory.stats.cpu.used - Memory.stats.cpu.init;
        if (used > Game.cpu.limit * 2) console.log("<font color='#adff2f'>Abnormally High CPU Usage - " + used + " CPU</font>");
    });
};

function cleanPathCacheByUsage() {
    if(Memory.pathCache && _.size(Memory.pathCache) > 1500) { //1500 entries ~= 100kB
        let sorted = _.sortBy(Memory.pathCache, 'uses');
        let overage = (_.size(Memory.pathCache) - 1500) + 100;
        console.log('Cleaning Path cache (Over max size by '+overage+')...');
        Memory.pathCache = _.slice(sorted, overage, _.size(Memory.pathCache));
    }
}

function cleanDistanceCacheByUsage() {
    if(Memory.distanceCache && _.size(Memory.distanceCache) > 1500) { //1500 entries ~= 100kB
        let sorted = _.sortBy(Memory.distanceCache, 'uses');
        let overage = (_.size(Memory.distanceCache) - 1500) + 100;
        console.log('Cleaning Distance cache (Over max size by '+overage+')...');
        Memory.distanceCache = _.slice(sorted, overage, _.size(Memory.distanceCache));
    }
}
