import { geoPathHasIntersections, geoPointInPolygon } from '../geo';
import { actionSplit } from './split';
import { actionDeleteWay } from './delete_way';
import { osmTagSuggestingArea, type NodeId, type WayId } from '../osm';
import type { osmWay } from '../osm/way';
import type { coreGraph } from '../core';
import type { Action } from '../core/history';
import { actionChangeTags } from './change_tags';

export interface ActionSlice extends Action {
    getResultingWayIds(): WayId[];
    disabledInternalReason(): string;
    tellApartCutLineAndArea(graph: coreGraph, selectedIDs: WayId[]): [cutline: osmWay, area: osmWay];
    getSplicableAreaBetween(graph: coreGraph, cutline: osmWay): osmWay | undefined;
    isSplicableArea(graph: coreGraph, way: osmWay): boolean;
}

/**
 * Slices an area into two, i.e. divides a closed area way into two such areas along a given removable cut line.
 * This must be supplied either with a cut line and the area or just the cut line with an unambiguous parent area.
 *
 * For testing convenience, accepts an ID to assign to the new way.
 * Normally, this will be undefined and the way will automatically
 * be assigned a new ID.
 */
export function actionSlice(selectedIDs: WayId[], newWayIds?: WayId[]) {
    let _resultingWayIds: [parent: WayId, created: WayId];

    /**
     * If our action is disabled because an underlying different action is disabled,
     * then this is the reason as returned by that action.
     * For UI purposes, this can be appended as the more exact reason for being unable to slice.
     */
    let _disabledInternalReason = '';

    const action: ActionSlice = function(graph) {
        const [parentWayID, cutLineWayID] = getAreaAndCutlineFromSelected();

        const way = graph.entity(parentWayID);

        const originalTags = way.tags;

        // We have to remove tags for now from the area or the split action will create a multipolygon if it wasn't already
        graph = actionChangeTags(way.id, {})(graph);

        const terminalNodes = getTerminalNodes(graph, cutLineWayID);

        const split = actionSplit(terminalNodes, newWayIds);
        split.limitWays([parentWayID]);

        graph = split(graph);

        const [createdWayId] = split.getCreatedWayIDs(); // this should only be 1 way

        graph = followCutLine(parentWayID, cutLineWayID)(graph);
        graph = followCutLine(createdWayId, cutLineWayID)(graph);

        graph = actionDeleteWay(cutLineWayID)(graph);

        graph = reapplyTags(parentWayID, originalTags)(graph);
        graph = reapplyTags(createdWayId, originalTags)(graph);

        _resultingWayIds = [parentWayID, createdWayId];

        return graph;


        /**
         * Used to quickly select the area way and the cut line way from the given/selected entities.
         * This assumes the selection is a valid unambiguous combination.
         */
        function getAreaAndCutlineFromSelected(): [parent: WayId, cutline: WayId] {
            if (selectedIDs.length === 2) {
                // The user has selected both the cutline and an area

                const ways = action.tellApartCutLineAndArea(graph, selectedIDs); // 0 is cut line and 1 is parent area

                return [
                    ways[1].id,
                    ways[0].id
                ];

            } else { // length === 1
                // The user has selected a cutline only and it's in an area we can unambiguously find/assume

                const cutline = graph.entity(selectedIDs[0]);

                return [
                    action.getSplicableAreaBetween(graph, cutline)!.id,
                    selectedIDs[0]
                ];
            }
        }


        /**
         * Closes an open way along the given way,
         * i.e. appends nodes to the newly-split now-open area from the cut line.
         * This will choose the correct direction based on the way.
         */
        function followCutLine(wayId: WayId, followedWayId: WayId): Action {
            // If we have a way 2-3-4-5-6 and we want to follow way 6-8-9-2, we will end up with 2-3-4-5-6-8-9-2
            return (graph) => {
                let way = graph.entity(wayId);
                const followedWay = graph.entity(followedWayId);

                let appendableNodes = followedWay.nodes;
                if (way.nodes[0] === followedWay.nodes[0]) { // i.e. ways have opposite directions
                    appendableNodes = [...appendableNodes].reverse();
                }

                for (const node of appendableNodes) {
                    way = way.addNode(node);
                }

                return graph.replace(way);
            };
        }


        /**
         * Copies previously-recorded tags onto a (new) way.
         */
        function reapplyTags(wayID: WayId, originalTags: Tags): Action {
            return (graph) => {
                if (Object.keys(originalTags).length === 0) return graph; // nothing to copy

                graph = actionChangeTags(wayID, structuredClone(originalTags))(graph);

                return graph;
            };
        }
    };


    /**
     * Returns the first and last node for the given way.
     */
    function getTerminalNodes(graph: coreGraph, cutLineWayID: WayId): [first: NodeId, last: NodeId] {
        const cutLineWay = graph.entity(cutLineWayID);

        const node1 = cutLineWay.nodes[0];
        const node2 = cutLineWay.nodes[cutLineWay.nodes.length - 1];

        return [node1, node2];
    }


    /**
     * Attempts to find an area that is potentially splicable by the given cutline,
     * i.e. connects two non-adjacent nodes of the area.
     * This does not imply that it's allowed to slice this area,
     * this simply locates a potentially-compatable geometry.
     */
    action.getSplicableAreaBetween = (graph, cutline) => {
        const startNode = graph.entity(cutline.nodes[0]);
        const endNode = graph.entity(cutline.nodes[cutline.nodes.length - 1]);

        const startParents = graph.parentWays(startNode);
        if (startParents.length === 1) return undefined; // just the cutline

        const endParents = graph.parentWays(endNode);
        if (endParents.length === 1) return undefined; // just the cutline

        // Find a (single) area that the cutline could unambiguously slice

        let parent: osmWay | undefined;

        for (const startParent of startParents) {
            if (startParent === cutline) continue;

            if (!startParent.isClosed()) continue; // ignoring open ways

            if (!action.isSplicableArea(graph, startParent)) continue; // ignoring closed ways that aren't areas

            if (!endParents.includes(startParent)) continue;

            if (parent) return undefined; // multiple splicable areas - ambiguous

            parent = startParent;
        }

        if (!parent) return undefined;

        // Cut line cannot be an edge of the parent area
        if (cutline.nodes.length === 2 && parent.areAdjacent(startNode.id, endNode.id)) return undefined;

        return parent;
    };

    /**
     * Returns whether the given way can be considered an "area" from user's perspective,
     * i.e. something that should be slicable.
     */
    action.isSplicableArea = (graph, way) => {
        if (way.isArea()) return true;

        const parentRelations = graph.parentRelations(way);

        for (const parentRelation of parentRelations) {
            if (parentRelation.isMultipolygon()) {
                if (parentRelation.memberById(way.id)?.role === 'outer') {
                    if (osmTagSuggestingArea(parentRelation.tags)) {
                        return true;
                    }
                }
            }
        }

        return false;
    };


    /**
     * The way IDs that were created after running the action.
     * This includes the original area.
     */
    action.getResultingWayIds = () => {
        return _resultingWayIds;
    };

    action.disabledInternalReason = () => {
        return _disabledInternalReason;
    };

    /**
     * Decides between the two provided ways which one is the cut line and which the parent area.
     */
    action.tellApartCutLineAndArea = (graph, selectedIDs) => {
        const entity1 = graph.entity(selectedIDs[0]);
        const entity2 = graph.entity(selectedIDs[1]);

        if (entity1.isClosed()) {
            return [entity2, entity1];
        } else {
            return [entity1, entity2];
        }
    };


    action.disabled = (graph) => {
        _disabledInternalReason = '';

        let cutLineWay: osmWay;
        let parentWay: osmWay;

        if (selectedIDs.length === 2) {
            // The user has selected both the cutline and an area

            const ways = action.tellApartCutLineAndArea(graph, selectedIDs); // 0 is cut line and 1 is parent area

            cutLineWay = ways[0];
            parentWay = ways[1];

        } else { // length === 1
            // The user has selected a cutline that's in an area

            cutLineWay = graph.entity(selectedIDs[0]);
            parentWay = action.getSplicableAreaBetween(graph, cutLineWay)!; // expected to exist if operation allowed action with 1 way
        }


        if (cutLineWay.hasInterestingTags()) return 'cutline_tagged';

        if (graph.parentRelations(cutLineWay).length > 0) return 'cutline_in_relation';

        const parentPolygonCoords = parentWay.nodes.map((node) => graph.entity(node).loc);

        for (let i = 1; i < cutLineWay.nodes.length - 1; i++) {
            // Note that we don't care about first and last node - they won't be removed or changed

            const node = graph.entity(cutLineWay.nodes[i]);

            if (node.hasInterestingTags()) return 'cutline_nodes_tagged';

            if (graph.parentRelations(node).length > 0) return 'cutline_nodes_in_relation';

            if (graph.isShared(node)) {
                if (graph.parentWays(node).includes(parentWay)) {
                    return 'cutline_multiple_connection';
                } else {
                    return 'cutline_connected_to_other';
                }
            }

            if (!geoPointInPolygon(node.loc, parentPolygonCoords)) return 'cutline_outside_area';
        }


        const isAreaItself = parentWay.isArea();

        const parentRelations = graph.parentRelations(parentWay);

        if (parentRelations.length > 0) {
            const cutlineCoords = cutLineWay.nodes.map(nodeId => graph.entity(nodeId).loc);

            for (const parentRelation of parentRelations) {
                if (!parentRelation.isMultipolygon()) continue;

                for (const relationMember of parentRelation.members) {
                    if (relationMember.id === parentWay.id) {
                        if (isAreaItself && relationMember.role === 'inner') return 'area_not_outer_relation_member';
                        // Note that this would produce touching inner rings
                        // (https://wiki.openstreetmap.org/wiki/Relation:multipolygon#Touching_inner_rings)

                        if (!isAreaItself && relationMember.role !== 'outer') return 'area_not_outer_relation_member';

                        continue;
                    }

                    const member = graph.hasEntity(relationMember.id);
                    if (!member) return 'area_member_not_downloaded';
                    if (member?.type !== 'way') continue;

                    const memberCoords = member.nodes.map((node) => graph.entity(node).loc);

                    if (geoPathHasIntersections(cutlineCoords, memberCoords)) return 'cutline_intersects_inner_members';
                }
            }
        }

        // At this point, our own checks are good to go,
        // but we rely on split action internally, so check that we can actually split

        const terminalNodes = getTerminalNodes(graph, cutLineWay.id);

        const split = actionSplit(terminalNodes, newWayIds);
        split.limitWays([parentWay.id]);

        const splitDisabled = split.disabled!(graph);

        if (splitDisabled) {
            // We make no assumptions when split is available - if it fails, then so do we.
            // But we can provide the internal reason for the user.
            _disabledInternalReason = 'operations.split.' + splitDisabled;
            return 'cannot_split_area';
        }

        return false;
    };


    return action;
}
