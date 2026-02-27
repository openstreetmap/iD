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
    turnLanes.unspecified = parseTurnLanes(tags['turn:lanes'], laneCount);
    turnLanes.forward = parseTurnLanes(tags['turn:lanes:forward'], forward);
    turnLanes.backward = parseTurnLanes(tags['turn:lanes:backward'], backward);

    var maxspeedLanes = {};
    maxspeedLanes.unspecified = parseMaxspeedLanes(tags['maxspeed:lanes'], maxspeed, laneCount);
    maxspeedLanes.forward = parseMaxspeedLanes(tags['maxspeed:lanes:forward'], maxspeed, forward);
    maxspeedLanes.backward = parseMaxspeedLanes(tags['maxspeed:lanes:backward'], maxspeed, backward);

    var psvLanes = {};
    psvLanes.unspecified = parseMiscLanes(tags['psv:lanes'], laneCount);
    psvLanes.forward = parseMiscLanes(tags['psv:lanes:forward'], forward);
    psvLanes.backward = parseMiscLanes(tags['psv:lanes:backward'], backward);

    var busLanes = {};
    busLanes.unspecified = parseMiscLanes(tags['bus:lanes'], laneCount);
    busLanes.forward = parseMiscLanes(tags['bus:lanes:forward'], forward);
    busLanes.backward = parseMiscLanes(tags['bus:lanes:backward'], backward);

    var taxiLanes = {};
    taxiLanes.unspecified = parseMiscLanes(tags['taxi:lanes'], laneCount);
    taxiLanes.forward = parseMiscLanes(tags['taxi:lanes:forward'], forward);
    taxiLanes.backward = parseMiscLanes(tags['taxi:lanes:backward'], backward);

    var hovLanes = {};
    hovLanes.unspecified = parseMiscLanes(tags['hov:lanes'], laneCount);
    hovLanes.forward = parseMiscLanes(tags['hov:lanes:forward'], forward);
    hovLanes.backward = parseMiscLanes(tags['hov:lanes:backward'], backward);

    var hgvLanes = {};
    hgvLanes.unspecified = parseMiscLanes(tags['hgv:lanes'], laneCount);
    hgvLanes.forward = parseMiscLanes(tags['hgv:lanes:forward'], forward);
    hgvLanes.backward = parseMiscLanes(tags['hgv:lanes:backward'], backward);

    var bicyclewayLanes = {};
    bicyclewayLanes.unspecified = parseBicycleWay(tags['bicycleway:lanes'], laneCount);
    bicyclewayLanes.forward = parseBicycleWay(tags['bicycleway:lanes:forward'], forward);
    bicyclewayLanes.backward = parseBicycleWay(tags['bicycleway:lanes:backward'], backward);

    var lanesObj = [];

    // map forward/backward/unspecified of each lane type to lanesObj

    if (tags['lanes:forward'] || tags['lanes:backward'] || tags['lanes:both_ways']) {
        if (backward > 0) {
            mapToLanesObj(lanesObj, Array(backward).fill(''), 'placeholder', 'backward');
        }
        if (bothways > 0) {
            mapToLanesObj(lanesObj, Array(bothways).fill(''), 'placeholder', 'bothways');
        }
        if (forward > 0) {
            mapToLanesObj(lanesObj, Array(forward).fill(''), 'placeholder', 'forward');
        }
    } else {
        mapToLanesObj(lanesObj, Array(laneCount).fill(''), 'placeholder', isOneWay ? 'forward' : 'unspecified');
    }

    mapToLanesObj(lanesObj, turnLanes.unspecified, 'turnLane', 'unspecified');
    mapToLanesObj(lanesObj, turnLanes.forward, 'turnLane', 'forward');
    mapToLanesObj(lanesObj, turnLanes.backward, 'turnLane', 'backward');

    mapToLanesObj(lanesObj, maxspeedLanes.unspecified, 'maxspeed', 'unspecified');
    mapToLanesObj(lanesObj, maxspeedLanes.forward, 'maxspeed', 'forward');
    mapToLanesObj(lanesObj, maxspeedLanes.backward, 'maxspeed', 'backward');

    mapToLanesObj(lanesObj, psvLanes.unspecified, 'psv', 'unspecified');
    mapToLanesObj(lanesObj, psvLanes.forward, 'psv', 'forward');
    mapToLanesObj(lanesObj, psvLanes.backward, 'psv', 'backward');

    mapToLanesObj(lanesObj, busLanes.unspecified, 'bus', 'unspecified');
    mapToLanesObj(lanesObj, busLanes.forward, 'bus', 'forward');
    mapToLanesObj(lanesObj, busLanes.backward, 'bus', 'backward');

    mapToLanesObj(lanesObj, taxiLanes.unspecified, 'taxi', 'unspecified');
    mapToLanesObj(lanesObj, taxiLanes.forward, 'taxi', 'forward');
    mapToLanesObj(lanesObj, taxiLanes.backward, 'taxi', 'backward');

    mapToLanesObj(lanesObj, hovLanes.unspecified, 'hov', 'unspecified');
    mapToLanesObj(lanesObj, hovLanes.forward, 'hov', 'forward');
    mapToLanesObj(lanesObj, hovLanes.backward, 'hov', 'backward');

    mapToLanesObj(lanesObj, hgvLanes.unspecified, 'hgv', 'unspecified');
    mapToLanesObj(lanesObj, hgvLanes.forward, 'hgv', 'forward');
    mapToLanesObj(lanesObj, hgvLanes.backward, 'hgv', 'backward');

    mapToLanesObj(lanesObj, bicyclewayLanes.unspecified, 'bicycleway', 'unspecified');
    mapToLanesObj(lanesObj, bicyclewayLanes.forward, 'bicycleway', 'forward');
    mapToLanesObj(lanesObj, bicyclewayLanes.backward, 'bicycleway', 'backward');

    // remove placeholder before returning
    lanesObj.forEach(function(l) { delete l.placeholder; delete l.innerIndex; });

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


