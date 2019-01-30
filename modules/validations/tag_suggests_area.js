import _isEmpty from 'lodash-es/isEmpty';
import _clone from 'lodash-es/clone';
import { t } from '../util/locale';
import {
    utilTagText
} from '../util';
import {
    ValidationIssueType,
    ValidationIssueSeverity,
    validationIssue,
    validationIssueFix
} from './validation_issue';
import {
    actionChangeTags
} from '../actions';


// https://github.com/openstreetmap/josm/blob/mirror/src/org/
// openstreetmap/josm/data/validation/tests/UnclosedWays.java#L80
export function validationTagSuggestsArea() {

    function tagSuggestsArea(tags) {
        if (_isEmpty(tags)) return false;

        var areaKeys = ['area', 'building', 'landuse', 'shop', 'tourism'];
        for (var i = 0; i < areaKeys.length; i++) {
            var key = areaKeys[i];
            if (tags[key] !== undefined && tags[key] !== 'no') {
                if (key === 'tourism' && tags[key] === 'artwork') {
                    continue;   // exception for tourism=artwork - #5206
                } else {
                    var returnTags = {};
                    returnTags[key] = tags[key];
                    return returnTags;
                }
            }
        }

        return false;
    }


    var validation = function(entity, context) {
        var issues = [];
        var graph = context.graph();
        var geometry = entity.geometry(graph);
        var suggestingTags = (geometry === 'line' ? tagSuggestsArea(entity.tags) : undefined);

        if (suggestingTags) {
            var tagText = utilTagText({ tags: suggestingTags });
            issues.push(new validationIssue({
                type: ValidationIssueType.tag_suggests_area,
                severity: ValidationIssueSeverity.warning,
                message: t('issues.tag_suggests_area.message', { tag: tagText }),
                tooltip: t('issues.tag_suggests_area.tip'),
                entities: [entity],
                fixes: [
                    new validationIssueFix({
                        title: t('issues.fix.remove_tags.title'),
                        onClick: function() {
                            var entity = this.issue.entities[0];
                            var tags = _clone(entity.tags);
                            for (var key in suggestingTags) {
                                delete tags[key];
                            }
                            context.perform(
                                actionChangeTags(entity.id, tags),
                                t('issues.fix.remove_tags.undo_redo')
                            );
                        }
                    })
                ]
            }));
        }

        return issues;
    };

    validation.type = ValidationIssueType.tag_suggests_area;

    return validation;
}
