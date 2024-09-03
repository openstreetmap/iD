import { presetManager } from '../presets';
import { utilDisplayName, utilDisplayType } from './util';

/**
 * `utilDisplayLabel` returns a string suitable for display
 *
 * By default returns something like name/ref, fallback to preset type, fallback to OSM type
 *   "Main Street" or "Tertiary Road"
 *
 * If `verbose=true`, include both preset name and feature name.
 *    "Tertiary Road Main Street"
 * @param {osmEntity} entity
 * @param {string | unknown} graphOrGeometry
 * @param {boolean} [verbose]
 * @returns {string}
 */
export function utilDisplayLabel(entity, graphOrGeometry, verbose) {
    var result;
    var displayName = utilDisplayName(entity);
    var preset = typeof graphOrGeometry === 'string' ?
        presetManager.matchTags(entity.tags, graphOrGeometry) :
        presetManager.match(entity, graphOrGeometry);
    var presetName = preset && (preset.suggestion ? preset.subtitle() : preset.name());

    if (verbose) {
        result = [presetName, displayName].filter(Boolean).join(' ');
    } else {
        result = displayName || presetName;
    }

    // Fallback to the OSM type (node/way/relation)
    return result || utilDisplayType(entity.id);
}