function parseTurnLanes(tag, expectedCount) {
    if (!tag) return;

    var validValues = [
        'left', 'slight_left', 'sharp_left', 'through', 'right', 'slight_right',
        'sharp_right', 'reverse', 'merge_to_left', 'merge_to_right', 'none'
    ];

    var parsed = tag.split('|')
        .map(function(s) {
            if (s === '') s = 'none';
            return s.split(';')
                .map(function (d) {
                    return validValues.indexOf(d) === -1 ? 'unknown': d;
                });
        });

    if (expectedCount !== undefined && parsed.length !== expectedCount) {
        if (parsed.length > expectedCount) {
            parsed = parsed.slice(0, expectedCount);
        } else {
            while (parsed.length < expectedCount) {
                parsed.push(['unknown']);
            }
        }
    }
    return parsed;
}


function parseMaxspeedLanes(tag, maxspeed, expectedCount) {
    if (!tag) return;

    var parsed = tag.split('|')
        .map(function(s) {
            if (s === 'none') return s;
            var m = parseInt(s, 10);
            if (s === '' || m === maxspeed) return null;
            return isNaN(m) ? 'unknown': m;
        });

    if (expectedCount !== undefined && parsed.length !== expectedCount) {
        if (parsed.length > expectedCount) {
            parsed = parsed.slice(0, expectedCount);
        } else {
            while (parsed.length < expectedCount) {
                parsed.push('unknown');
            }
        }
    }
    return parsed;
}


function parseMiscLanes(tag, expectedCount) {
    if (!tag) return;

    var validValues = [
        'yes', 'no', 'designated'
    ];

    var parsed = tag.split('|')
        .map(function(s) {
            if (s === '') s = 'no';
            return validValues.indexOf(s) === -1 ? 'unknown': s;
        });

    if (expectedCount !== undefined && parsed.length !== expectedCount) {
        if (parsed.length > expectedCount) {
            parsed = parsed.slice(0, expectedCount);
        } else {
            while (parsed.length < expectedCount) {
                parsed.push('unknown');
            }
        }
    }
    return parsed;
}


function parseBicycleWay(tag, expectedCount) {
    if (!tag) return;

    var validValues = [
        'yes', 'no', 'designated', 'lane'
    ];

    var parsed = tag.split('|')
        .map(function(s) {
            if (s === '') s = 'no';
            return validValues.indexOf(s) === -1 ? 'unknown': s;
        });

    if (expectedCount !== undefined && parsed.length !== expectedCount) {
        if (parsed.length > expectedCount) {
            parsed = parsed.slice(0, expectedCount);
        } else {
            while (parsed.length < expectedCount) {
                parsed.push('unknown');
            }
        }
    }
    return parsed;
}

function mapToLanesObj(lanesObj, directionArray, key, directionTag) {
    if (directionArray) {
        directionArray.forEach(function(l, i) {
            var newLane;
            if (directionTag === 'unspecified') {
                if (lanesObj[i]) {
                    lanesObj[i][key] = l;
                } else {
                    newLane = {
                        direction: 'unspecified',
                        innerIndex: i,
                        index: lanesObj.length
                    };
                    newLane[key] = l;
                    lanesObj.push(newLane);
                }
            } else {
                var existing = lanesObj.find(function(lane) { return lane.direction === directionTag && lane.innerIndex === i; });
                if (existing) {
                    existing[key] = l;
                } else {
                    newLane = {
                        direction: directionTag,
                        innerIndex: i,
                        index: lanesObj.length
                    };
                    newLane[key] = l;
                    lanesObj.push(newLane);
                }
            }
        });
    }
}
