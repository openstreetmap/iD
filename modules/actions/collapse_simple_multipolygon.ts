import { actionDeleteRelation } from './delete_relation';
import type { osmRelation, osmWay, WayId } from '../osm';
import type { Action } from '../core/history';
import type { coreGraph } from '../core';

export interface ActionCollapseSimpleMultipolygon extends Action {
    /**
     * The multipolygon that the action turns into a basic area.
     * @returns `undefined` when the way is not closed, is the only member of zero or several
     * multipolygons, or has a tag whose value differs from the multipolygon's
     */
    multipolygon(graph: coreGraph): osmRelation | undefined;
}


/**
 * Turns a multipolygon whose only member is a closed way into a basic area.
 * The way keeps its id and receives the multipolygon tags (without `type`),
 * the relations that contain the multipolygon contain the way instead,
 * and the multipolygon is deleted. The graph is unchanged when
 * `multipolygon(graph)` is `undefined`.
 * @param wayID - the closed way, only member of the multipolygon
 */
export function actionCollapseSimpleMultipolygon(wayID: WayId): ActionCollapseSimpleMultipolygon {

    const action: ActionCollapseSimpleMultipolygon = function(graph) {
        const multipolygon = action.multipolygon(graph);
        if (!multipolygon) return graph;

        let way = graph.entity<osmWay>(wayID).mergeTags(multipolygon.tags);
        graph = graph.replace(way);
        for (const relation of graph.parentRelations(multipolygon)) {
            // transfer membership of collapsed single-member multipolygon
            // onto resulting basic area, #9064
            graph = graph.replace(relation.replaceMember(multipolygon, way));
        }
        graph = actionDeleteRelation(multipolygon.id, true /* allow untagged members */)(graph);

        const tags = { ...way.tags };
        if (way.geometry(graph) !== 'area') {
            // ensure the feature persists as an area
            tags.area = 'yes';
        }
        delete tags.type; // remove type=multipolygon
        way = way.update({ tags: tags });
        return graph.replace(way);
    };


    action.multipolygon = function(graph) {
        const way = graph.entity<osmWay>(wayID);
        if (!way.isClosed()) return undefined;

        const multipolygons = graph.parentMultipolygons(way).filter(multipolygon => {
            // find multipolygons where the way is the only member
            return multipolygon.members.length === 1;
        });

        // skip if this is the single member of multiple multipolygons
        if (multipolygons.length !== 1) return undefined;

        const multipolygon = multipolygons[0];

        for (const key in way.tags) {
            if (multipolygon.tags[key] &&
                // don't collapse if tags cannot be cleanly merged
                multipolygon.tags[key] !== way.tags[key]) return undefined;
        }

        return multipolygon;
    };


    return action;
}
