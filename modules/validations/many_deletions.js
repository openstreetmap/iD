import { t } from '../util/locale';
import { validationIssue } from '../core/validator';


export function validationManyDeletions() {
    var totalOtherGeomThreshold = 50;
    var relationThreshold = 10;   // relations are less common so use a lower threshold

    var type = 'many_deletions';


    var validation = function checkManyDeletions(changes, context) {
        var points = 0, lines = 0, areas = 0, relations = 0;
        var base = context.history().base();
        var geometry;

        changes.deleted.forEach(function(entity) {
            if (entity.type === 'node' && entity.geometry(base) === 'point') {
                points++;
            } else if (entity.type === 'way') {
                geometry = entity.geometry(base);
                if (geometry === 'line') {
                    lines++;
                } else if (geometry === 'area') {
                     areas++;
                }
            } else if (entity.type === 'relation') {
                relations++;
            }
        });

        if (points + lines + areas >= totalOtherGeomThreshold || relations >= relationThreshold) {
            var totalFeatures = points + lines + areas + relations;

            var messageType = 'points-lines-areas';
            if (relations > 0) {
                messageType += '-relations';
            }
            return [new validationIssue({
                type: type,
                severity: 'warning',
                message: t(
                    'issues.many_deletions.'+messageType+'.message',
                    { n: totalFeatures, p: points, l: lines, a:areas, r: relations }
                ),
                reference: showReference,
                hash: [points, lines, areas, relations].join()
            })];
        }

        return [];


        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.many_deletions.tip'));
        }
    };


    validation.type = type;
    validation.inputType = 'changes';

    return validation;
}
