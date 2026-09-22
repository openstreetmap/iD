import type { GeoProjection } from 'd3';
import { geoMetersToLat } from '../geo';
import type { osmNode } from '../osm';

/**
 * Parses a distance value from an OSM tag, which
 * could either be a number, or a number with a unit
 * (e.g. `15 m`).
 * @returns value in metres or `undefined` if the value is invalid
 */
export function parseDistanceWithUnit(rawTagValue: string | undefined, defaultUnit: string) {
    const tagValue = rawTagValue?.trim();

    if (!tagValue) return undefined; // tag doesn't exist

    // special case when feet and inches are used together.
    const imperialCombo = tagValue.match(
        /([\d.]+) *('|ft|foot|feet) *([\d.]+) *("|in|inch|inches)/,
    );
    if (imperialCombo) {
        const feet = +imperialCombo[1];
        const inches = +imperialCombo[3];
        return feet / 3.281 + inches / 39.37;
    }

    // the remaining code parses normal values (number + optional unit)

    const unit = tagValue.match(/[^\d.]+/)?.[0].trim() || defaultUnit;
    const value = parseFloat(tagValue);

    if (Number.isNaN(value) || !Number.isFinite(value)) return undefined; // invalid value

    // convert to metres
    switch (unit) {
        case 'mm':
            return value / 1e3;
        case 'cm':
            return value / 1e2;
        case 'metres':
        case 'm':
            return value;
        case 'hectometres':
        case 'hm':
            return value * 1e2;
        case 'kilometres':
        case 'km':
            return value * 1e3;

        case 'statute_miles':
        case 'miles':
        case 'mi':
            return value * 1609;

        case 'nm':
            return value * 1852;

        case 'yard':
        case 'yards':
        case 'yd':
            return value / 1.094;

        case '\'':
        case 'feet':
        case 'foot':
        case 'ft':
            return value / 3.281;

        case '"':
        case 'inch':
        case 'inches':
        case 'in':
            return value / 39.37;

        default:
            return undefined;
    }
}

/** returns a list of metres */
export function getRadiusValuesFromTags(tags: Tags) {
    // check every known tag
    const diameters = [
        parseDistanceWithUnit(tags.diameter, 'mm'),
        parseDistanceWithUnit(tags.diameter_crown, 'm'),
        parseDistanceWithUnit(tags['hole:diameter'], 'm'),
    ];
    const radii = [
        parseDistanceWithUnit(tags.radius, 'm'),
        parseDistanceWithUnit(tags.crown_radius, 'm'),
        parseDistanceWithUnit(
            tags['seamark:anchor_berth:radius'],
            tags['seamark:anchor_berth:units'] || 'm',
        ),
    ];
    const circumferences = [
        parseDistanceWithUnit(tags.circumference, 'm'),
    ];

    const values: number[] = [];
    for (const diameter of diameters) {
        if (diameter) values.push(diameter / 2);
    }
    for (const radius of radii) {
        if (radius) values.push(radius);
    }
    for (const circumference of circumferences) {
        if (circumference) values.push(circumference / (2 * Math.PI));
    }

    return values;
}


export function getRadiusInPixels(node: osmNode, projection: GeoProjection, radius: number) {
    const center = projection(node.loc)!;
    const pointOnCircumference = projection([
        node.loc[0],
        node.loc[1] + geoMetersToLat(radius),
    ])!;

    // The radius is the difference in latitude between
    // the centre and the point on the circumference.
    const pixels = center[1] - pointOnCircumference[1];

    // don't try to render a circle that's too big to fit on the screen
    if (pixels > window.innerHeight || pixels > window.innerWidth) return 0;

    return Math.max(0, pixels);
}

/** returns a list of pixels */
export function getRadiiInPixels(node: osmNode, projection: GeoProjection) {
    return getRadiusValuesFromTags(node.tags)
        .filter(radius => radius > 0)
        .map(radius => getRadiusInPixels(node, projection, radius));
}
