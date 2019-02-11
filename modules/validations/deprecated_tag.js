import _clone from 'lodash-es/clone';

import { t } from '../util/locale';
import { actionChangeTags } from '../actions';
import { utilDisplayLabel, utilTagText } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';

export function validationDeprecatedTag() {

    var type = 'deprecated_tag';

    var validation = function(entity, context) {
        var issues = [];
        var deprecatedTagsArray = entity.deprecatedTags();
        if (deprecatedTagsArray.length > 0) {
            for (var deprecatedTagIndex in deprecatedTagsArray) {
                var deprecatedTags = deprecatedTagsArray[deprecatedTagIndex];
                var tagsLabel = utilTagText({ tags: deprecatedTags.old });
                var featureLabel = utilDisplayLabel(entity, context);
                issues.push(new validationIssue({
                    type: type,
                    severity: 'warning',
                    message: t('issues.deprecated_tag.message', { feature: featureLabel, tags: tagsLabel }),
                    tooltip: t('issues.deprecated_tag.tip'),
                    entities: [entity],
                    hash: tagsLabel,
                    info: {
                        oldTags: deprecatedTags.old,
                        replaceTags: deprecatedTags.replace
                    },
                    fixes: [
                        new validationIssueFix({
                            title: t('issues.fix.upgrade_tags.title'),
                            onClick: function() {
                                var entity = this.issue.entities[0];
                                var tags = _clone(entity.tags);
                                var replaceTags = this.issue.info.replaceTags;
                                var oldTags = this.issue.info.oldTags;
                                var transferValue;
                                for (var oldTagKey in oldTags) {
                                    if (oldTags[oldTagKey] === '*') {
                                        transferValue = tags[oldTagKey];
                                    }
                                    delete tags[oldTagKey];
                                }
                                for (var replaceKey in replaceTags) {
                                    var replaceValue = replaceTags[replaceKey];
                                    if (replaceValue === '*') {
                                        if (tags[replaceKey]) {
                                            // any value is okay and there already
                                            // is one, so don't update it
                                            continue;
                                        } else {
                                            // otherwise assume `yes` is okay
                                            tags[replaceKey] = 'yes';
                                        }
                                    } else if (replaceValue === '$1') {
                                        tags[replaceKey] = transferValue;
                                    } else {
                                        tags[replaceKey] = replaceValue;
                                    }
                                }
                                context.perform(
                                    actionChangeTags(entity.id, tags),
                                    t('issues.fix.upgrade_tags.annotation')
                                );
                            }
                        })
                    ]
                }));
            }
        }

        return issues;
    };

    validation.type = type;

    return validation;
}
