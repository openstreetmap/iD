
export function osmLanes(entity) {
    if (entity.type !== 'way') return null;
    if (!entity.tags.highway) return null;

    const tags = entity.tags;
    const isOneWay = entity.isOneWay();
    const laneCount = getLaneCount(tags, isOneWay);
    const maxspeed = parseMaxspeed(tags);

    const laneDirections = parseLaneDirections(tags, isOneWay, laneCount);
    const forward = laneDirections.forward;
    const backward = laneDirections.backward;
    const bothways = laneDirections.bothways;

    // parse the piped string 'x|y|z' format
    const turnLanes = {};
    turnLanes.unspecified = parseTurnLanes(tags['turn:lanes']);
    turnLanes.forward = parseTurnLanes(tags['turn:lanes:forward']);
    turnLanes.backward = parseTurnLanes(tags['turn:lanes:backward']);

    const maxspeedLanes = {};
    maxspeedLanes.unspecified = parseMaxspeedLanes(tags['maxspeed:lanes'], maxspeed);
    maxspeedLanes.forward = parseMaxspeedLanes(tags['maxspeed:lanes:forward'], maxspeed);
    maxspeedLanes.backward = parseMaxspeedLanes(tags['maxspeed:lanes:backward'], maxspeed);

    const psvLanes = {};
    psvLanes.unspecified = parseMiscLanes(tags['psv:lanes']);
    psvLanes.forward = parseMiscLanes(tags['psv:lanes:forward']);
    psvLanes.backward = parseMiscLanes(tags['psv:lanes:backward']);

    const busLanes = {};
    busLanes.unspecified = parseMiscLanes(tags['bus:lanes']);
    busLanes.forward = parseMiscLanes(tags['bus:lanes:forward']);
    busLanes.backward = parseMiscLanes(tags['bus:lanes:backward']);

    const taxiLanes = {};
    taxiLanes.unspecified = parseMiscLanes(tags['taxi:lanes']);
    taxiLanes.forward = parseMiscLanes(tags['taxi:lanes:forward']);
    taxiLanes.backward = parseMiscLanes(tags['taxi:lanes:backward']);

    const hovLanes = {};
    hovLanes.unspecified = parseMiscLanes(tags['hov:lanes']);
    hovLanes.forward = parseMiscLanes(tags['hov:lanes:forward']);
    hovLanes.backward = parseMiscLanes(tags['hov:lanes:backward']);

    const hgvLanes = {};
    hgvLanes.unspecified = parseMiscLanes(tags['hgv:lanes']);
    hgvLanes.forward = parseMiscLanes(tags['hgv:lanes:forward']);
    hgvLanes.backward = parseMiscLanes(tags['hgv:lanes:backward']);

    const bicyclewayLanes = {};
    bicyclewayLanes.unspecified = parseBicycleWay(tags['bicycleway:lanes']);
    bicyclewayLanes.forward = parseBicycleWay(tags['bicycleway:lanes:forward']);
    bicyclewayLanes.backward = parseBicycleWay(tags['bicycleway:lanes:backward']);

    const lanesObj = {
        forward: [],
        backward: [],
        unspecified: []
    };

    // map forward/backward/unspecified of each lane type to lanesObj
    mapToLanesObj(lanesObj, turnLanes, 'turnLane');
    mapToLanesObj(lanesObj, maxspeedLanes, 'maxspeed');
    mapToLanesObj(lanesObj, psvLanes, 'psv');
    mapToLanesObj(lanesObj, busLanes, 'bus');
    mapToLanesObj(lanesObj, taxiLanes, 'taxi');
    mapToLanesObj(lanesObj, hovLanes, 'hov');
    mapToLanesObj(lanesObj, hgvLanes, 'hgv');
    mapToLanesObj(lanesObj, bicyclewayLanes, 'bicycleway');

    return {
        metadata: {
            count: laneCount,
            oneway: isOneWay,
            forward: forward,
            backward: backward,
            bothways: bothways,
            turnLanes: turnLanes,
            maxspeed: maxspeed,
            maxspeedLanes: maxspeedLanes,
            psvLanes: psvLanes,
            busLanes: busLanes,
            taxiLanes: taxiLanes,
            hovLanes: hovLanes,
            hgvLanes: hgvLanes,
            bicyclewayLanes: bicyclewayLanes
        },
        lanes: lanesObj
    };
}


