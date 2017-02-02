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

    // TODO: need to make sure forward lanes is consistent across all tags,
    // eg if psv:lanes:forward is 3 and lanes:forward is 2, changes lanes:forward =3,
    var metadata = {
        count: laneCount,
        oneway: isOneWay,
        turnLanes: turnLanes,
        maxspeedLanes: maxspeedLanes,
        psvLanes: psvLanes,
        busLanes: busLanes,
        taxiLanes: taxiLanes,
        hovLanes: hovLanes,
        hgvLanes: hgvLanes,
        bicyclewayLanes: bicyclewayLanes,
        reverse: parseInt(tags.oneway, 10) === -1
    };

    tallyLaneCount(metadata);
    parseLaneDirections(tags, isOneWay, metadata);

    return {
        metadata: metadata,
        getLayoutSeq: getLayoutSeq
    };
}

// Overides the lanes, lanes:forward, lanes:backward
// if the other lane tags dont tally.
function tallyLaneCount(metadata) {
    var consideredLaneTags = ['busLanes', 'hgvLanes', 'hovLanes', 'psvLanes', 'taxiLanes', 'turnLanes'];
    var maxUnspecified = 0;
    var maxForward = 0;
    var maxBackward = 0;

    consideredLaneTags.forEach(function (tag) {
        if (metadata[tag].unspecified.length > maxUnspecified)
            maxUnspecified = metadata[tag].unspecified.length;

        if (metadata[tag].forward.length > maxForward)
            maxForward = metadata[tag].forward.length;

        if (metadata[tag].backward.length > maxBackward)
            maxBackward = metadata[tag].backward.length;
    });

    if (metadata.oneway) {
        metadata.count = maxUnspecified > metadata.count ? maxUnspecified : metadata.count;
    } else {
        metadata.forward = maxForward > 0 ? maxForward : undefined;
        metadata.backward = maxBackward > 0 ? maxBackward : undefined;
    }
    // TODO: how to update if they decrease metadata.forward and the array would be bigger
    // this function would override it.
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

// TODO: needs fix, difference between maxspeed and lane:maxspeed
function parseMaxspeed(tags) {
    var maxspeed = tags.maxspeed;
    if (_.isNumber(maxspeed)) return maxspeed;
    if (_.isString(maxspeed)) {
        maxspeed = maxspeed.match(/^([0-9][\.0-9]+?)(?:[ ]?(?:km\/h|kmh|kph|mph|knots))?$/g);
        if (!maxspeed) return;
        return parseInt(maxspeed, 10);
    }
}

// gives priority to '*:lanes:direction' over 'lanes:direction'
function parseLaneDirections(tags, isOneWay, metadata) {
    var laneCount = metadata.count;
    var forward = metadata.forward || parseInt(tags['lanes:forward'], 10);
    var backward = metadata.backward || parseInt(tags['lanes:backward'], 10);
    var bothways = parseInt(tags['lanes:both_ways'], 10) > 0 ? 1 : 0;

    // should just rely on lane count
    if (isOneWay) {
        metadata.forward = 0;
        metadata.bothways = 0;
        metadata.backward = 0;
        return;
    }

    if (_.isNaN(forward) && _.isNaN(backward)) {
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
    metadata.forward = forward;
    metadata.bothways = bothways;
    metadata.backward = backward;
    metadata.count = forward + backward + bothways;

    return;
}

function parseTurnLanes(tag) {
    if (!tag) return [];
    // TODO: need to add reverse_left and reverse_right

    return tag.split('|')
        .map(function (s) {
            if (s === '') s = 'none';
            return s.split(';')
                .map(function (d) {
                    return validTurnLanes.indexOf(d) === -1 ? 'unknown' : d;
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
            return _.isNaN(m) ? 'unknown' : m;
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
            return validValues.indexOf(s) === -1 ? 'unknown' : s;
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
            return validValues.indexOf(s) === -1 ? 'unknown' : s;
        });
}

// TODO: exporting it directly since parameter leftHand is needed
export function getLayoutSeq(metadata, leftHand) {

    function turnLanesSeq(obj) {
        var dir = obj.dir;
        var index = obj.index;
        // will be '' if array goes out of bound
        obj.turnLanes = createSVGLink(metadata.turnLanes[dir][index]);
        return obj;
    }

    if (!metadata) return [];

    var seq = [];

    if (metadata.oneway) {
        seq = _.fill(Array(metadata.count), 0)
            .map(function (n, i) {
                return {
                    dir: 'unspecified',
                    index: i
                };
            });
    } else {
        var forward = metadata.forward;
        var backward = metadata.backward;

        var forSeq = _.fill(Array(forward), 0).map(function (n, i) {
            return {
                dir: 'forward',
                index: i
            };
        });
        // backward seq is always reversed in any hand drive.
        // eg: turn:lanes:backward=0|1|2|3, turn:lanes:forward=0|1|2 
        // LHD = 0,1,2<divider>3,2,1,0; RHD= 3,2,1,0<divider>0,1,2
        var backSeq = _.fill(Array(backward), 0).map(function (n, i) {
            return {
                dir: 'backward',
                index: backward - i - 1
            };
        });

        seq = leftHand ? [].concat(forSeq, backSeq)
            : [].concat(backSeq, forSeq);
    }

    seq = seq
        .map(turnLanesSeq);

    return seq;
}

function createSVGLink(directions) {
    if (!directions || !_.isArray(directions)) return '';
    var dir = _.cloneDeep(directions).sort(function (a, b) {
        // lane icons are sorted in lexical order
        return a.charCodeAt(0) - b.charCodeAt(0);
    });
    dir = dir.join('-');
    if (dir.indexOf('unknown') > -1 || dir.length === 0) return 'unknown';

    return dir;
}
