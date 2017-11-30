import { t } from '../util/locale';


export function validationDisconnectedHighway() {

    function isDisconnectedHighway(entity, graph) {
        if (!entity.tags.highway) return false;
        if (entity.geometry(graph) !== 'line') return false;

        return graph.childNodes(entity)
            .every(function(vertex) {
                var parents = graph.parentWays(vertex);
                if (parents.length === 1) {  // standalone vertex
                    return true;
                } else {                     // shared vertex
                    return !vertex.tags.entrance &&
                        parents.filter(function(parent) {
                            return parent.tags.highway && parent !== entity;
                        }).length === 0;
                }
            });
    }


    var validation = function(changes, graph) {
        var warnings = [];
        for (var i = 0; i < changes.created.length; i++) {
            var entity = changes.created[i];

            if (isDisconnectedHighway(entity, graph)) {
                warnings.push({
                    id: 'disconnected_highway',
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
