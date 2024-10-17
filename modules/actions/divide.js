// @ts-check
import { osmNode } from '../osm/node';
import { osmWay } from '../osm/way';
import { utilArrayUniq } from '../util';
import { geoVecLength } from '../geo';

/** @typedef {[x: number, y: number]} Coord */

/**
 * gets a point that's frac% along a line between (x1, y1) and (x2, y2)
 * @param {Coord} start
 * @param {Coord} end
 * @param {number} frac
 * @returns {Coord}
 */
const k = ([x1, y1], [x2, y2], frac) => [
    x1 + frac * (x2 - x1),
    y1 + frac * (y2 - y1)
];



/**
 * the key is used to avoid duplicating nodes. We round to
 * 8 decimal places to avoid floating point precissions issues.
 * @param {Coord} coord
 */
const coordsToKey = (coord) => coord.map(x => x.toFixed(8)).join(',');


// to make the code more logical
// 0 1  =  A B
// 3 2  =  D C
// rows is down (AD & BC), cols is across (AB & DC)
const [A, B, C, D] = [0, 1, 2, 3];


/**
 * @param {string} wayId
 * @param {ReturnType<import("../geo/raw_mercator").geoRawMercator>} projection
 */
export const actionDivide = (wayId, projection) => {
    /**
     * @param {number} shortLength
     * @param {number} longLength
     */
    const action = (shortLength, longLength) => (graph) => {
        const originalWay = graph.entity(wayId);
        const originalNodes = utilArrayUniq(graph.childNodes(originalWay));
        const points = originalNodes.map(n => projection(n.loc));

        // work out whether rows or cols is the long side
        const avgColLength = (geoVecLength(points[A], points[B]) + geoVecLength(points[C], points[D])) / 2;
        const avgRowLength = (geoVecLength(points[A], points[D]) + geoVecLength(points[B], points[C])) / 2;

        let rows, cols;
        if (avgColLength > avgRowLength) {
            // columns is the long side
            [rows, cols] = [shortLength, longLength];
        } else {
            // rows is the long side
            [cols, rows] = [shortLength, longLength];
        }


        // these are the lists of new points along each side of the original way
        const left = new Array(cols + 1).fill().map((_, i) => k(points[A], points[B], i / cols));
        const right = new Array(cols + 1).fill().map((_, i) => k(points[D], points[C], i / cols));
        const top = new Array(rows + 1).fill().map((_, i) => k(points[A], points[D], i / rows));
        const bottom = new Array(rows + 1).fill().map((_, i) => k(points[B], points[C], i / rows));

        /** @type {Coord[][]} */
        const newWays = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                newWays.push([
                /*W*/ k(top[row], bottom[row], col / cols),
                /*X*/ k(left[col], right[col], (row + 1) / rows),
                /*Z*/ k(top[row + 1], bottom[row + 1], (col + 1) / cols),
                /*Y*/ k(top[row], bottom[row], (col + 1) / cols),
                ]);
            }
        }

        /** @type {{ [key: string]: osmNode }} we keep track of this to re-use nodes */
        const allNewNodes = {};

        // add the original 4 nodes to allNewNodes so that they can be re-used
        for (let i = 0; i < points.length; i++) {
            const key = coordsToKey(points[i]);
            allNewNodes[key] = originalNodes[i];
        }

        for (let i = 0; i < newWays.length; i++) {
            const newWay = newWays[i];
            /** @type {osmNode[]} the nodes in this new way */
            const nodes = [];

            for (const coord of newWay) {
                const key = coordsToKey(coord);
                if (key in allNewNodes) {
                    // re use existing node
                    nodes.push(allNewNodes[key]);
                } else {
                    // create new node
                    const newNode = osmNode({ loc: projection.invert(coord) });
                    graph = graph.replace(newNode);
                    nodes.push(newNode);
                    allNewNodes[key] = newNode;
                }
            }
            nodes.push(nodes[0]); // make it a closed way

            let segOsmWay = osmWay({
                id: i === 0 ? originalWay.id : undefined, // preserve history, re-use the original way for the first segment
                version: i === 0 ? originalWay.version : undefined,
                nodes: nodes.map(n => n.id),
                tags: originalWay.tags
            });

            graph = graph.replace(segOsmWay);
        }

        return graph;
    };

    action.disabled = (graph) => {
        const way = graph.entity(wayId);
        const nodes = utilArrayUniq(graph.childNodes(way));

        if (!graph.entity(wayId).isClosed()) return 'not_closed';
        if (nodes.length > 4) return 'more_than_four_nodes';
        if (nodes.length < 4) return 'less_than_four_nodes';

        return false;
    };

    action.transitionable = true;

    return action;
};
