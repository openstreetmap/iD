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
                var labelTags = _clone(deprecatedTags.old);
                for (var key in labelTags) {
                    if (labelTags[key] === '*') {
                        // show the user the actual tag, like color=red instead of color=*
                        labelTags[key] = entity.tags[key];
                    }
                }
                var tagsLabel = utilTagText({ tags: labelTags });
                var featureLabel = utilDisplayLabel(entity, context);
                var isCombo = Object.keys(deprecatedTags.old).length > 1;
                var messageObj = { feature: featureLabel };
                if (isCombo) {
                    messageObj.tags = tagsLabel;
                } else {
                    messageObj.tag = tagsLabel;
                }
                var tagMessageID = isCombo ? 'combination' : 'single';
                issues.push(new validationIssue({
                    type: type,
                    severity: 'warning',
                    message: t('issues.deprecated_tag.' + tagMessageID + '.message', messageObj),
                    tooltip: t('issues.deprecated_tag.tip'),
                    entities: [entity],
                    hash: tagsLabel,
                    info: {
                        oldTags: deprecatedTags.old,
                        replaceTags: deprecatedTags.replace
                    },
                    fixes: [
                        new validationIssueFix({
                            icon: 'iD-icon-up',
                            title: t('issues.fix.' + (isCombo ? 'upgrade_tag_combo' : 'upgrade_tag') + '.title'),
                            onClick: function() {
                                var entity = this.issue.entities[0];
                                var tags = _clone(entity.tags);
                                var replaceTags = this.issue.info.replaceTags;
                                var oldTags = this.issue.info.oldTags;
                                var fixTextID = Object.keys(oldTags).length > 1 ? 'upgrade_tag_combo' : 'upgrade_tag';
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
                                    t('issues.fix.' + fixTextID + '.annotation')
                                );
                            }
                        }),
                        new validationIssueFix({
                            icon: 'iD-operation-delete',
                            title: t('issues.fix.' + (isCombo ? 'remove_tags' : 'remove_tag') + '.title'),
                            onClick: function() {
                                var entity = this.issue.entities[0];
                                var tags = _clone(entity.tags);
                                var oldTags = this.issue.info.oldTags;
                                for (var key in oldTags) {
                                    delete tags[key];
                                }
                                var fixTextID = Object.keys(oldTags).length > 1 ? 'remove_deprecated_tag_combo' : 'remove_deprecated_tag';
                                context.perform(
                                    actionChangeTags(entity.id, tags),
                                    t('issues.fix.' + fixTextID + '.annotation')
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
