import { validationIssue } from '../core/validation';
import { t } from '../core/localizer';

export function validationCrossingVertexTags() {

    const type = 'crossing_vertex_tags';

    function showReference(selection) {
        selection
            .append('div')
            .attr('class', 'issue-reference')
            .call(t.append('issues.crossing_vertex_tags.reference'));
    }

    const validation = function(entity, graph) {

        if (entity.type !== 'node') return [];
        if (entity.tags.highway !== 'crossing') return [];

        const parentWays = graph.parentWays(entity);
        const issues = [];

        // crossing way types based on iD presets
        const crossingTypes = [
            { highway: 'footway', key: 'footway' },
            { highway: 'path', key: 'path' },
            { highway: 'cycleway', key: 'cycleway' }
        ];

        for (let way of parentWays) {
            for (let crossingType of crossingTypes) {

                // Check if this way matches a valid crossing pattern
                if (way.tags.highway === crossingType.highway &&  way.tags[crossingType.key] === 'crossing') {

                    const nodeCrossing = entity.tags.crossing;
                    const wayCrossing = way.tags.crossing;

                    if (!nodeCrossing || !wayCrossing) break;

                    if (nodeCrossing !== wayCrossing) {
                        issues.push(new validationIssue({
                            type: type,
                            subtype: 'crossing_type_mismatch',
                            severity: 'warning',
                            entityIds: [entity.id, way.id],
                            title: t('issues.crossing_vertex_tags.title'),
                            message: function() {
                                return t.append('issues.crossing_vertex_tags.message.default');
                            },
                            reference: showReference
                        }));
                    }

                    break; // avoid duplicate warnings
                }
            }
        }

        return issues;
    };

    validation.type = type;
    return validation;
}