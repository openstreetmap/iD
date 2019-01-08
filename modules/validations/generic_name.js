import { t } from '../util/locale';
import { discardNames } from '../../node_modules/name-suggestion-index/config/filters.json';

export function validationGenericName() {

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


    return function validation(changes) {
        var warnings = [];

        for (var i = 0; i < changes.created.length; i++) {
            var change = changes.created[i];
            var generic = isGenericName(change);
            if (generic) {
                warnings.push({
                    id: 'generic_name',
                    message: t('validations.generic_name'),
                    tooltip: t('validations.generic_name_tooltip', { name: generic }),
                    entity: change
                });
            }
        }

        return warnings;
    };
}
