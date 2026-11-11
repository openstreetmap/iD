/**
 * Chaire Mobilité iD fork — extra tag classes for map styling (css/30_highways.css custom section).
 *
 * Listed here so fork-specific OSM keys and access rules stay out of modules/svg/tag_classes.js.
 */

import { appendHighwayValidationTagClasses } from './highway_validation_tag_classes.js';
import { matchAccessCategory } from '../data/custom-tagging/src/presets/highway/access_grid';

/** Extra secondary OSM keys → `tag-{key}` and `tag-{key}-{value}` (do not duplicate upstream secondaries). */
export const customSecondaryTagKeys = [
    'cycleway',
    'stop',
    'entrance',
    'fixme'
];

/**
 * Exact tag matches → one class each (without `tag-` prefix).
 * @type {{ key: string, value: string, class: string }[]}
 */
export const customExactTagClasses = [
    { key: 'placement', value: 'transition', class: 'placement-transition' }
];

/**
 * OSM keys mapped to a CSS class prefix → `tag-{prefix}-{value}`.
 * @type {{ keys: string[], prefix: string }[]}
 */
export const customAccessClassPrefixes = [
    { keys: ['access'], prefix: 'access' },
    { keys: ['foot', 'routing:foot'], prefix: 'foot' },
    { keys: ['motor_vehicle', 'routing:motor_vehicle'], prefix: 'motor_vehicle' },
    { keys: ['bus'], prefix: 'routing:bus' },
    { keys: ['psv'], prefix: 'routing:psv' },
    { keys: ['bicycle'], prefix: 'routing:bicycle' }
];

/** Access values that trigger wider motor-road casing (`tag-custom-access-emphasis`). */
export const customAccessEmphasisValues = ['private', 'customers', 'permissive'];

/** `highway=*` values excluded from motor-road access emphasis (footways, paths, etc.). */
export const customAccessEmphasisExcludeHighways = [
    'footway', 'path', 'cycleway', 'steps'
];

/** Class name added on motor roads when access emphasis applies (without `tag-` prefix). */
export const customAccessEmphasisClass = 'custom-access-emphasis';

/**
 * Prefix of the access category class of highways (`tag-access-category-<id>`), colored in
 * css/30_highways.css; categories are configured in
 * data/custom-tagging/src/presets/highway/access_categories.ts.
 */
export const accessCategoryClassPrefix = 'tag-access-category-';

/** OSM keys checked for flat-count outline classes (`tag-has-flats`, `tag-flats-N`). */
export const customFlatsTagKeys = ['building:flats', 'flats', 'houses'];

/**
 * Flat-count outline classes for buildings and residential landuse (v5 fork).
 * @param {string[]} classes
 * @param {Record<string, string>} t
 */
export function appendBuildingFlatsTagClasses(classes, t) {
    const isBuilding = t.building && t.building !== 'no';
    const isResidentialLanduse = t.landuse === 'residential';
    if (!isBuilding && !isResidentialLanduse) return;

    for (const k of Object.keys(t)) {
        const v = t[k];
        if (customFlatsTagKeys.includes(k)) {
            if (v > 0) {
                classes.push('tag-has-flats');
                classes.push('tag-flats-' + v);
            }
            return;
        }
        if (k === 'office' && v === 'yes') {
            classes.push('tag-building-office-yes');
        }
    }
}

/**
 * Append fork-specific tag classes for custom map styling.
 *
 * @param {string[]} classes
 * @param {Record<string, string>} t entity tags
 */
export function appendCrossingStyleTagClasses(classes, t) {
    const markings = t['crossing:markings'];
    if (markings) {
        classes.push('tag-crossing-markings-' + markings.replace(/:/g, '_'));
    }
    if (t.segregated) {
        classes.push('tag-segregated-' + t.segregated);
    }
    const foot = t.foot || t['routing:foot'];
    if (foot === 'no') {
        classes.push('tag-foot-no');
    }
}

/**
 * Append fork-specific tag classes for custom map styling.
 *
 * @param {string[]} classes
 * @param {Record<string, string>} t entity tags
 */
export function appendCustomTagClasses(classes, t) {
    const emphasisValues = new Set(customAccessEmphasisValues);
    const excludeHighways = new Set(customAccessEmphasisExcludeHighways);
    const highway = t.highway;

    for (const { key, value, class: className } of customExactTagClasses) {
        if (t[key] === value) {
            classes.push('tag-' + className);
        }
    }

    for (const { keys, prefix } of customAccessClassPrefixes) {
        for (const key of keys) {
            const value = t[key];
            if (value && value !== 'no') {
                classes.push('tag-' + prefix + '-' + value);
            }
        }
    }

    const accessCategory = highway ? matchAccessCategory(t) : undefined;
    if (accessCategory) {
        classes.push(accessCategoryClassPrefix + accessCategory.id);
    }

    appendBuildingFlatsTagClasses(classes, t);
    appendCrossingStyleTagClasses(classes, t);
    appendHighwayValidationTagClasses(classes, t);

    if (!highway || excludeHighways.has(highway)) return;

    const access = t.access;
    const motorVehicle = t.motor_vehicle || t['routing:motor_vehicle'];
    const routingMotorVehicle = t['routing:motor_vehicle'];
    const serviceAccess = highway === 'service' && emphasisValues.has(t.service);
    // an access category sets the casing width; other access tags fall back to the emphasis values
    const emphasized = accessCategory
        ? accessCategory.wide
        : emphasisValues.has(access) ||
          emphasisValues.has(motorVehicle) ||
          emphasisValues.has(routingMotorVehicle) ||
          serviceAccess;

    if (emphasized) {
        classes.push('tag-' + customAccessEmphasisClass);
    }
}
