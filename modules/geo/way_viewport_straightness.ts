import { geoExtent } from './extent.js';
import { geoLineIntersection, geoPathLength } from './geom.js';
import { geoVecAngle, geoVecLength, type Vec2 } from './vector.js';
import type { Projection } from './raw_mercator.js';
import type { OsmNode } from '../osm/node.js';


/** Minimum visible path length (px) before left/right indicators are meaningful. */
export const WAY_STRAIGHTNESS_MIN_VISIBLE_LENGTH = 40;

/** Max turn between consecutive visible segments (degrees). */
export const WAY_STRAIGHTNESS_MAX_TURN_DEG = 38;

/** Max spread of segment headings across the visible path (degrees). */
export const WAY_STRAIGHTNESS_MAX_SPREAD_DEG = 45;

/** Visible path length divided by chord length; 1 = perfectly straight open span. */
export const WAY_STRAIGHTNESS_MAX_TORTUOSITY = 1.15;

/** Sum of all turns along the visible path (degrees). */
export const WAY_STRAIGHTNESS_MAX_TOTAL_TURN_DEG = 55;


export type WayStraightness = {
    isStraightEnough: boolean;
    visibleLength: number;
    maxTurnDeg: number;
    totalTurnDeg: number;
    spreadDeg: number;
    tortuosity: number;
    visiblePointCount: number;
};


function pointInExtent(p: Vec2, extent: geoExtent) {
    return p[0] >= extent[0][0] && p[0] <= extent[1][0] &&
        p[1] >= extent[0][1] && p[1] <= extent[1][1];
}


function dedupePoints(points: Vec2[], epsilon = 0.01) {
    const out: Vec2[] = [];
    for (const p of points) {
        const last = out[out.length - 1];
        if (!last || geoVecLength(last, p) > epsilon) {
            out.push(p);
        }
    }
    return out;
}


function orderPointsAlongSegment(p0: Vec2, p1: Vec2, points: Vec2[]) {
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    return points.slice().sort((a, b) => {
        const ta = (a[0] - p0[0]) * dx + (a[1] - p0[1]) * dy;
        const tb = (b[0] - p0[0]) * dx + (b[1] - p0[1]) * dy;
        return ta - tb;
    });
}


function segmentIntersectionsWithExtent(p0: Vec2, p1: Vec2, extent: geoExtent) {
    const polygon = extent.polygon();
    const hits: Vec2[] = [];
    for (let i = 0; i < 4; i++) {
        const hit = geoLineIntersection([p0, p1], [polygon[i], polygon[i + 1]]);
        if (hit) hits.push(hit);
    }
    return dedupePoints(hits);
}


/**
 * Points along a segment that lie inside the viewport, in order from p0 toward p1.
 * Includes boundary intersection points when the segment crosses the viewport edge.
 */
function visiblePointsOnSegment(p0: Vec2, p1: Vec2, extent: geoExtent) {
    const inside0 = pointInExtent(p0, extent);
    const inside1 = pointInExtent(p1, extent);
    const hits = segmentIntersectionsWithExtent(p0, p1, extent);

    if (inside0 && inside1) return [p1];
    if (inside0 && !inside1) {
        const ordered = orderPointsAlongSegment(p0, p1, hits);
        return ordered.length ? [ordered[ordered.length - 1]] : [];
    }
    if (!inside0 && inside1) {
        const ordered = orderPointsAlongSegment(p0, p1, hits);
        return ordered.length ? [ordered[0], p1] : [p1];
    }
    if (hits.length >= 2) {
        const ordered = orderPointsAlongSegment(p0, p1, hits);
        return [ordered[0], ordered[ordered.length - 1]];
    }
    return [];
}


/**
 * Builds a polyline of projected points that are currently visible in the viewport.
 * For closed ways, includes the closing segment.
 */
