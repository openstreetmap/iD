import { t } from '../util/locale';
import { validationIssue } from '../core/validator';


export function validationManyDeletions() {
    var totalOtherGeomThreshold = 50;
    var relationThreshold = 10;   // relations are less common so use a lower threshold

    var type = 'many_deletions';

    var validation = function(changes, context) {
        var issues = [];
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
            issues.push(new validationIssue({
                type: type,
                severity: 'warning',
                message: t(
                    'issues.many_deletions.'+messageType+'.message',
                    { n: totalFeatures, p: points, l: lines, a:areas, r: relations }
                ),
                tooltip: t('issues.many_deletions.tip'),
                hash: [points, lines, areas, relations].join()
            }));
        }

        return issues;
    };

    validation.type = type;
    validation.inputType = 'changes';

    return validation;
}
