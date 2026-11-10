import type { Action } from '../core/history';
import { geoMetersToLat, geoMetersToLon } from '../geo/geo';
import type { Vec2 } from '../geo/vector';
import { osmNode, osmWay } from '../osm';

/**
 * Layout of the preset gallery (fork): one north–south segment per tag set,
 * side by side, wrapped in rows, to preview the map style of every way preset.
 */
export const PRESET_GALLERY_LAYOUT = {
    /** [lon, lat] of the first segment's south end: open Atlantic Ocean, where no OSM data
     *  overlaps, on the equator so meters convert to degrees without distortion. */
    origin: [-30, 0] as Vec2,
    segmentLengthMeters: 100,
    spacingMeters: 10,
    segmentsPerRow: 50,
    rowGapMeters: 50
};

/**
 * [lon, lat] of both ends of the segment at `index` in the gallery.
 * @param index - position of the segment, row by row from the origin
 */
export function presetGallerySegment(index: number): [Vec2, Vec2] {
    const { origin, segmentLengthMeters, spacingMeters, segmentsPerRow, rowGapMeters } = PRESET_GALLERY_LAYOUT;
    const column = index % segmentsPerRow;
    const row = Math.floor(index / segmentsPerRow);
    const lon = origin[0] + geoMetersToLon(column * spacingMeters, origin[1]);
    // rows go south so the first presets stay at the top of the screen
    const south = origin[1] - geoMetersToLat(row * (segmentLengthMeters + rowGapMeters));
    return [[lon, south], [lon, south + geoMetersToLat(segmentLengthMeters)]];
}

/**
 * Add one two-node way per tag set, laid out by `presetGallerySegment`.
 * @param tagSets - tags of each way, in display order
 * @returns the action
 */
export function actionAddPresetGallery(tagSets: Record<string, string>[]): Action {
    return (graph) => tagSets.reduce((g, tags, index) => {
        const [southLoc, northLoc] = presetGallerySegment(index);
        const south = new osmNode({ loc: southLoc });
        const north = new osmNode({ loc: northLoc });
        const way = new osmWay({ nodes: [south.id, north.id], tags });
        return g.replace(south).replace(north).replace(way);
    }, graph);
}
