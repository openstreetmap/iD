import { t } from '../util/locale';
import { discardNames } from '../../node_modules/name-suggestion-index/config/filters.json';

export function validationGenericName() {

    function isGenericName(entity) {
        var name = entity.tags.name;
        if (!name) return false;

        if (entity.tags.amenity === name ||
            entity.tags.leisure === name ||
            entity.tags.shop === name ||
            entity.tags.man_made === name ||
            entity.tags.tourism === name) {
            return name;
        }

        for (var i = 0; i < discardNames.length; i++) {
            var re = new RegExp(discardNames[i], 'i');
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
