import _clone from 'lodash-es/clone';
import { t } from '../util/locale';
import {
    utilPreset
} from '../util';
import {
    validationIssue,
    validationIssueFix
} from '../core/validator';
import {
    actionChangeTags
} from '../actions';
import { discardNames } from '../../node_modules/name-suggestion-index/config/filters.json';


export function validationGenericName(context) {

    function isGenericName(entity) {
        var name = entity.tags.name;
        if (!name) return false;

        var i, re;

        // test if the name is just the tag value (e.g. "park")
        var keys = ['amenity', 'leisure', 'shop', 'man_made', 'tourism'];
        for (i = 0; i < keys.length; i++) {
            var val = entity.tags[keys[i]];
            if (val && val.replace(/\_/g, ' ').toLowerCase() === name.toLowerCase()) {
                return name;
            }
        }

        // test if the name is a generic name (e.g. "pizzaria")
        for (i = 0; i < discardNames.length; i++) {
            re = new RegExp(discardNames[i], 'i');
            if (re.test(name)) {
                return name;
            }
        }

        return false;
    }

    var type = 'generic_name';

    var validation = function(entity) {
        var issues = [];
        var generic = isGenericName(entity);
        if (generic) {
            var preset = utilPreset(entity, context);
            issues.push(new validationIssue({
                type: type,
                severity: 'warning',
                message: t('issues.generic_name.message', {feature: preset.name(), name: generic}),
                tooltip: t('issues.generic_name.tip'),
                entities: [entity],
                fixes: [
                    new validationIssueFix({
                        title: t('issues.fix.remove_generic_name.title'),
                        onClick: function() {
                            var entity = this.issue.entities[0];
                            var tags = _clone(entity.tags);
                            delete tags.name;
                            context.perform(
                                actionChangeTags(entity.id, tags),
                                t('issues.fix.remove_generic_name.undo_redo')
                            );
                        }
                    })
                ]
            }));
        }

        return issues;
    };

    validation.type = type;

    return validation;
}
