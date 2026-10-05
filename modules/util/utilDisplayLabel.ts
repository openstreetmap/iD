import type { Geometry } from '@openstreetmap/id-tagging-schema';
import type { OsmEntity } from '../osm';
import { presetManager } from '../presets';
import { utilDisplayName, utilDisplayType } from './util';
import type { coreGraph } from '../core';

/**
 * `utilDisplayLabel` returns a string suitable for display
 *
 * By default returns something like name/ref, fallback to preset type, fallback to OSM type
 *   "Main Street" or "Tertiary Road"
 *
 * If `verbose=true`, include both preset name and feature name.
 *    "Tertiary Road Main Street"
 */
export function utilDisplayLabel(entity: OsmEntity, graphOrGeometry: Geometry | coreGraph, verbose?: boolean) {
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
