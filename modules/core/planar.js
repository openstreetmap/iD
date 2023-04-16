import { geoMetersToLat } from '../geo';


/**
 * Parses a distance value from an OSM tag, which
 * could either be a number, or a number with a unit
 * (e.g. `15 m`).
 *
 * @param {string} tagValue
 * @param {string} defaultUnit
 * @returns {number | undefined} value in metres or `undefined` if the value is invalid
 */
export function parseDistanceWithUnit(tagValue, defaultUnit) {
  if (!tagValue) return undefined; // tag doesn't exist

  // special case when feet and inches are used together.
  const imperialCombo = tagValue.match(/([\d.]+) *('|′|ft|foot|feet) *([\d.]+) *("|″|in|inch|inches)/);
  if (imperialCombo) {
    const feet = +imperialCombo[1];
    const inches = +imperialCombo[3];
    return feet / 3.281 + inches / 39.37;
  }

  // the remaining code parses normal values (number + optional unit)

  const unit = tagValue.match(/[^\d.]+/)?.[0].trim() || defaultUnit;
  const value = parseFloat(tagValue);

  if (Number.isNaN(value)) return undefined; // invalid value


  // convert to metres
  switch (unit) {
    case 'mm': return value / 1e3;
    case 'cm': return value / 1e2;
    case 'metres':
    case 'm': return value;
    case 'hectometres':
    case 'hm': return value * 1e2;
    case 'kilometres':
    case 'km': return value * 1e3;

    case 'statute_miles':
    case 'miles':
    case 'mi': return value * 1609;

    case 'nautical_miles':
    case 'nm': return value * 1852;

    case 'yard':
    case 'yards':
    case 'yd': return value / 1.094;

    case '′':
    case '\'':
    case 'feet':
    case 'foot':
    case 'ft': return value / 3.281;

    case '″':
    case '"':
    case 'inch':
    case 'inches':
    case 'in': return value / 39.37;

    default: return undefined;
  }
}

/**
 * @param {Record<string, string>} tags
 * @returns {number | undefined}
 */
export function getRadiusTag(tags) {
  return (
    // diameter tags
    parseDistanceWithUnit(tags.diameter, 'mm') / 2 ||
    parseDistanceWithUnit(tags.diameter_crown, 'm') / 2 ||
    parseDistanceWithUnit(tags['hole:diameter'], 'm') / 2 ||

    // radius tags
    parseDistanceWithUnit(tags.radius, 'm') ||
    parseDistanceWithUnit(tags.crown_radius, 'm') ||
    parseDistanceWithUnit(tags['seamark:anchor_berth:radius'], tags['seamark:anchor_berth:units'] || 'm') ||

    undefined
  );
}

/**
 * @param {osmNode} node
 * @param {import('d3').GeoProjection} projection
 * @returns {number}
 */
export function getRadiusInPixels(node, projection) {
  const radius = getRadiusTag(node.tags);

  const center = projection(node.loc);
  const pointOnCircumference = projection([
    node.loc[0],
    node.loc[1] + geoMetersToLat(radius)
  ]);

  // The radius is the difference in latitude between
  // the centre and the point on the circumference.
  return center[1] - pointOnCircumference[1];
}
