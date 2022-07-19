export function osmIsInterestingTag(key) {
    return key !== 'attribution' &&
        key !== 'created_by' &&
        key !== 'source' &&
        key !== 'odbl' &&
        key.indexOf('source:') !== 0 &&
        key.indexOf('source_ref') !== 0 && // purposely exclude colon
        key.indexOf('tiger:') !== 0;
}

export const osmLifecyclePrefixes = {
    // nonexistent, might be built
    proposed: true, planned: true,
    // under maintentance or between groundbreaking and opening
    construction: true,
    // existent but not functional
    disused: true,
    // dilapidated to nonexistent
    abandoned: true, was: true,
    // nonexistent, still may appear in imagery
    dismantled: true, razed: true, demolished: true, destroyed: true, removed: true, obliterated: true,
    // existent occasionally, e.g. stormwater drainage basin
    intermittent: true
};

/** @param {string} key */
export function osmRemoveLifecyclePrefix(key) {
    const keySegments = key.split(':');
    if (keySegments.length === 1) return key;

    if (keySegments[0] in osmLifecyclePrefixes) {
        return key.slice(keySegments[0].length + 1);
    }

    return key;
}

export var osmAreaKeys = {};
export function osmSetAreaKeys(value) {
    osmAreaKeys = value;
}

// `highway` and `railway` are typically linear features, but there
// are a few exceptions that should be treated as areas, even in the
// absence of a proper `area=yes` or `areaKeys` tag.. see #4194
export var osmAreaKeysExceptions = {
    highway: {
        elevator: true,
        rest_area: true,
        services: true
    },
    public_transport: {
        platform: true
    },
    railway: {
        platform: true,
        roundhouse: true,
        station: true,
        traverser: true,
        turntable: true,
        wash: true
    },
    waterway: {
        dam: true
    }
};

// returns an object with the tag from `tags` that implies an area geometry, if any
export function osmTagSuggestingArea(tags) {
    if (tags.area === 'yes') return { area: 'yes' };
    if (tags.area === 'no') return null;

    var returnTags = {};
    for (var realKey in tags) {
        const key = osmRemoveLifecyclePrefix(realKey);
        if (key in osmAreaKeys && !(tags[key] in osmAreaKeys[key])) {
            returnTags[realKey] = tags[realKey];
            return returnTags;
        }
        if (key in osmAreaKeysExceptions && tags[key] in osmAreaKeysExceptions[key]) {
            returnTags[realKey] = tags[realKey];
            return returnTags;
        }
    }
    return null;
}

// Tags that indicate a node can be a standalone point
// e.g. { amenity: { bar: true, parking: true, ... } ... }
export var osmPointTags = {};
export function osmSetPointTags(value) {
    osmPointTags = value;
}
// Tags that indicate a node can be part of a way
// e.g. { amenity: { parking: true, ... }, highway: { stop: true ... } ... }
export var osmVertexTags = {};
export function osmSetVertexTags(value) {
    osmVertexTags = value;
}

export function osmNodeGeometriesForTags(nodeTags) {
    var geometries = {};
    for (var key in nodeTags) {
        if (osmPointTags[key] &&
            (osmPointTags[key]['*'] || osmPointTags[key][nodeTags[key]])) {
            geometries.point = true;
        }
        if (osmVertexTags[key] &&
            (osmVertexTags[key]['*'] || osmVertexTags[key][nodeTags[key]])) {
            geometries.vertex = true;
        }
        // break early if both are already supported
        if (geometries.point && geometries.vertex) break;
    }
    return geometries;
}

export var osmOneWayTags = {
    'aerialway': {
        'chair_lift': true,
        'drag_lift': true,
        'j-bar': true,
        'magic_carpet': true,
        'mixed_lift': true,
        'platter': true,
        'rope_tow': true,
        't-bar': true,
        'zip_line': true
    },
    'highway': {
        'motorway': true
    },
    'junction': {
        'circular': true,
        'roundabout': true
    },
    'man_made': {
        'goods_conveyor': true,
        'piste:halfpipe': true
    },
    'piste:type': {
        'downhill': true,
        'sled': true,
        'yes': true
    },
    'seamark:type': {
        'separation_lane': true,
        'separation_roundabout': true
    },
    'waterway': {
        'canal': true,
        'ditch': true,
        'drain': true,
        'fish_pass': true,
        'river': true,
        'stream': true,
        'tidal_channel': true
    }
};

// solid and smooth surfaces akin to the assumed default road surface in OSM
export var osmPavedTags = {
    'surface': {
        'paved': true,
        'asphalt': true,
        'concrete': true,
        'chipseal': true,
        'concrete:lanes': true,
        'concrete:plates': true
    },
    'tracktype': {
        'grade1': true
    }
};

// solid, if somewhat uncommon surfaces with a high range of smoothness
export var osmSemipavedTags = {
    'surface': {
        'cobblestone': true,
        'cobblestone:flattened': true,
        'unhewn_cobblestone': true,
        'sett': true,
        'paving_stones': true,
        'metal': true,
        'wood': true
    }
};

export var osmRightSideIsInsideTags = {
    'natural': {
        'cliff': true,
        'coastline': 'coastline',
    },
    'barrier': {
        'retaining_wall': true,
        'kerb': true,
        'guard_rail': true,
        'city_wall': true,
    },
    'man_made': {
        'embankment': true
    },
    'waterway': {
        'weir': true
    }
};

// "highway" tag values for pedestrian or vehicle right-of-ways that make up the routable network
// (does not include `raceway`)
export var osmRoutableHighwayTagValues = {
    motorway: true, trunk: true, primary: true, secondary: true, tertiary: true, residential: true,
    motorway_link: true, trunk_link: true, primary_link: true, secondary_link: true, tertiary_link: true,
    unclassified: true, road: true, service: true, track: true, living_street: true, bus_guideway: true,
    path: true, footway: true, cycleway: true, bridleway: true, pedestrian: true, corridor: true, steps: true
};
// "highway" tag values that generally do not allow motor vehicles
export var osmPathHighwayTagValues = {
    path: true, footway: true, cycleway: true, bridleway: true, pedestrian: true, corridor: true, steps: true
};

// "railway" tag values representing existing railroad tracks (purposely does not include 'abandoned')
export var osmRailwayTrackTagValues = {
    rail: true, light_rail: true, tram: true, subway: true,
    monorail: true, funicular: true, miniature: true, narrow_gauge: true,
    disused: true, preserved: true
};

// "waterway" tag values for line features representing water flow
export var osmFlowingWaterwayTagValues = {
    canal: true, ditch: true, drain: true, fish_pass: true, river: true, stream: true, tidal_channel: true
};
