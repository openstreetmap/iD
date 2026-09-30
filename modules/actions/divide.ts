import { osmNode } from '../osm/node';
import { osmWay } from '../osm/way';
import { utilArrayUniq } from '../util';
import { geoExtent, geoLineIntersection, geoVecInterp, geoVecLength } from '../geo';
import { pipe, utilArrayUniqBy } from '../util/array';
import type { Vec2 } from '../geo/vector';
import type { WayId } from '../osm';
import type { Projection } from '../geo/raw_mercator';
import type { Action } from '../core/history';
import type { coreGraph } from '../core';


/** the maximum number of sections allowed, limited for performance reasons */
export const DIVIDE_LIMIT = 200;

export function isValidGridSize(short_length: number, long_length: number) {
    return (
        !Number.isNaN(short_length) &&
        !Number.isNaN(long_length) &&
        short_length > 0 &&
        long_length > 0 &&
        (short_length * long_length <= DIVIDE_LIMIT)
    );
}

export function divideRectangle(short_length: number, long_length: number, points: Vec2[]) {
    if (!isValidGridSize(short_length, long_length)) {
        throw new RangeError('Invalid grid size');
    }

    // we want to maintain reference-equality between coordinates in exactly
    // the same location. This simplifies the code later on.
    const _cache: { [key: string]: Vec2 } = {};

    const cached = (point: Vec2) => {
        const key = point.map(digit => digit.toFixed(8)).join(',');
        return (_cache[key] ||= point);
    };

    // add the original input nodes to the cache so they can be reused later
    points.forEach(cached);


    // to make the code more logical
    // 0 1  =  A B
    // 3 2  =  D C
    // rows is down (AD & BC), cols is across (AB & DC)
    // The smaller shape uses WXYZ instead of ABCD (same order)
    const [A, B, C, D] = points;

    // work out whether rows or cols is the long side
    const avgColLength = (geoVecLength(A, B) + geoVecLength(C, D)) / 2;
    const avgRowLength = (geoVecLength(A, D) + geoVecLength(B, C)) / 2;

    const [rows, cols] =
        avgColLength > avgRowLength
            ? [short_length, long_length] // columns is the long side
            : [long_length, short_length]; // rows is the long side

    // these are the lists of new points along each side of the original way
    const top = new Array(cols + 1).fill(0).map((_, i) => geoVecInterp(A, B, i / cols)).map(cached);
    const bottom = new Array(cols + 1).fill(0).map((_, i) => geoVecInterp(D, C, i / cols)).map(cached);
    const left = new Array(rows + 1).fill(0).map((_, i) => geoVecInterp(A, D, i / rows)).map(cached);
    const right = new Array(rows + 1).fill(0).map((_, i) => geoVecInterp(B, C, i / rows)).map(cached);

    const newShapes: Vec2[][] = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            newShapes.push([
                /* W */ geoVecInterp(left[row], right[row], col / cols),
                /* X */ geoVecInterp(top[col], bottom[col], (row + 1) / rows),
                /* Y */ geoVecInterp(left[row + 1], right[row + 1], (col + 1) / cols),
                /* Z */ geoVecInterp(left[row], right[row], (col + 1) / cols),
            ].map(cached));
        }
    }

    // we only need to check the 2 pairs of opposite edges, because
    // abutting straight edges can never be self-intersecting.
    const anySelfIntersections = newShapes.some(([W, X, Y, Z]) => {
        return (
            geoLineIntersection([W, X], [Y, Z]) || // left vs right
            geoLineIntersection([W, Z], [X, Y]) // top vs bottom
        );
    });

    const outerRing = [
        ...top.slice(0, -1),
        ...right.slice(0, -1),
        ...bottom.toReversed().slice(0, -1), // reverse so it's right-to-left
        ...left.toReversed().slice(0, -1) // reverse so it's bottom-to-top
    ];

    return { isValid: !anySelfIntersections, newShapes, outerRing };
}

function getBbox(shapes: Vec2[][]) {
    const extent = geoExtent();
    for (const point of shapes.flat()) {
        extent._extend(geoExtent(point));
    }
    return extent.bbox();
}

/**
 * translate the shape so that it's touching the top and
 * left borders of the canvas.
 */
export const translateToOrigin = (origin: Vec2 = [0, 0]) => (shapes: Vec2[][]): Vec2[][] => {
    const { minX, minY } = getBbox(shapes);
    return shapes.map(shape =>
        shape.map(([x, y]) => [x - minX + origin[0], y - minY + origin[1]]),
    );
};

/**
 * scale the shape so that it's touching the bottom and
 * right borders of the canvas. The origin must be `[0, 0]`
 */
export const scaleToBottomRight = ([containerX, containerY]: Vec2) => (shapes: Vec2[][]): Vec2[][] => {
    const { minX, minY, maxX, maxY } = getBbox(shapes);

    const maxXScale = containerX / (maxX - minX);
    const maxYScale = containerY / (maxY - minY);
    const scale = Math.min(maxXScale, maxYScale);

    return shapes.map(shape =>
        shape.map(([x, y]) => [x * scale, y * scale]),
    );
};

