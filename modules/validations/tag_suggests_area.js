import _isEmpty from 'lodash-es/isEmpty';
import { t } from '../util/locale';
import {
    ValidationIssueType,
    ValidationIssueSeverity,
    validationIssue,
} from './validation_issue';


// https://github.com/openstreetmap/josm/blob/mirror/src/org/
// openstreetmap/josm/data/validation/tests/UnclosedWays.java#L80
export function validationTagSuggestsArea(context) {

    function tagSuggestsArea(tags) {
        if (_isEmpty(tags)) return false;

        var presence = ['landuse', 'amenities', 'tourism', 'shop'];
        for (var i = 0; i < presence.length; i++) {
            if (tags[presence[i]] !== undefined) {
                if (presence[i] === 'tourism' && tags[presence[i]] === 'artwork') {
                    continue;   // exception for tourism=artwork - #5206
                } else {
                    return presence[i] + '=' + tags[presence[i]];
                }
            }
        }

        if (tags.building && tags.building === 'yes') return 'building=yes';
    }


    var validation = function(entitiesToCheck, graph) {
        var issues = [];
        for (var i = 0; i < entitiesToCheck.length; i++) {
            var entity = entitiesToCheck[i];
            var geometry = entity.geometry(graph);
            var suggestion = (geometry === 'line' ? tagSuggestsArea(entity.tags) : undefined);

            if (suggestion) {
                issues.push(new validationIssue({
                    type: ValidationIssueType.tag_suggests_area,
                    severity: ValidationIssueSeverity.warning,
                    message: t('issues.tag_suggests_area.message', { tag: suggestion }),
                    tooltip: t('issues.tag_suggests_area.tip'),
                    entities: [entity],
                }));
            }
        }

        return issues;
    };


    return validation;
}
