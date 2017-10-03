import _isEmpty from 'lodash-es/isEmpty';

import { t } from '../util/locale';
import { utilTagText } from '../util/index';


export function validationDeprecatedTag() {

    var validation = function(changes) {
        var warnings = [];
        for (var i = 0; i < changes.created.length; i++) {
            var change = changes.created[i],
                deprecatedTags = change.deprecatedTags();

            if (!_isEmpty(deprecatedTags)) {
                var tags = utilTagText({ tags: deprecatedTags });
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
