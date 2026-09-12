import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue } from '../core/validation';
import type { CreateValidator, Validator } from '../core/validation/models';
import type { osmWay } from '../osm';
import type { Edge } from '../actions/add_midpoint';

interface Data {
    edges: Edge[];
    way1: osmWay;
    way2: osmWay;
}

export const validationOverlappingWays: CreateValidator = () => {
    var type = 'overlapping_ways';

    function considerOverlap(tags: Tags) {
        return tags.highway !== undefined && tags.highway !== 'no';
    }

    const validation: Validator = function checkOverlappingWays(entity, graph) {
        if (entity.type !== 'way') return [];
        if (!considerOverlap(entity.tags)) return [];

        const wayNodes = graph.childNodes(entity);
        if (wayNodes.length < 2) return [];

        const issues: validationIssue<Data>[] = [];
        let prevNode = wayNodes[wayNodes.length - 1];
        let prevParentWays = graph.parentWays(prevNode).filter(w => w.id !== entity.id && considerOverlap(w.tags));
        for (let i = wayNodes.length - 2; i >= 0; i--) {
            const currentNode = wayNodes[i];
            const currentParentWays = graph.parentWays(currentNode).filter(
                w => w.id !== entity.id
                 && considerOverlap(w.tags)
            );
            for (const prevParentWay of prevParentWays) {
                for (const currentParentWay of currentParentWays) {
                    if (prevParentWay.id === currentParentWay.id && prevParentWay.areAdjacent(prevNode.id, currentNode.id)) {
                        issues.push(new validationIssue<Data>({
                            type,
                            severity: 'warning',
                            message: () => t.append('issues.overlapping_ways.message', {
                                feature: utilDisplayLabel(entity, graph, false),
                                feature2: utilDisplayLabel(prevParentWay, graph, false),
                            }),
                            entityIds: [entity.id, prevParentWay.id, prevNode.id, currentNode.id],
                         }));
                    }
                }
            }


            prevNode = currentNode;
            prevParentWays = currentParentWays;
        }

        return issues;
    };

    validation.type = type;

    return validation;
};