function getLaneCount(tags, isOneWay) {
    let count;
    if (tags.lanes) {
        count = parseInt(tags.lanes, 10);
        if (count > 0) {
            return count;
        }
    }


    switch (tags.highway) {
        case 'trunk':
        case 'motorway':
            count = isOneWay ? 2 : 4;
            break;
        default:
            count = isOneWay ? 1 : 2;
            break;
    }

    return count;
}


function parseMaxspeed(tags) {
    const maxspeed = tags.maxspeed;
    if (!maxspeed) return;

    const maxspeedRegex = /^([0-9][\.0-9]+?)(?:[ ]?(?:km\/h|kmh|kph|mph|knots))?$/;
    if (!maxspeedRegex.test(maxspeed)) return;

    return parseInt(maxspeed, 10);
}


function parseLaneDirections(tags, isOneWay, laneCount) {
    let forward = parseInt(tags['lanes:forward'], 10);
    let backward = parseInt(tags['lanes:backward'], 10);
    let bothways = parseInt(tags['lanes:both_ways'], 10) > 0 ? 1 : 0;

    if (parseInt(tags.oneway, 10) === -1) {
        forward = 0;
        bothways = 0;
        backward = laneCount;
    } else if (isOneWay) {
        forward = laneCount;
        bothways = 0;
        backward = 0;
    } else if (isNaN(forward) && isNaN(backward)) {
        backward = Math.floor((laneCount - bothways) / 2);
        forward = laneCount - bothways - backward;
    } else if (isNaN(forward)) {
        if (backward > laneCount - bothways) {
            backward = laneCount - bothways;
        }
        forward = laneCount - bothways - backward;
    } else if (isNaN(backward)) {
        if (forward > laneCount - bothways) {
            forward = laneCount - bothways;
        }
        backward = laneCount - bothways - forward;
    }
    return {
        forward: forward,
        backward: backward,
        bothways: bothways
    };
}


function parseTurnLanes(tag){
    if (!tag) return;

    const validValues = [
        'left', 'slight_left', 'sharp_left', 'through', 'right', 'slight_right',
        'sharp_right', 'reverse', 'merge_to_left', 'merge_to_right', 'none'
    ];

    return tag.split('|')
        .map(function (s) {
            if (s === '') s = 'none';
            return s.split(';')
                .map(function (d) {
                    return validValues.indexOf(d) === -1 ? 'unknown': d;
                });
        });
}


function parseMaxspeedLanes(tag, maxspeed) {
    if (!tag) return;

    return tag.split('|')
        .map(function (s) {
            if (s === 'none') return s;
            const m = parseInt(s, 10);
            if (s === '' || m === maxspeed) return null;
            return isNaN(m) ? 'unknown': m;
        });
}


function parseMiscLanes(tag) {
    if (!tag) return;

    const validValues = [
        'yes', 'no', 'designated'
    ];

    return tag.split('|')
        .map(function (s) {
            if (s === '') s = 'no';
            return validValues.indexOf(s) === -1 ? 'unknown': s;
        });
}


function parseBicycleWay(tag) {
    if (!tag) return;

    const validValues = [
        'yes', 'no', 'designated', 'lane'
    ];

    return tag.split('|')
        .map(function (s) {
            if (s === '') s = 'no';
            return validValues.indexOf(s) === -1 ? 'unknown': s;
        });
}


function mapToLanesObj(lanesObj, data, key) {
    if (data.forward) {
        data.forward.forEach(function(l, i) {
            if (!lanesObj.forward[i]) lanesObj.forward[i] = {};
            lanesObj.forward[i][key] = l;
        });
    }
    if (data.backward) {
        data.backward.forEach(function(l, i) {
            if (!lanesObj.backward[i]) lanesObj.backward[i] = {};
            lanesObj.backward[i][key] = l;
        });
    }
    if (data.unspecified) {
        data.unspecified.forEach(function(l, i) {
            if (!lanesObj.unspecified[i]) lanesObj.unspecified[i] = {};
            lanesObj.unspecified[i][key] = l;
        });
    }
}
