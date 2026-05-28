import { merge } from 'es-toolkit/compat';
import type { TagDictionary } from '../util/object';
import { getLuma } from '../util/util';

const uninterestingKeys = new Set([
    'attribution',
    'created_by',
    'import_uuid',
    'lat',
    'latitude',
    'lon',
    'longitude',
    'source',
    'source_ref',
    'odbl',
    'odbl:note'
]);
const uninterestingKeyRegex = /^(source(_ref)?|at_bev|geobase|hcpaogis|KSJ2|mvdgis|nvdb|nysgissam|tiger):|:(identifier|ref|ref_id|id)$/;

/**
 * Returns whether the given OSM tag key is potentially "interesting".
 * For example, some tags are deemed not interesting because the respective tag is
 * considered "discardable".
 */
export function osmIsInterestingTag(key: string): boolean {
    if (uninterestingKeys.has(key)) return false;
    if (uninterestingKeyRegex.test(key))  return false;
    return true;
}

export const osmLifecyclePrefixes = {
    // nonexistent, might be built
    proposed: true, planned: true,
    // under maintenance or between groundbreaking and opening
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

export function osmRemoveLifecyclePrefix(key: TagKey): TagKey {
    const keySegments = key.split(':');
    if (keySegments.length === 1) return key;

    if (keySegments[0] in osmLifecyclePrefixes) {
        return key.slice(keySegments[0].length + 1);
    }

    return key;
}

export let osmAreaKeys: TagDictionary<true> = {};
export function osmSetAreaKeys(value: TagDictionary<true>): void {
    osmAreaKeys = value;
}

// `highway` and `railway` are typically linear features, but there
// are a few exceptions that should be treated as areas, even in the
// absence of a proper `area=yes` or `areaKeys` tag.. see #4194
// similarly, some tags are both used as a primary key for area features,
// but also as an attribute tag for linear features (e.g. `emergency=yes`)
export const osmAreaKeysExceptions: TagDictionary<boolean> = {
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
        wash: true,
        ventilation_shaft: true
    },
    waterway: {
        dam: true
    },
    amenity: {
        bicycle_parking: true
    },
    emergency: {
        yes: false,
        no: false,
        private: false,
        designated: false,
        destination: false,
        official: false
    }
};

// returns an object with the tag from `tags` that implies an area geometry, if any
export function osmTagSuggestingArea(tags: Tags): Tags | null {
    if (tags.area === 'yes') return { area: 'yes' };
    if (tags.area === 'no') return null;

    var returnTags: Tags = {};
    for (var realKey in tags) {
        const key = osmRemoveLifecyclePrefix(realKey);
        if (key in osmAreaKeysExceptions && osmAreaKeysExceptions[key][tags[realKey]] === false) {
            continue;
        }
        if (key in osmAreaKeys && !(tags[realKey] in osmAreaKeys[key])) {
            returnTags[realKey] = tags[realKey];
            return returnTags;
        }
        if (key in osmAreaKeysExceptions && tags[realKey] in osmAreaKeysExceptions[key]) {
            returnTags[realKey] = tags[realKey];
            return returnTags;
        }
    }
    return null;
}

export let osmLineTags: TagDictionary<true> = {};
export function osmSetLineTags(value: TagDictionary<true>): void {
    osmLineTags = value;
}

// Tags that indicate a node can be a standalone point
// e.g. { amenity: { bar: true, parking: true, ... } ... }
export let osmPointTags: TagDictionary<true> = {};
export function osmSetPointTags(value: TagDictionary<true>): void {
    osmPointTags = value;
}
// Tags that indicate a node can be part of a way
// e.g. { amenity: { parking: true, ... }, highway: { stop: true ... } ... }
export let osmVertexTags: TagDictionary<true> = {};
export function osmSetVertexTags(value: TagDictionary<true>): void {
    osmVertexTags = value;
}

//These tags belong strictly on ways and should never be moved up to a relation
export const osmWayOnlyTags: TagDictionary<true> = {
    'natural': {
        'coastline': true
    }
};

