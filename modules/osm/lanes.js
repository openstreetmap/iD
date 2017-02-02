import _ from 'lodash';

export var validTurnLanes = [
    'left', 'slight_left', 'sharp_left', 'through', 'right', 'slight_right',
    'sharp_right', 'reverse', 'merge_to_left', 'merge_to_right', 'none'
];

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
    
    // sometimes just forward and backward are available
    laneCount = laneDirections.laneCount; 
    // TODO: if you change the forward backward and click on trash at top, 
    // laneCount and forward/backward goes out of sync

    // TODO: sometimes people just do turn:lanes:backward=|||| and dont mention
    // any kind of count. need to handle it
    // parse the piped string 'x|y|z' format

    // TODO: if you add 8 forward turn lanes and thrn put forward count as 4
    // goes out of sync. Reducing the number of forward turn lanes doesnt reduce turn lanes
    // forward
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

    // TODO: need to make sure forward lanes is consistent across all tags,
    // eg if psv:lanes:forward is 3 and lanes:forward is 2, changes lanes:forward =3,
    var metadata = {
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
            bicyclewayLanes: bicyclewayLanes,
            reverse: parseInt(tags.oneway, 10) === -1
    };
    return {
        metadata: metadata,
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
    if (_.isNumber(maxspeed)) return maxspeed;
    if (_.isString(maxspeed)) {
        maxspeed = maxspeed.match(/^([0-9][\.0-9]+?)(?:[ ]?(?:km\/h|kmh|kph|mph|knots))?$/g);
        if (!maxspeed) return;
        return parseInt(maxspeed, 10);
    }
}


function parseLaneDirections(tags, isOneWay, laneCount) {
    var forward = parseInt(tags['lanes:forward'], 10);
    var backward = parseInt(tags['lanes:backward'], 10);
    var bothways = parseInt(tags['lanes:both_ways'], 10) > 0 ? 1 : 0;
    var count = laneCount;
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
    else if (_.isNaN(forward) && _.isNaN(backward)) {
        backward = Math.floor((laneCount - bothways) / 2);
        forward = laneCount - bothways - backward;
    }
    else if (_.isNaN(forward)) {
        if (backward > laneCount - bothways) {
            backward = laneCount - bothways;
        }
        forward = laneCount - bothways - backward;
    }
    else if (_.isNaN(backward)) {
        if (forward > laneCount - bothways) {
            forward = laneCount - bothways;
        }
        backward = laneCount - bothways - forward;
    }

    return {
        forward: forward,
        backward: backward,
        bothways: bothways,
        laneCount: forward + backward+ bothways
    };
}


function parseTurnLanes(tag){
    if (!tag) return [];
    // TODO: need to add reverse_left and reverse_right

    return tag.split('|')
        .map(function (s) {
            if (s === '') s = 'none';
            return s.split(';')
                .map(function (d) {
                    return validTurnLanes.indexOf(d) === -1 ? 'unknown': d;
                });
        });
}


function parseMaxspeedLanes(tag, maxspeed) {
    if (!tag) return [];

    return tag.split('|')
        .map(function (s) {
            if (s === 'none') return s;
            var m = parseInt(s, 10);
            if (s === '' || m === maxspeed) return null;
            return _.isNaN(m) ? 'unknown': m;
        });
}


function parseMiscLanes(tag) {
    if (!tag) return [];

    var validValues = [
        'yes', 'no', 'designated'
    ];

    return tag.split('|')
        .map(function (s) {
            if (s === '') s = 'no';
            return validValues.indexOf(s) === -1 ? 'unknown': s;
        });
}

// TODO: need to append lanes? and make it return an array?
function parseBicycleWay(tag) {
    if (!tag) return [];

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

function lanesArray(lanesData) {
    var metadata = _.cloneDeep(lanesData);
    // var arr = new Array(metadata.count);
    var consideredLaneTags = [ 'busLanes', 'hgvLanes', 'hovLanes',  'maxspeedLanes', 'psvLanes', 'taxiLanes', 'turnLanes' ]; 
    var obj = {};

    obj.forward = new Array(metadata.forward);
    obj.backward =  new Array(metadata.backward);
    // obj.bothways = new Array(metadata.bothways); // jo
    obj.unspecified = new Array(metadata.count); //_.fill(Array(metadata.count), { });

    consideredLaneTags.forEach(function (laneTag) {
       var lane  = metadata[laneTag];
       Object.keys(lane).forEach(function (direction) {
        lane[direction]
            .forEach(function (tag, i) {
                if (!obj[direction][i]) obj[direction][i] = {};
                if (i < obj[direction].length) {
                    obj[direction][i][laneTag] = tag;
                }
            });
       });
    });
    
    return obj;
}

export function getLayoutSeq(metadata, leftHand, kind) {
    if (!metadata) return [];
    if (metadata.oneway) {
        return _.fill(Array(metadata.count), 0).map(function (n, i) {
            return {
                dir: 'unspecified',
                turnLanes: createSVGLink(metadata.turnLanes.unspecified[i]),
                index: i
            };
        });
    }
        
    var forward = metadata.forward;
    var backward = metadata.backward;

    var forSeq = _.fill(Array(forward), 0).map(function (n, i) {
        return {
            dir: 'forward',
            turnLanes: createSVGLink(metadata.turnLanes.forward[i]),
            index: i
        };
    });
    var backSeq = _.fill(Array(backward), 0).map(function (n, i) {
         return {
            dir: 'backward',
            turnLanes: createSVGLink(metadata.turnLanes.backward[backward - i - 1]),
            index:  backward - i - 1
        };
    });
   
    if (leftHand) {
        return [].concat(forSeq, backSeq);
    }
    return [].concat(backSeq, forSeq);
}

function createSVGLink(dirArray) {
            var directions =_.cloneDeep(dirArray);
            // console.log(d.dir);
            // directions = metadata.turnLanes[d.dir][d.index];

            // TODO: fix this vv
            if (!directions) return '';
            var dir = directions.sort(function (a, b) {
                return a.charCodeAt(0) - b.charCodeAt(0);
            });
            dir = dir.join('-');
            if (dir.indexOf('unknown') > -1 || dir.length === 0) return 'unknown';

            return dir;
        }

window.getLayoutSeq = getLayoutSeq;