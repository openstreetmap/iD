import _clone from 'lodash-es/clone';
import { t } from '../util/locale';
import { utilPreset } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';
import { actionChangeTags } from '../actions';
import { discardNames } from '../../node_modules/name-suggestion-index/config/filters.json';


export function validationGenericName() {
    var type = 'generic_name';

    // known list of generic names (e.g. "bar")
    var discardNamesRegexes = discardNames.map(function(discardName) {
        return new RegExp(discardName, 'i');
    });

    var keysToTestForGenericValues = ['amenity', 'building', 'leisure', 'man_made', 'shop', 'tourism'];

    function isGenericName(entity) {
        var name = entity.tags.name;
        if (!name) return false;
        name = name.toLowerCase();

        var i, key, val;

        // test if the name is just the key or tag value (e.g. "park")
        for (i = 0; i < keysToTestForGenericValues.length; i++) {
            key = keysToTestForGenericValues[i];
            val = entity.tags[key];
            if (val) {
                val = val.toLowerCase();
                if (key === name ||
                    val === name ||
                    key.replace(/\_/g, ' ') === name ||
                    val.replace(/\_/g, ' ') === name) {
                    return entity.tags.name;
                }
            }
        }

        // test if the name is otherwise generic
        for (i = 0; i < discardNamesRegexes.length; i++) {
            if (discardNamesRegexes[i].test(name)) {
                return entity.tags.name;
            }
        }

        return false;
    }


    var validation = function(entity, context) {
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
                        icon: 'iD-operation-delete',
                        title: t('issues.fix.remove_generic_name.title'),
                        onClick: function() {
                            var entity = this.issue.entities[0];
                            var tags = _clone(entity.tags);
                            delete tags.name;
                            context.perform(
                                actionChangeTags(entity.id, tags),
                                t('issues.fix.remove_generic_name.annotation')
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
