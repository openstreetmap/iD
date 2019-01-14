import _isEmpty from 'lodash-es/isEmpty';

import { t } from '../util/locale';
import { utilTagText } from '../util/index';
import {
    ValidationIssueType,
    ValidationIssueSeverity,
    validationIssue,
} from './validation_issue';


export function validationDeprecatedTag() {

    var validation = function(changes) {
        var issues = [];
        for (var i = 0; i < changes.created.length; i++) {
            var change = changes.created[i];
            var deprecatedTags = change.deprecatedTags();

            if (!_isEmpty(deprecatedTags)) {
                var tags = utilTagText({ tags: deprecatedTags });
                issues.push(new validationIssue({
                    type: ValidationIssueType.deprecated_tags,
                    severity: ValidationIssueSeverity.warning,
                    message: t('issues.deprecated_tags.message', { tags: tags }),
                    entities: [change],
                }));
            }
        }

        return issues;
    };


    return validation;
}