export function geoVisiblePolylineInExtent(points: Vec2[], extent: geoExtent, isClosed: boolean) {
    if (points.length < 2) return [];

    const result: Vec2[] = [];
    const segmentCount = isClosed ? points.length : points.length - 1;

    function append(p: Vec2) {
        const last = result[result.length - 1];
        if (!last || last[0] !== p[0] || last[1] !== p[1]) {
            result.push([p[0], p[1]]);
        }
    }

    for (let i = 0; i < segmentCount; i++) {
        const p0 = points[i];
        const p1 = points[(i + 1) % points.length];
        if (result.length === 0 && pointInExtent(p0, extent)) append(p0);
        for (const p of visiblePointsOnSegment(p0, p1, extent)) append(p);
    }

    return result;
}


function angleDiffRadians(a: number, b: number) {
    let d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
}


/**
 * Smallest arc (radians) that contains all headings on a circle.
 */
function headingSpreadRadians(headings: number[]) {
    if (headings.length < 2) return 0;
    const sorted = headings.slice().sort((a, b) => a - b);
    let maxGap = 0;
    for (let i = 0; i < sorted.length; i++) {
        const next = sorted[(i + 1) % sorted.length];
        const gap = i === sorted.length - 1
            ? sorted[0] + 2 * Math.PI - sorted[i]
            : next - sorted[i];
        maxGap = Math.max(maxGap, gap);
    }
    return 2 * Math.PI - maxGap;
}


/**
 * Measures how straight a polyline is. Higher tortuosity / spread / turn ⇒ less straight.
 */
export function geoPolylineStraightness(points: Vec2[]): WayStraightness {
    const empty: WayStraightness = {
        isStraightEnough: false,
        visibleLength: 0,
        maxTurnDeg: 0,
        totalTurnDeg: 0,
        spreadDeg: 0,
        tortuosity: Infinity,
        visiblePointCount: points?.length || 0
    };

    if (!points || points.length < 2) return empty;

    const visibleLength = geoPathLength(points);
    if (visibleLength < WAY_STRAIGHTNESS_MIN_VISIBLE_LENGTH) {
        return { ...empty, visibleLength, visiblePointCount: points.length };
    }

    const headings: number[] = [];
    let maxTurnDeg = 0;
    let totalTurnDeg = 0;

    for (let i = 0; i < points.length - 1; i++) {
        const heading = geoVecAngle(points[i], points[i + 1]);
        if (headings.length) {
            const turnDeg = Math.abs(angleDiffRadians(heading, headings[headings.length - 1])) * 180 / Math.PI;
            maxTurnDeg = Math.max(maxTurnDeg, turnDeg);
            totalTurnDeg += turnDeg;
        }
        headings.push(heading);
    }

    const spreadDeg = headingSpreadRadians(headings) * 180 / Math.PI;
    const chord = geoVecLength(points[0], points[points.length - 1]);
    const tortuosity = chord > 1 ? visibleLength / chord : Infinity;

    const isStraightEnough =
        maxTurnDeg <= WAY_STRAIGHTNESS_MAX_TURN_DEG &&
        totalTurnDeg <= WAY_STRAIGHTNESS_MAX_TOTAL_TURN_DEG &&
        spreadDeg <= WAY_STRAIGHTNESS_MAX_SPREAD_DEG &&
        tortuosity <= WAY_STRAIGHTNESS_MAX_TORTUOSITY;

    return {
        isStraightEnough,
        visibleLength,
        maxTurnDeg,
        totalTurnDeg,
        spreadDeg,
        tortuosity,
        visiblePointCount: points.length
    };
}


/**
 * Whether left/right indicators are meaningful for the portion of a way currently in view.
 */
export function geoWayStraightnessInViewport(
    projection: Projection,
    nodes: OsmNode[],
    isClosed: boolean
): WayStraightness {
    const points = nodes
        .map(n => projection(n.loc))
        .filter((p): p is Vec2 => !!p);

    const clip = projection.clipExtent?.();
    const extent = clip && geoExtent(clip);
    if (!extent || !isFinite(extent.area()) || extent.area() <= 0) {
        return geoPolylineStraightness(points);
    }

    const visible = geoVisiblePolylineInExtent(points, extent, isClosed);
    return geoPolylineStraightness(visible);
}
