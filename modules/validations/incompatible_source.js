import { t } from '../util/locale';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationIncompatibleSource() {
    var type = 'incompatible_source';

    var validation = function(entity, context) {

        if (entity.tags && entity.tags.source && entity.tags.source.toLowerCase().match(/google/)) {
            return [new validationIssue({
                type: type,
                severity: 'warning',
                message: t('issues.incompatible_source.google.feature.message', {
                    feature: utilDisplayLabel(entity, context),
                }),
                tooltip: t('issues.incompatible_source.google.tip'),
                entities: [entity],
                fixes: [
                    new validationIssueFix({
                        title: t('issues.fix.remove_proprietary_data.title')
                    })
                ]
            })];
        }
        return [];
    };

    validation.type = type;

    return validation;
}