export function osmNodeGeometriesForTags(nodeTags: Tags) {
    const geometries: { point?: boolean; vertex?: boolean } = {};
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

export const osmOneWayForwardTags: TagDictionary<boolean> = {
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
    'conveying': {
        'forward': true,
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
    'oneway': {
        'yes': true,
    },
    'piste:type': {
        'downhill': true,
        'sled': true,
        'yes': true
    },
    'seamark:type': {
        'two-way_route': true,
        'recommended_traffic_lane': true,
        'separation_lane': true,
        'separation_roundabout': true
    },
    'waterway': {
        'canal': true,
        'ditch': true,
        'drain': true,
        'fish_pass': true,
        'flowline': true,
        'pressurised': true,
        'river': true,
        'spillway': true,
        'stream': true,
        'tidal_channel': true
    }
};
export const osmOneWayBackwardTags: TagDictionary<boolean> = {
    'conveying': {
        'backward': true,
    },
    'oneway': {
        '-1': true,
    },
};
export const osmOneWayBiDirectionalTags: TagDictionary<boolean> = {
    'conveying': {
        'reversible': true,
    },
    'oneway': {
        'alternating': true,
        'reversible': true,
    },
};
export const osmOneWayTags = merge(
    osmOneWayForwardTags,
    osmOneWayBackwardTags,
    osmOneWayBiDirectionalTags,
);

// solid and smooth surfaces akin to the assumed default road surface in OSM
export const osmPavedTags: TagDictionary<boolean> = {
    'surface': {
        'paved': true,
        'asphalt': true,
        'concrete': true,
        'chipseal': true,
        'concrete:lanes': true,
        'concrete:plates': true,
        'tiles': true
    },
    'tracktype': {
        'grade1': true
    }
};

// solid, if somewhat uncommon surfaces with a high range of smoothness
export const osmSemipavedTags: TagDictionary<boolean> = {
    'surface': {
        'bricks': true,
        'cobblestone': true,
        'unhewn_cobblestone': true,
        'sett': true,
        'paving_stones': true,
        'grass_paver': true,
        'metal': true,
        'metal_grid': true,
        'fibre_reinforced_polymer_grate': true,
        'wood': true
    }
};

/**
 * `true` means that the right side of the way is representing the "interesting"
 * side of the feature, e.g.:
 *   - the face of a cliff
 *   - the steep side of a retaining wall
 *   - the road side of a kerb
 *   - the downstream side of a weir
 * strings indicate special cases:
 *   - coastlines have the land on the right hand side, but we want to mark the ocean
 *   - guard rails have the road on the right, but we use dedicated markers that represent the posts of the guard rail
 *   - embankments can be on either or (typically) both sides of a road  or railway
 *   - cuttings (see embankments, and they also) use inverted triangles as markers
 */
export const osmSidednessTags: TagDictionary<true | string> = {
    'natural': {
        'cliff': true,
        'coastline': 'coastline'
    },
    'barrier': {
        'retaining_wall': true,
        'kerb': true,
        'guard_rail': 'guard_rail',
        'city_wall': true,
    },
    'man_made': {
        'embankment': true,
        'quay': true
    },
    'waterway': {
        'weir': true
    },
    'cutting': {
        'yes': 'cutting',
        'both': 'cutting',
        'left': 'cutting-left',
        'right': 'cutting-right'
    },
    'embankment': {
        'yes': 'embankment',
        'dyke': 'embankment',
        'both': 'embankment',
        'left': 'embankment-left',
        'right': 'embankment-right'
    },
};

// "highway" tag values for pedestrian or vehicle right-of-ways that make up the routable network
// (does not include `raceway`)
export const osmRoutableHighwayTagValues: Record<TagValue, true> = {
    motorway: true, trunk: true, primary: true, secondary: true, tertiary: true, residential: true,
    motorway_link: true, trunk_link: true, primary_link: true, secondary_link: true, tertiary_link: true,
    unclassified: true, road: true, service: true, track: true, living_street: true, bus_guideway: true, busway: true,
    path: true, footway: true, cycleway: true, bridleway: true, pedestrian: true, corridor: true, steps: true, ladder: true
};
/** aeroway tags that are treated as routable for aircraft */
export const osmRoutableAerowayTags: Record<TagValue, true> = {
    runway: true, taxiway: true
};
// "highway" tag values that generally do not allow motor vehicles
export const osmPathHighwayTagValues: Record<TagValue, true> = {
    path: true, footway: true, cycleway: true, bridleway: true, pedestrian: true, corridor: true, steps: true, ladder: true
};

// "railway" tag values representing existing railroad tracks (purposely does not include 'abandoned')
export const osmRailwayTrackTagValues: Record<TagValue, true> = {
    rail: true, light_rail: true, tram: true, subway: true,
    monorail: true, funicular: true, miniature: true, narrow_gauge: true,
    disused: true, preserved: true
};

// "waterway" tag values for line features representing water flow
export const osmFlowingWaterwayTagValues: Record<string, true> = {
    canal: true, ditch: true, drain: true, fish_pass: true, flowline: true, river: true, stream: true, tidal_channel: true
};

// Tag values that represent actual land use (areas)
export const osmLanduseTags: Record<TagKey, Record<TagValue, true> | true> = {
    'amenity': {
        'bicycle_parking': true,
        'college': true,
        'grave_yard': true,
        'hospital': true,
        'marketplace': true,
        'motorcycle_parking': true,
        'parking': true,
        'place_of_worship': true,
        'prison': true,
        'school': true,
        'university': true
    },
    'landuse': true,
    'leisure': true,
    'natural': true
};

// Tags which values should be considered case sensitive when offering tag suggestions
export const allowUpperCaseTagValues = /network|taxon|genus|species|brand|grape_variety|royal_cypher|listed_status|booth|rating|stars|:output|_hours|_times|_ref|manufacturer|country|target|brewery|cai_scale|traffic_sign/;

// Returns whether a `colour` tag value looks like a valid color we can display
export function isColorValid(value: string): boolean {
    if (!value) return false;
    if (!value.match(/^(#([0-9a-fA-F]{3}){1,2}|\w+)$/)) {
        // OSM only supports hex or named colors
        return false;
    }
    if (!CSS.supports('color', value) || ['unset', 'inherit', 'initial', 'revert'].includes(value)) {
        // see https://stackoverflow.com/a/68217760/1627467
        return false;
    }
    return true;
}

export function getRelationColor(tags: Tags, fallback: string) {
    let color = '', textColor = '';
    if (tags['ref:colour'])       color = tags['ref:colour'];
    else if (tags.colour)         color = tags.colour;
    const isValid = isColorValid(color);
    if (!isValid)                 color = fallback;
    if (tags['ref:colour_tx'])    textColor = tags['ref:colour_tx'];
    if (!isColorValid(textColor)) textColor = getLuma(color) > 165 ? '#000' : '#fff';

    return {
        isValid,
        color,
        textColor
    };
}

// https://wiki.openstreetmap.org/wiki/Special:WhatLinksHere/Property:P44
export const osmMutuallyExclusiveTagPairs: [TagKey, TagKey][] = [
    ['noname', 'name'],
    ['noref', 'ref'],
    ['nohousenumber', 'addr:housenumber'],
    ['noaddress', 'addr:housenumber'],
    ['noaddress', 'addr:housename'],
    ['noaddress', 'addr:unit'],
    ['addr:nostreet', 'addr:street']
];


/**
 * returns true if iD should render the `direction` tag for
 * this vertex+way combination.
 */
export function osmShouldRenderDirection(vertexTags: Tags, wayTags: Tags): boolean {
    if (vertexTags.highway || vertexTags.traffic_sign || vertexTags.traffic_calming || vertexTags.barrier) {
        // allowed on roads and tramways
        return !!(wayTags.highway || wayTags.railway);
    }
    if (vertexTags.railway) return !!wayTags.railway;
    if (vertexTags.waterway) return !!wayTags.waterway;
    if (vertexTags.cycleway === 'asl') return !!wayTags.highway;
    return true;
}

export const osmSummableTags: Set<TagKey> = new Set([
    'step_count',
    'parking:both:capacity',
    'parking:left:capacity',
    'parking:right:capacity'
]);

// ISO country codes keys
export const osmIsoCountryKeys: Set<TagKey> = new Set([
  'country',
  'target'
]);

export const osmUrlKeys: Set<TagKey> = new Set([
    'website',
    'url',
    'contact:website',
    'contact:url',
    'source:website',
    'source:url',
    'image',
    'brand:website',
    'operator:website',
    'network:website',
    'website:en',
    'website:fr',
    'website:menu',
    'post_office:website',
]);
