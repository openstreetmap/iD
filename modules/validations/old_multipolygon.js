import { t } from '../util/locale';
import { osmIsSimpleMultipolygonOuterMember } from '../osm';


export function validationOldMultipolygon() {

    return function validation(changes, graph) {
        var warnings = [];
        for (var i = 0; i < changes.created.length; i++) {
            var entity = changes.created[i];
            var parent = osmIsSimpleMultipolygonOuterMember(entity, graph);
            if (parent) {
                warnings.push({
                    id: 'old_multipolygon',
                    message: t('validations.old_multipolygon'),
                    tooltip: t('validations.old_multipolygon_tooltip'),
                    entity: parent
                });
            }
        }
        return warnings;
    };
}
