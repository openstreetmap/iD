import _without from 'lodash-es/without';
import { t } from '../util/locale';


export function validationMissingTag() {

    // Slightly stricter check than Entity#isUsed (#3091)
    function hasTags(entity, graph) {
        return _without(Object.keys(entity.tags), 'area', 'name').length > 0 ||
            graph.parentRelations(entity).length > 0;
    }

    var validation = function(changes, graph) {
        var types = ['point', 'line', 'area', 'relation'],
            warnings = [];

        for (var i = 0; i < changes.created.length; i++) {
            var change = changes.created[i],
                geometry = change.geometry(graph);

            if (types.indexOf(geometry) !== -1 && !hasTags(change, graph)) {
                warnings.push({
                    id: 'missing_tag',
                    message: t('validations.untagged_' + geometry),
                    tooltip: t('validations.untagged_' + geometry + '_tooltip'),
                    entity: change
                });
            }
        }

        return warnings;
    };


    return validation;
}
