import { t } from '../core/localizer';
import { validationIssue, validationIssueFix } from '../core/validation';
import { operationSplit } from '../operations/split';

export function validationOsmApiLimits(context) {
    var type = 'osm_api_limits';

    var validation = function checkOsmApiLimits(entity) {
        var issues = [];
        var osm = context.connection();
        if (!osm) return issues; // cannot check if there is no connection to the osm api, e.g. during unit tests
        var maxWayNodes = osm.maxWayNodes();

        if (entity.type === 'way') {
            if (entity.nodes.length > maxWayNodes) {
                issues.push(new validationIssue({
                    type: type,
                    subtype: 'exceededMaxWayNodes',
                    severity: 'error',
                    message: function() {
                        return t.html('issues.osm_api_limits.max_way_nodes.message');
                    },
                    reference: function(selection) {
                        selection.selectAll('.issue-reference')
                            .data([0])
                            .enter()
                            .append('div')
                            .attr('class', 'issue-reference')
                            .html(t.html('issues.osm_api_limits.max_way_nodes.reference', { maxWayNodes }));
                    },
                    entityIds: [entity.id],
                    dynamicFixes: splitWayIntoSmallChunks
                }));
            }
        }

        return issues;
    };

    function splitWayIntoSmallChunks() {
        var fix = new validationIssueFix({
            icon: 'iD-operation-split',
            title: t.html('issues.fix.split_way.title'),
            entityIds: this.entityIds,
            onClick: function(context) {
                var maxWayNodes = context.connection().maxWayNodes();
                var g = context.graph();

                var entityId = this.entityIds[0];
                var entity = context.graph().entities[entityId];
                var numberOfParts = Math.ceil(entity.nodes.length / maxWayNodes);
                var splitVertices;

                if (numberOfParts === 2) {
                    // simple case: try to split at the an intersection vertex
                    var splitIntersection = entity.nodes
                        .map(nid => g.entity(nid))
                        .filter(n => g.parentWays(n).length > 1)
                        .map(n => n.id)
                        .find(nid => {
                            var splitIndex = entity.nodes.indexOf(nid);
                            return splitIndex < maxWayNodes &&
                                entity.nodes.length - splitIndex < maxWayNodes;
                        });
                    if (splitIntersection !== undefined) {
                        splitVertices = [splitIntersection];
                    }
                }

                if (splitVertices === undefined) {
                    // generial case: either more than one split is needed or no possible
                    // intersection split point was found -> just split at regular intervals
                    splitVertices = [...Array(numberOfParts - 1)].map((_, i) =>
                        entity.nodes[Math.floor(entity.nodes.length * (i + 1) / numberOfParts)]);
                }

                if (entity.isClosed()) {
                    // add extra split for closed ways at start of way
                    splitVertices.push(entity.nodes[0]);
                }

                var operation = operationSplit(context, splitVertices.concat(entityId));
                if (!operation.disabled()) {
                    operation();
                }
            }
        });

        return [fix];
    }


    validation.type = type;

    return validation;
}
