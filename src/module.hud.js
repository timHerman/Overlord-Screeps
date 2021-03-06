/*
 * Copyright (c) 2020.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

let constructionSiteInfo = {};

module.exports.hud = function () {
    //GCL
    let lastTickGCLProgress = Memory.lastTickGCLProgress || 0;
    Memory.gclProgressArray = Memory.gclProgressArray || [];
    let progressPerTick = Game.gcl.progress - lastTickGCLProgress;
    Memory.lastTickGCLProgress = Game.gcl.progress;
    let paused = '*P* ';
    if (progressPerTick > 0) {
        paused = '';
        if (Memory.gclProgressArray.length < 250) {
            Memory.gclProgressArray.push(progressPerTick)
        } else {
            Memory.gclProgressArray.shift();
            Memory.gclProgressArray.push(progressPerTick)
        }
    }
    progressPerTick = average(Memory.gclProgressArray);
    let secondsToUpgrade = _.round(((Game.gcl.progressTotal - Game.gcl.progress) / progressPerTick) * Memory.tickLength);
    let ticksToUpgrade = _.round((Game.gcl.progressTotal - Game.gcl.progress) / progressPerTick);
    let displayTime;
    if (secondsToUpgrade < 60) displayTime = secondsToUpgrade + ' Seconds';
    if (secondsToUpgrade >= 86400) displayTime = _.round(secondsToUpgrade / 86400, 2) + ' Days';
    if (secondsToUpgrade < 86400 && secondsToUpgrade >= 3600) displayTime = _.round(secondsToUpgrade / 3600, 2) + ' Hours';
    if (secondsToUpgrade > 60 && secondsToUpgrade < 3600) displayTime = _.round(secondsToUpgrade / 60, 2) + ' Minutes';
    let myRooms = _.filter(Game.rooms, (r) => r.energyAvailable && r.controller.owner && r.controller.owner.username === MY_USERNAME);
    for (let room of myRooms) {
        if (!room) continue;
        let spawns = _.filter(room.structures, (s) => s.my && s.structureType === STRUCTURE_SPAWN);
        let activeSpawns = _.filter(spawns, (s) => s.spawning);
        let lowerBoundary = 3;
        if (room.memory.claimTarget) lowerBoundary++;
        if (!Memory.roomCache[room.name]) room.cacheRoomIntel(true);
        if (Memory.roomCache[room.name].responseNeeded) lowerBoundary++;
        room.visual.rect(0, 0, 16, lowerBoundary + activeSpawns.length, {
            fill: '#ffffff',
            opacity: '0.55',
            stroke: 'black'
        });
        //GCL Display
        displayText(room, 0, 1, paused + ICONS.upgradeController + ' GCL: ' + Game.gcl.level + ' - ' + displayTime + ' / ' + ticksToUpgrade + ' ticks.');
        //SPAWNING
        if (activeSpawns.length) {
            let i = 0;
            for (let spawn of activeSpawns) {
                let spawningCreep = Game.creeps[spawn.spawning.name];
                displayText(room, 0, lowerBoundary + i, spawn.name + ICONS.build + ' ' + _.capitalize(spawningCreep.name.split("_")[0]) + ' - Ticks: ' + spawn.spawning.remainingTime);
                i++;
            }
        }
        //Safemode
        if (room.controller.safeMode) {
            let secondsToNoSafe = room.controller.safeMode * Memory.tickLength;
            let displayTime;
            if (secondsToNoSafe < 60) displayTime = secondsToNoSafe + ' Seconds';
            if (secondsToNoSafe >= 86400) displayTime = _.round(secondsToNoSafe / 86400, 2) + ' Days';
            if (secondsToNoSafe < 86400 && secondsToNoSafe >= 3600) displayTime = _.round(secondsToNoSafe / 3600, 2) + ' Hours';
            if (secondsToNoSafe > 60 && secondsToNoSafe < 3600) displayTime = _.round(secondsToNoSafe / 60, 2) + ' Minutes';
            if (displayTime) room.controller.say(displayTime + ' / ' + room.controller.safeMode + ' ticks.');
        }
        //Construction
        if (room.constructionSites.length) {
            for (let site of room.constructionSites) {
                let roomSites = constructionSiteInfo[room.name] || {};
                let siteInfo = roomSites[site.id] || {};
                let lastTickProgress = siteInfo['lastTickProgress'] || site.progress;
                siteInfo['lastTickProgress'] = site.progress;
                let progressPerTick = site.progress - lastTickProgress;
                siteInfo['progressArray'] = siteInfo['progressArray'] || [];
                if (progressPerTick > 0) {
                    if (siteInfo['progressArray'].length < 25) {
                        siteInfo['progressArray'].push(progressPerTick)
                    } else {
                        siteInfo['progressArray'].shift();
                        siteInfo['progressArray'].push(progressPerTick)
                    }
                }
                progressPerTick = average(siteInfo['progressArray']);
                let secondsToUpgrade = _.round(((site.progressTotal - site.progress) / progressPerTick) * Memory.tickLength);
                let ticksToUpgrade = _.round((site.progressTotal - site.progress) / progressPerTick);
                let displayTime;
                if (secondsToUpgrade < 60) displayTime = secondsToUpgrade + ' Seconds';
                if (secondsToUpgrade >= 86400) displayTime = _.round(secondsToUpgrade / 86400, 2) + ' Days';
                if (secondsToUpgrade < 86400 && secondsToUpgrade >= 3600) displayTime = _.round(secondsToUpgrade / 3600, 2) + ' Hours';
                if (secondsToUpgrade > 60 && secondsToUpgrade < 3600) displayTime = _.round(secondsToUpgrade / 60, 2) + ' Minutes';
                if (displayTime) site.say(displayTime + ' / ' + ticksToUpgrade + ' ticks.');
                roomSites[site.id] = siteInfo;
                constructionSiteInfo[room.name] = roomSites;
            }
        } else {
            constructionSiteInfo[room.name] = {};
        }
        //Controller
        if (room.controller.progressTotal) {
            let lastTickProgress = room.memory.lastTickProgress || room.controller.progress;
            room.memory.lastTickProgress = room.controller.progress;
            let progressPerTick = room.controller.progress - lastTickProgress;
            room.memory.rclProgressArray = room.memory.rclProgressArray || [];
            let paused = '*P* ';
            if (progressPerTick > 0) {
                paused = '';
                if (room.memory.rclProgressArray.length < 250) {
                    room.memory.rclProgressArray.push(progressPerTick)
                } else {
                    room.memory.rclProgressArray.shift();
                    room.memory.rclProgressArray.push(progressPerTick)
                }
            }
            progressPerTick = average(room.memory.rclProgressArray);
            let secondsToUpgrade = _.round(((room.controller.progressTotal - room.controller.progress) / progressPerTick) * Memory.tickLength);
            let ticksToUpgrade = _.round((room.controller.progressTotal - room.controller.progress) / progressPerTick);
            let displayTime;
            if (secondsToUpgrade < 60) displayTime = secondsToUpgrade + ' Seconds';
            if (secondsToUpgrade >= 86400) displayTime = _.round(secondsToUpgrade / 86400, 2) + ' Days';
            if (secondsToUpgrade < 86400 && secondsToUpgrade >= 3600) displayTime = _.round(secondsToUpgrade / 3600, 2) + ' Hours';
            if (secondsToUpgrade > 60 && secondsToUpgrade < 3600) displayTime = _.round(secondsToUpgrade / 60, 2) + ' Minutes';
            displayText(room, 0, 2, paused + ICONS.upgradeController + ' ' + room.controller.level + ' - ' + displayTime + ' / ' + ticksToUpgrade + ' ticks. (' + room.memory.averageCpu + '/R.CPU)');
        } else {
            delete room.memory.lastTickProgress;
            delete room.memory.rclProgressArray;
            displayText(room, 0, 2, ICONS.upgradeController + ' Controller Level: ' + room.controller.level + ' (' + room.memory.averageCpu + '/R.CPU)');
        }
        let y = lowerBoundary - (activeSpawns.length || 1);
        if (Memory.roomCache[room.name].responseNeeded) {
            displayText(room, 0, y, ICONS.crossedSword + ' RESPONSE NEEDED: Threat Level ' + Memory.roomCache[room.name].threatLevel);
            y++;
        }
        if (room.memory.claimTarget) {
            displayText(room, 0, y, ICONS.claimController + ' Claim Target: ' + room.memory.claimTarget);
            y++;
        }
    }
};