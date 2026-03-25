import * as Wayback from '@esri/wayback-core';
import type { WaybackMetadata } from '@esri/wayback-core';
import RBush from 'rbush';
import type { Dispatch } from 'd3-dispatch';
import { fileFetcher } from '../core/file_fetcher';
import { t, localizer } from '../core/localizer';
import { geoRawMercator, geoZoomToScale } from '../geo';
import { utilTiler } from '../util';
import type { rendererBackgroundSource } from './background_source.js';

export const ESRI_WAYBACK_ID = 'EsriWayback';

type EsriSource = ReturnType<typeof rendererBackgroundSource.Esri>;

export interface WaybackSource extends Omit<EsriSource, 'template'> {
    startDate: string | null;
    endDate: string | null;
    // Override template to be getter-only (no setter)
    template(): string;
    // Additional wayback-specific methods
    initWaybackAsync(): Promise<void>;
    fetchReleaseDatesAsync(): Promise<Set<string>>;
    getAvailableReleaseDates(): string[];
    date(val?: string | null): string | null;
}

interface WaybackItem {
    releaseDateLabel: string;
    itemURL: string;
    releaseNum: number;
    template?: string;
    startDate?: string;
    endDate?: string;
}

interface WaybackConfigItem {
    itemID: string;
    itemTitle: string;
    itemURL: string;
    metadataLayerUrl: string;
    metadataLayerItemID: string;
    layerIdentifier?: string;
}

interface WaybackSourceData {
    wayback: Record<string, WaybackConfigItem>;
}

interface ReleaseDateCacheEntry {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    id?: string;
    releaseDates: Set<string>;
}

/**
 * Create the Esri Wayback source (data is loaded lazily when the user selects wayback).
 * Optionally notifies when init completes so the UI can refresh.
 */
export function createWaybackSource(
    esriWorldImagerySource: EsriSource,
    context: iD.Context,
    dispatch: Dispatch<any>
) {
    const waybackSource = rendererBackgroundSourceEsriWayback(esriWorldImagerySource, context);
    (waybackSource as { _onWaybackReady?: () => void })._onWaybackReady = () => dispatch.call('change');
    return waybackSource;
}

/**
 * Normalize and validate a date string to ISO format (YYYY-MM-DD)
 * Returns null if the input is invalid or empty
 */
function normalizeDateString(s: string | null | undefined) {
    if (!s) return null;
    const d = new Date(s + 'T00:00:00Z');
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
}

export function parseWaybackId(id: string) {
    if (!id || !new RegExp(`^${ESRI_WAYBACK_ID}`, 'i').test(id)) {
        return { isWayback: false, date: null } as const;
    }
    const match = id.match(new RegExp(`^${ESRI_WAYBACK_ID}\\_?(.*)$`, 'i'));
    const dateString = match && match[1] ? match[1] : null;

    if (!dateString) {
        return { isWayback: false, date: null } as const;
    }
    const normalizedDate = normalizeDateString(dateString);
    if (!normalizedDate) {
        return { isWayback: false, date: null } as const;
    }

    return {
        isWayback: true,
        date: normalizedDate
    } as const;
}

/**
 * Create an Esri Wayback background source
 * This wraps the standard Esri World Imagery source with wayback-specific features
 */
