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
                var splitVertices = [...Array(numberOfParts - 1)].map((_, i) =>
                    entity.nodes[Math.floor(entity.nodes.length * (i + 1) / numberOfParts)]);
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
