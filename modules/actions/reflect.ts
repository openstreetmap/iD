import type { coreGraph } from '../core';
import type { Action } from '../core/history';
import { geoGetAxis, geoVecInterp, type Vec2 } from '../geo';
import type { Projection } from '../geo/raw_mercator';
import { utilGetAllNodes } from '../util';
import type { EntityId } from '../osm';

export interface ActionReflect extends Action {
    useLongAxis: GetSet<this, boolean>;
    getReflectAxis(graph: coreGraph): [Vec2, Vec2] | undefined;
}

/* Reflect the given area around its axis of symmetry */
export function actionReflect(reflectIds: EntityId[], projection: Projection): ActionReflect {
    var _useLongAxis = true;


    const action: ActionReflect = function(graph, t) {
        if (t === null || t === undefined || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        const [p, q] = getReflectAxis(graph)!;

        // reflect c across pq
        // http://math.stackexchange.com/questions/65503/point-reflection-over-a-line
        var dx = q[0] - p[0];
        var dy = q[1] - p[1];
        var a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
        var b = 2 * dx * dy / (dx * dx + dy * dy);

        const nodes = utilGetAllNodes(reflectIds, graph);
        for (const node of nodes) {
            const c = projection(node.loc);
            const newLoc = projection.invert([
                a * (c[0] - p[0]) + b * (c[1] - p[1]) + p[0],
                b * (c[0] - p[0]) - a * (c[1] - p[1]) + p[1]
            ]);
            graph = graph.replace(
                node.move(geoVecInterp(node.loc, newLoc, t)));
        }

        return graph;
    };


    function useLongAxis(): boolean;
    function useLongAxis(newValue: boolean): ActionReflect;
    function useLongAxis(...args: [] | [boolean]) {
        if (!args.length) return _useLongAxis;
        _useLongAxis = args[0];
        return action;
    };
    action.useLongAxis = useLongAxis;


    function getReflectAxis(graph: coreGraph) {
        const nodes = utilGetAllNodes(reflectIds, graph);
        const points = nodes.map(function(n) { return projection(n.loc); });
        return geoGetAxis(points, _useLongAxis);
    };
    action.getReflectAxis = getReflectAxis;


    action.transitionable = true;


    return action;
}
