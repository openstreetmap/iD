import { presetManager } from '../presets';
import { localizer } from '../core/localizer';
import { locationManager } from '../core/location_manager';
import { utilDisplayName, utilDisplayType } from './util';

// The label is a pure function of the entity object, the graph (or geometry),
// the current locale, and the preset/location data versions.
//
// iD entities are immutable: any edit produces a new entity object, and tile
// merges replace the merged entities with new objects.  So a label computed
// for a given entity object never changes unless the entity is replaced or
// the graph changes.  Cache the result per entity object so that the many
// callers (validation rules, document titles, paste) compute each label only
// once.  The WeakMap only holds entries while the entity object is alive, so
// memory stays bounded by the number of live entities.
//
// Invalidation contract: the cached graph is compared by identity, but
// tile-merge rebases mutate the graph object in place, so rebases do not
// invalidate entries by identity — only replaced entity objects (merged
// entities are brand-new) and version bumps (locale/preset/location) do.
// A label whose input changed transitively through a merged non-child would
// be served stale; not reachable with the current matching rules.
const _labelCache = new WeakMap();

/**
 * `utilDisplayLabel` returns a string suitable for display
 *
 * By default returns something like name/ref, fallback to preset type, fallback to OSM type
 *   "Main Street" or "Tertiary Road"
 *
 * If `verbose=true`, include both preset name and feature name.
 *    "Tertiary Road Main Street"
 * @param {iD.OsmEntity} entity
 * @param {string | unknown} graphOrGeometry
 * @param {boolean} [verbose]
 * @returns {string}
 */
export function utilDisplayLabel(entity, graphOrGeometry, verbose) {
    var cached = _labelCache.get(entity);
    if (cached &&
        cached.graph === graphOrGeometry &&
        cached.locale === localizer.localeCode() &&
        cached.presetVersion === presetManager.version() &&
        cached.locationVersion === locationManager.version()) {
        return verbose ? cached.verboseLabel : cached.label;
    }

    var displayName = utilDisplayName(entity);
    var preset = typeof graphOrGeometry === 'string' ?
        presetManager.matchTags(entity.tags, graphOrGeometry) :
        presetManager.match(entity, graphOrGeometry);
    var presetName = preset && (preset.suggestion ? preset.subtitle() : preset.name());

    // Fallback to the OSM type (node/way/relation).
    // `utilDisplayType` can throw for an id with an invalid prefix, so only
    // call it when both the display name and preset name are empty
    var label = displayName || presetName || utilDisplayType(entity.id);
    var verboseLabel = [presetName, displayName].filter(Boolean).join(' ') || utilDisplayType(entity.id);

    _labelCache.set(entity, {
        graph: graphOrGeometry,
        locale: localizer.localeCode(),
        presetVersion: presetManager.version(),
        locationVersion: locationManager.version(),
        label: label,
        verboseLabel: verboseLabel
    });

    return verbose ? verboseLabel : label;
}
