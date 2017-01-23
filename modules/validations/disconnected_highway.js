import { t } from '../util/locale';


export function validationDisconnectedHighway() {


    function isDisconnectedHighway(entity, graph) {
        if (!entity.tags.highway) return false;
        if (entity.geometry(graph) !== 'line') return false;

        return graph.childNodes(entity)
            .every(function(vertex) {
                return graph.parentWays(vertex)
                    .filter(function(parent) {
                        return parent.tags.highway && parent !== entity;
                    })
                    .length === 0;
            });
    }


    var validation = function(changes, graph) {
        var warnings = [];
        for (var i = 0; i < changes.created.length; i++) {
            var entity = changes.created[i];

            if (isDisconnectedHighway(entity, graph)) {
                warnings.push({
                    id: 'missing_tag',
                    message: t('validations.disconnected_highway'),
                    tooltip: t('validations.disconnected_highway_tooltip'),
                    entity: entity
                });
            }
        }

        return warnings;
    };


    return validation;
}