export function rendererBackgroundSourceEsriWayback(
    esriSource: EsriSource,
    context: iD.Context
) {
    const wayback = Object.assign({}, esriSource) as WaybackSource;
    wayback.id = ESRI_WAYBACK_ID;
    wayback.startDate = null;
    wayback.endDate = null;

    // Override name/label/description to use wayback-specific localization keys
    wayback.name = function () { return t('background.EsriWayback.name'); };
    wayback.label = function () { return t.append('background.EsriWayback.name'); };
    wayback.description = function () { return t.append('background.EsriWayback.description'); };
    wayback.hasDescription = function () { return true; };

    // ========== Internal State ==========
    let _initPromise: Promise<void> | null = null;
    let _refreshPromise: Promise<Set<string>> | null = null;
    const _waybackData = new Map<string, WaybackItem>();
    const _releaseDateCache = new RBush<ReleaseDateCacheEntry>();
    const _tiler = utilTiler();
    let _oldestDate: string | null = null;
    let _newestDate: string | null = null;
    let _pendingDate: string | null = null; // Store date to apply after initialization

    // ========== Date Management Helpers ==========

    /**
     * Get the current wayback date
     * Returns `_pendingDate` when:
     * - A date was requested from URL (via applyWaybackSource) but wayback data hasn't loaded yet
     * - This allows the date to be preserved during async initialization
     * Returns `_newestDate` as fallback when:
     * - Wayback data is loaded but no explicit date has been set
     * - This ensures wayback always has a valid date after initialization
     * - Matches UI behavior where newest date is auto-selected in dropdown
     * Returns `null` only when:
     * - Wayback data hasn't loaded yet and no pending date
     */
    function getDate() {
        if (_pendingDate && _waybackData.size === 0) {
            return _pendingDate;
        }
        return wayback.startDate || _newestDate || null;
    }

    function setDate(val: string | null | undefined) {
        const requestDate = normalizeDateString(val);
        // Wayback requires a valid date - if none provided, clear everything
        if (!requestDate) {
            wayback.startDate = null;
            wayback.endDate = null;
            _pendingDate = null;
            return;
        }

        // If wayback data isn't loaded yet, store the date to apply later
        const allDates = [..._waybackData.keys()].sort();
        if (allDates.length === 0) {
            _pendingDate = requestDate;
            return;
        }

        // If exact date exists, use it; otherwise find closest available date <= requestDate
        let chooseDate = allDates.includes(requestDate) ? requestDate : allDates[0];
        if (!allDates.includes(requestDate)) {
            // Find closest date <= requestDate (dates are sorted ascending)
            for (const date of allDates.slice(1)) {
                if (requestDate.localeCompare(date) <= 0) break;
                chooseDate = date;
            }
        }

        wayback.startDate = chooseDate;
        wayback.endDate = chooseDate;
        _pendingDate = null;
    }

    // ========== Public API - Core Overrides ==========

    wayback.key = function() {
        const date = getDate();
        return date ? `${ESRI_WAYBACK_ID}_${date}` : ESRI_WAYBACK_ID;
    };

    /**
     * Override template() to return the current wayback date's template
     * This ensures the correct historical imagery URL is used
     */
    const originalTemplate = wayback.template.bind(wayback);
    wayback.template = function() {
        const date = getDate();
        if (date && _waybackData.has(date)) {
            const current = _waybackData.get(date);
            return current?.template || originalTemplate();
        }
        return originalTemplate();
    };

    /**
     * Override url() to use the dynamic template() getter instead of closure _template
     *
     * The base source.url() uses a closure variable _template that doesn't change.
     * We need to call template() dynamically so that when the wayback date changes,
     * the URL reflects the correct historical imagery template.
     *
     * We can't reuse the base url() logic because it relies on the closure _template,
     * so we implement a minimal version that just replaces placeholders in the WMTS URL.
     */
    wayback.url = function(coord: [number, number, number]) {
        const date = getDate();
        if (!date) return '';

        const template = wayback.template();
        return template
            .replace('{x}', String(coord[0]))
            .replace('{y}', String(coord[1]))
            .replace(/\{z(oom)?\}/, String(coord[2]));
    };

    wayback.imageryUsed = function() {
        const date = getDate();
        return date ? `Esri Wayback (${date})` : 'Esri Wayback';
    };

    // ========== Public API - Wayback-Specific Methods ==========

    function getCachedReleaseDates() {
        const center = context.map().center();
        const hit = _releaseDateCache.search({
            minX: center[0],
            minY: center[1],
            maxX: center[0],
            maxY: center[1]
        });
        return hit.length > 0 && hit[0].releaseDates ? hit[0].releaseDates : null;
    }

    /**
     * Get wayback release dates formatted for UI display
     * Reads from cache and formats: includes cached dates + oldest/newest/current dates
     * Returns dates in descending order (newest first) for dropdown rendering
     */
    wayback.getAvailableReleaseDates = function() {
        if (_waybackData.size === 0) {
            return [];
        }

        const results = new Set<string>();

        // Include dates from cache (confirmed available for this location)
        const cachedDates = getCachedReleaseDates();
        if (cachedDates) {
            cachedDates.forEach((d: string) => results.add(d));
        }

        // Always include oldest, newest, and current selection for easy access
        if (_oldestDate) results.add(_oldestDate);
        if (_newestDate) results.add(_newestDate);
        const currentDate = getDate();
        if (currentDate) results.add(currentDate);

        // Only return confirmed dates - don't show all dates as fallback
        return [...results].sort().reverse();
    };

    wayback.date = function(val?: string | null) {
        if (!arguments.length) {
            return getDate();
        }
        setDate(val);
        return getDate();
    };

    // ========== Initialization ==========

    /**
     * Initialize wayback data asynchronously
     * Loads wayback configuration and sets up available dates
     * Can be called multiple times - will return the same promise
     */
    wayback.initWaybackAsync = function() {
        if (_initPromise) return _initPromise;

        return _initPromise = new Promise(resolve => {
            fileFetcher.get('imagery_esri_wayback')
                .then((data: WaybackSourceData) => {
                    Wayback.setCustomWaybackConfig({ waybackConfigData: data.wayback });
                    return Wayback.getWaybackItems();
                })
                .then((items: WaybackItem[]) => {
                    if (!Array.isArray(items) || items.length === 0) {
                        throw new Error('No Wayback data');
                    }

                    _oldestDate = items[items.length - 1].releaseDateLabel;
                    _newestDate = items[0].releaseDateLabel;

                    for (const item of items) {
                        // Convert Esri placeholder tokens to iD format
                        item.template = item.itemURL
                            .replaceAll('{level}', '{zoom}')
                            .replaceAll('{row}', '{y}')
                            .replaceAll('{col}', '{x}');

                        item.startDate = item.releaseDateLabel;
                        item.endDate = item.releaseDateLabel;

                        _waybackData.set(item.releaseDateLabel, item);
                    }

                    // Apply the date from URL (stored in _pendingDate)
                    // If no _pendingDate, default to newest date (matches getDate() fallback behavior)
                    if (_pendingDate) {
                        setDate(_pendingDate);
                        _pendingDate = null;
                    } else if (_newestDate) {
                        wayback.startDate = _newestDate;
                        wayback.endDate = _newestDate;
                    }
                })
                .catch((e: Error) => {
                    console.error(e); // eslint-disable-line no-console
                })
                .finally(() => {
                    (wayback as { _onWaybackReady?: () => void })._onWaybackReady?.();
                    resolve();
                });
        });
    };

    /**
     * Fetch wayback release dates from API and populate the cache
     *
     * This function queries the wayback API to find which wayback release dates have imagery changes
     * at the current map center. The API returns an array of wayback items (releases) that have
     * different imagery at this location compared to other releases.
     *
     * Uses a standard map tile grid tile (zoom level 14) to:
     * - Define a geographic bounding box for caching results in an R-tree spatial index
     * - Provide the zoom level that the API needs to determine query resolution
     * - Cache results by geographic area, not just point, to avoid redundant API calls
     *
     * The API query uses the center point + zoom level. The tile's bounding box is stored
     * in the cache along with the release dates, so nearby locations can reuse cached results.
     *
     * Returns a Promise<Set<string>> of release date labels (e.g., "2024-01-15") that have
     * imagery changes at this location. Results are cached by tile bounding box.
     */
    wayback.fetchReleaseDatesAsync = function() {
        const cachedDates = getCachedReleaseDates();
        if (cachedDates) {
            return Promise.resolve(cachedDates);
        }

        if (_refreshPromise) {
            return _refreshPromise;
        }

        const center = context.map().center();

        // Use zoom level 14 to define a tile grid for caching geographic areas
        // The API uses this zoom level to determine query resolution
        const TILEZOOM = 14;
        const k = geoZoomToScale(TILEZOOM);
        const projection = geoRawMercator()
            .scale(k)
            .translate([0, 0]);

        // Project center to pixel coordinates, then adjust translate so center is at origin
        const centerPx = projection(center);
        projection.translate([-centerPx[0], -centerPx[1]]);

        // Get the map tile covering the center point - used only for bounding box and caching
        const tiler = _tiler.zoomExtent([TILEZOOM, TILEZOOM]) as ReturnType<typeof utilTiler>;
        const tiles = tiler.getTiles(projection);
        const tile = tiles.find(t => t !== false); // Get first valid tile covering the center point

        if (!tile) {
            return Promise.resolve(new Set<string>());
        }

        return _refreshPromise = new Promise(resolve => {
            // Query wayback API: which releases have imagery changes at this location?
            // Returns array of wayback items (releases) with different imagery at this point
            Wayback.getWaybackItemsWithLocalChanges(
                { latitude: center[1], longitude: center[0] },
                TILEZOOM
            )
                .then((data: WaybackItem[]) => {
                    if (!Array.isArray(data) || !data.length) {
                        throw new Error('No locally changed Wayback data');
                    }

                    // Cache results by tile bounding box - store which release dates have changes in this area
                    // We have to work around TS here with `as any`:
                    // tile.extent is geoExtent, which has bbox() method but TS does not know about it.
                    const bbox = (tile.extent as any).bbox();
                    const box: ReleaseDateCacheEntry = {
                        minX: bbox.minX,
                        minY: bbox.minY,
                        maxX: bbox.maxX,
                        maxY: bbox.maxY,
                        id: tile.id,
                        releaseDates: new Set(data.map(d => d.releaseDateLabel))
                    };
                    _releaseDateCache.insert(box);
                    return box.releaseDates;
                })
                .catch((e: Error) => {
                    console.error(e); // eslint-disable-line no-console
                    return new Set<string>();
                })
                .then((val: Set<string>) => {
                    _refreshPromise = null;
                    resolve(val);
                });
        });
    };

    /**
     * Get metadata for a specific location and zoom level
     * Fetches capture date, source, provider, resolution, and accuracy info
     */
    const originalGetMetadata = wayback.getMetadata;
    wayback.getMetadata = function(
        loc: [number, number],
        tileCoord: number[],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        callback: Function
    ): void {
        const date = getDate();
        const current = date ? _waybackData.get(date) : null;
        if (!current) {
            if (originalGetMetadata) {
                return originalGetMetadata(loc, tileCoord, callback);
            }
            return callback(null, {});
        }

        const point = { longitude: loc[0], latitude: loc[1] };
        const zoom = Math.min(tileCoord[2], wayback.zoomExtent[1]);

        Wayback.getMetadata(point, zoom, current.releaseNum)
            .then((data: WaybackMetadata) => {
                const unknown = t('info_panels.background.unknown');
                const formatFloat = localizer.floatFormatter(localizer.localeCode());
                const captureDate = new Date(data.date).toISOString().split('T')[0];
                const metadata = {
                    vintage: {
                        start: captureDate,
                        end: captureDate,
                        range: captureDate
                    },
                    source: String(data.source || '').trim() || unknown,
                    description: String(data.provider || '').trim() || unknown,
                    resolution: isFinite(data.resolution)
                        ? `${formatFloat(data.resolution, 4)} m`
                        : unknown,
                    accuracy: isFinite(data.accuracy)
                        ? `${formatFloat(data.accuracy, 4)} m`
                        : unknown
                };

                callback(null, metadata);
            })
            .catch((e: Error) => {
                console.error(e); // eslint-disable-line no-console
                callback(e, null);
            });
    };

    return wayback;
}