export function renderOnCanvas(short_length: number, long_length: number, original: Vec2[], canvas: HTMLCanvasElement) {
    const scale = (window.devicePixelRatio || 1) + 1;
    const strokeWidth = 5;
    const buffer = strokeWidth;

    const { isValid, newShapes } = divideRectangle(short_length, long_length, original);

    // to avoid the canvas looking blurry, we scale up the <canvas /> size,
    // and then reduce it with css styles so the perceived size is unchanged.
    const originalSize = canvas.getBoundingClientRect();
    canvas.width = originalSize.width * scale;
    canvas.height = originalSize.height * scale;
    canvas.style.width = originalSize.width + 'px';
    canvas.style.height = originalSize.height + 'px';

    const { width, height } = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error();

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = window.getComputedStyle(canvas).color;
    ctx.lineWidth = strokeWidth;

    const transformed = pipe(
        translateToOrigin(),
        scaleToBottomRight([width - 2 * buffer, height - 2 * buffer]),
        translateToOrigin([buffer, buffer])
    )(newShapes);

    for (const shape of transformed) {
        ctx.beginPath();
        for (const [index, [x, y]] of shape.entries()) {
            ctx[index ? 'lineTo' : 'moveTo'](x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    return isValid;
}

type ActionDivide = Action<{ short_length: number, long_length: number; }>;


export const actionDivide = (wayId: WayId, projection: Projection): ActionDivide => {
    const action: ActionDivide = (graph, t, extra) => {
        const { short_length, long_length } = extra!;
        const originalWay = graph.entity(wayId);
        const originalNodes = utilArrayUniq(graph.childNodes(originalWay));
        const points = originalNodes.map(n => projection(n.loc));

        const { newShapes, outerRing } = divideRectangle(short_length, long_length, points);

        /** we keep track of this to re-use nodes */
        const coordToNode = new Map<Vec2, osmNode>();

        // add the original 4 nodes to allNewNodes so that they can be re-used
        for (let i = 0; i < points.length; i++) {
            coordToNode.set(points[i], originalNodes[i]);
        }

        const newWayIds = new Set<WayId>();

        for (let i = 0; i < newShapes.length; i++) {
            const newShape = newShapes[i];
            /** the nodes in this new way */
            const nodes: osmNode[] = [];

            for (const coord of newShape) {
                const existing = coordToNode.get(coord);
                if (existing) {
                    // re use existing node
                    nodes.push(existing);
                } else {
                    // create new node
                    const newNode = new osmNode({ loc: projection.invert(coord) });
                    graph = graph.replace(newNode);
                    coordToNode.set(coord, newNode);
                    nodes.push(newNode);
                }
            }
            nodes.push(nodes[0]); // make it a closed way

            // preserve history, re-use the original way for the first segment
            const segOsmWay = i === 0
                ? originalWay.update({ nodes: nodes.map(n => n.id) })
                : new osmWay({ nodes: nodes.map(n => n.id), tags: originalWay.tags });
            newWayIds.add(segOsmWay.id);

            graph = graph.replace(segOsmWay);
        }

        /** node IDs of the outer ring */
        const outer = outerRing.map(coord => coordToNode.get(coord)!.id);

        // now we need to update any ways that share a common border with the
        // way the area that was just split, to avoid this problem:
        // https://user-images.githubusercontent.com/1927298/180193321-f9769104-8396-4a28-a6a0-8d6952c4a6a4.png
        const neighbours = utilArrayUniqBy(
            originalNodes
                .flatMap(node => graph.parentWays(node))
                .filter(way => !newWayIds.has(way.id)),
            'id',
        );

        // the 4 edges of the original shape
        const edges = originalNodes.map((a, i) => {
            const b = originalNodes[(i + 1) % originalNodes.length];
            return [a.id, b.id];
        });

        for (const original of neighbours) {
            let neighbour = original;

            for (const [a, b] of edges) {
                for (let i = 0; i < neighbour.nodes.length; i++) {
                    const curr = neighbour.nodes[i];
                    const prev = neighbour.nodes[i - 1];
                    const next = neighbour.nodes[i + 1];

                    // replace [a,b] with `edge` and [b,a] with `edge.toReversed()`
                    if (a === curr && (b === next || b === prev)) {
                        const aIndex = outer.indexOf(a);
                        const bIndex = outer.indexOf(b);

                        // if b<a, then we need to wrap around to the start of the array
                        const edge = aIndex < bIndex
                            ? outer.slice(aIndex, bIndex)
                            : [...outer.slice(aIndex), ...outer.slice(0, bIndex)];

                        const newNodes = [...neighbour.nodes];
                        if (b === next) newNodes.splice(i, 1, ...edge);
                        if (b === prev) newNodes.splice(i, 1, ...edge.toReversed());
                        neighbour = neighbour.update({ nodes: newNodes });
                    }
                }
            }

            if (neighbour !== original) {
                graph = graph.replace(neighbour);
            }
        }

        return graph;
    };

    action.disabled = (graph: coreGraph) => {
        const way = graph.entity(wayId);
        const nodes = utilArrayUniq(graph.childNodes(way));

        if (!graph.entity(wayId).isClosed()) return 'not_closed';
        if (nodes.length > 4) return 'more_than_four_nodes';
        if (nodes.length < 4) return 'less_than_four_nodes';

        return false;
    };

    return action;
};
