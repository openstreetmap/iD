import _clone from 'lodash-es/clone';

import { t } from '../util/locale';
import { actionUpgradeTags, actionChangeTags } from '../actions';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';

export function validationOutdatedTags() {
    var type = 'outdated_tags';


    var validation = function(entity, context) {

        var deprecatedTagsArray = entity.deprecatedTags();

        var preset = context.presets().match(entity, context.graph());
        var missingRecommendedTags = {};
        if (!preset.isFallback() && preset.tags !== preset.addTags) {
            missingRecommendedTags = Object.keys(preset.addTags).reduce(function(obj, key) {
                if (!entity.tags[key]) {
                    obj[key] = preset.addTags[key];
                }
                return obj;
            }, {});
        }

        if (deprecatedTagsArray.length === 0 &&
            Object.keys(missingRecommendedTags).length === 0) return [];

        return [new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.outdated_tags.message', { feature: utilDisplayLabel(entity, context) }),
            tooltip: t('issues.outdated_tags.tip'),
            entities: [entity],
            info: {
                deprecatedTagsArray: deprecatedTagsArray,
                missingRecommendedTags: missingRecommendedTags
            },
            fixes: [
                new validationIssueFix({
                    icon: 'iD-icon-up',
                    title: t('issues.fix.upgrade_tags.title'),
                    onClick: function() {
                        var deprecatedTagsArray = this.issue.info.deprecatedTagsArray;
                        var missingRecommendedTags = this.issue.info.missingRecommendedTags;
                        var entityID = this.issue.entities[0].id;
                        context.perform(
                            function(graph) {
                                deprecatedTagsArray.forEach(function(deprecatedTags) {
                                    graph = actionUpgradeTags(entityID, deprecatedTags.old, deprecatedTags.replace)(graph);
                                });
                                var tags = _clone(graph.entity(entityID).tags);
                                for (var key in missingRecommendedTags) {
                                    tags[key] = missingRecommendedTags[key];
                                }
                                graph = actionChangeTags(entityID, tags)(graph);
                                return graph;
                            },
                            t('issues.fix.upgrade_tags.annotation')
                        );
                    }
                })
            ]
        })];
    };

    validation.type = type;

    return validation;
}
