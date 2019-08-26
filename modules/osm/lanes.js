
export function osmLanes(entity) {
    if (entity.type !== 'way') return null;
    if (!entity.tags.highway) return null;

    var tags = entity.tags;
    var isOneWay = entity.isOneWay();
    var laneCount = getLaneCount(tags, isOneWay);
    var maxspeed = parseMaxspeed(tags);

    var laneDirections = parseLaneDirections(tags, isOneWay, laneCount);
    var forward = laneDirections.forward;
    var backward = laneDirections.backward;
    var bothways = laneDirections.bothways;

    // parse the piped string 'x|y|z' format
    var turnLanes = {};
    turnLanes.unspecified = parseTurnLanes(tags['turn:lanes']);
    turnLanes.forward = parseTurnLanes(tags['turn:lanes:forward']);
    turnLanes.backward = parseTurnLanes(tags['turn:lanes:backward']);

    var maxspeedLanes = {};
    maxspeedLanes.unspecified = parseMaxspeedLanes(tags['maxspeed:lanes'], maxspeed);
    maxspeedLanes.forward = parseMaxspeedLanes(tags['maxspeed:lanes:forward'], maxspeed);
    maxspeedLanes.backward = parseMaxspeedLanes(tags['maxspeed:lanes:backward'], maxspeed);

    var psvLanes = {};
    psvLanes.unspecified = parseMiscLanes(tags['psv:lanes']);
    psvLanes.forward = parseMiscLanes(tags['psv:lanes:forward']);
    psvLanes.backward = parseMiscLanes(tags['psv:lanes:backward']);

    var busLanes = {};
    busLanes.unspecified = parseMiscLanes(tags['bus:lanes']);
    busLanes.forward = parseMiscLanes(tags['bus:lanes:forward']);
    busLanes.backward = parseMiscLanes(tags['bus:lanes:backward']);

    var taxiLanes = {};
    taxiLanes.unspecified = parseMiscLanes(tags['taxi:lanes']);
    taxiLanes.forward = parseMiscLanes(tags['taxi:lanes:forward']);
    taxiLanes.backward = parseMiscLanes(tags['taxi:lanes:backward']);

    var hovLanes = {};
    hovLanes.unspecified = parseMiscLanes(tags['hov:lanes']);
    hovLanes.forward = parseMiscLanes(tags['hov:lanes:forward']);
    hovLanes.backward = parseMiscLanes(tags['hov:lanes:backward']);

    var hgvLanes = {};
    hgvLanes.unspecified = parseMiscLanes(tags['hgv:lanes']);
    hgvLanes.forward = parseMiscLanes(tags['hgv:lanes:forward']);
    hgvLanes.backward = parseMiscLanes(tags['hgv:lanes:backward']);

    var bicyclewayLanes = {};
    bicyclewayLanes.unspecified = parseBicycleWay(tags['bicycleway:lanes']);
    bicyclewayLanes.forward = parseBicycleWay(tags['bicycleway:lanes:forward']);
    bicyclewayLanes.backward = parseBicycleWay(tags['bicycleway:lanes:backward']);

    var lanesObj = {
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
    var count;
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
    var maxspeed = tags.maxspeed;
    if (!maxspeed) return;

    var maxspeedRegex = /^([0-9][\.0-9]+?)(?:[ ]?(?:km\/h|kmh|kph|mph|knots))?$/;
    if (!maxspeedRegex.test(maxspeed)) return;

    return parseInt(maxspeed, 10);
}


function parseLaneDirections(tags, isOneWay, laneCount) {
    var forward = parseInt(tags['lanes:forward'], 10);
    var backward = parseInt(tags['lanes:backward'], 10);
    var bothways = parseInt(tags['lanes:both_ways'], 10) > 0 ? 1 : 0;

    if (parseInt(tags.oneway, 10) === -1) {
        forward = 0;
        bothways = 0;
        backward = laneCount;
    }
    else if (isOneWay) {
        forward = laneCount;
        bothways = 0;
        backward = 0;
    }
    else if (isNaN(forward) && isNaN(backward)) {
        backward = Math.floor((laneCount - bothways) / 2);
        forward = laneCount - bothways - backward;
    }
    else if (isNaN(forward)) {
        if (backward > laneCount - bothways) {
            backward = laneCount - bothways;
        }
        forward = laneCount - bothways - backward;
    }
    else if (isNaN(backward)) {
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

    var validValues = [
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
            var m = parseInt(s, 10);
            if (s === '' || m === maxspeed) return null;
            return isNaN(m) ? 'unknown': m;
        });
}


function parseMiscLanes(tag) {
    if (!tag) return;

    var validValues = [
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

    var validValues = [
        'yes', 'no', 'designated', 'lane'
    ];

    return tag.split('|')
        .map(function (s) {
            if (s === '') s = 'no';
            return validValues.indexOf(s) === -1 ? 'unknown': s;
        });
}


function mapToLanesObj(lanesObj, data, key) {
    if (data.forward) data.forward.forEach(function(l, i) {
        if (!lanesObj.forward[i]) lanesObj.forward[i] = {};
        lanesObj.forward[i][key] = l;
    });
    if (data.backward) data.backward.forEach(function(l, i) {
        if (!lanesObj.backward[i]) lanesObj.backward[i] = {};
        lanesObj.backward[i][key] = l;
    });
    if (data.unspecified) data.unspecified.forEach(function(l, i) {
        if (!lanesObj.unspecified[i]) lanesObj.unspecified[i] = {};
        lanesObj.unspecified[i][key] = l;
    });
}
