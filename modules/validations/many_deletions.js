import { t } from '../util/locale';


export function validationManyDeletions() {
    var threshold = 100;

    var validation = function(changes, graph) {
        var warnings = [];
        var nodes=0, ways=0, areas=0, relations=0;

        changes.deleted.forEach(function(c) {
            if (c.type === 'node') {nodes++;}
            else if (c.type === 'way' && c.geometry(graph) === 'line') {ways++;}
            else if (c.type === 'way' && c.geometry(graph) === 'area') {areas++;}
            else if (c.type === 'relation') {relations++;}
        });
        if (changes.deleted.length > threshold) {
            warnings.push({
                id: 'many_deletions',
                message: t('validations.many_deletions',
                    { n: changes.deleted.length, p: nodes, l: ways, a:areas, r: relations })
            });
        }

        return warnings;
    };


    return validation;
}
