import { t } from '../util/locale';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationIncompatibleSource() {
    var type = 'incompatible_source';

    var invalidSources = [{id:'google', name: 'Google', regex:'google'}];

    var validation = function(entity, context) {
        var issues = [];

        if (entity.tags && entity.tags.source) {
            
            invalidSources.forEach(function(invalidSource) {
                var pattern = new RegExp(invalidSource.regex, 'i');

                if (entity.tags.source.match(pattern)) {
                    issues.push(new validationIssue({
                        type: type,
                        severity: 'warning',
                        message: t('issues.incompatible_source.source.feature.message', {
                            feature: utilDisplayLabel(entity, context),
                            source: invalidSource.name
                        }),
                        tooltip: t('issues.incompatible_source.source.tip', {
                            source: invalidSource.name
                        }),
                        entities: [entity],
                        fixes: [
                            new validationIssueFix({
                                title: t('issues.fix.remove_proprietary_data.title')
                            })
                        ]
                    }));
                }
            });
        }
        return issues;
    };

    validation.type = type;

    return validation;
}
