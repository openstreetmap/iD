import { t } from '../util/locale';
import { operationOrthogonalize } from '../operations';
import { geoOrthoCanOrthogonalize } from '../geo';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationUnsquareWay() {
    var type = 'unsquare_way';

    var validation = function checkMissingRole(entity, context) {

        if (entity.type !== 'way' || entity.geometry(context.graph()) !== 'area') return [];

        if (!entity.tags.building || entity.tags.building === 'no') return [];

        var isClosed = entity.isClosed();
        var nodes = context.childNodes(entity).slice();  // shallow copy
        if (isClosed) nodes.pop();

        var locs = nodes.map(function(node) {
            return context.projection(node.loc);
        });

        // use loose constraints compared to actionOrthogonalize
        if (!geoOrthoCanOrthogonalize(locs, isClosed, 0.015, 7, true)) return [];

        return new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.unsquare_way.message', {
                feature: utilDisplayLabel(entity, context)
            }),
            reference: showReference,
            entities: [entity],
            fixes: [
                new validationIssueFix({
                    icon: 'iD-operation-orthogonalize',
                    title: t('issues.fix.square_feature.title'),
                    onClick: function() {
                        var id = this.issue.entities[0].id;
                        var operation = operationOrthogonalize([id], context);
                        if (!operation.disabled()) {
                            operation();
                        }
                    }
                })
            ]
        });

        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.unsquare_way.buildings.reference'));
        }
    };

    validation.type = type;

    return validation;
}
