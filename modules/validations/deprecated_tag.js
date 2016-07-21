import { t } from '../util/locale';
import _ from 'lodash';
import { tagText } from '../util/index';
export function DeprecatedTag() {

    var validation = function(changes) {
        var warnings = [];
        for (var i = 0; i < changes.created.length; i++) {
            var change = changes.created[i],
                deprecatedTags = change.deprecatedTags();

            if (!_.isEmpty(deprecatedTags)) {
                var tags = tagText({ tags: deprecatedTags });
                warnings.push({
                    id: 'deprecated_tags',
                    message: t('validations.deprecated_tags', { tags: tags }),
                    entity: change
                });
            }
        }
        return warnings;
    };

    return validation;
}
