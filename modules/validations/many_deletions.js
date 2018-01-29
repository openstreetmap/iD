import { t } from '../util/locale';


export function validationManyDeletions() {
    var threshold = 100;

    var validation = function(changes) {
        var warnings = [];
        var nodes=0, ways=0, relations=0;

        changes.deleted.forEach(function(c) {
            if (c.type == 'relation') {relations++}
            if (c.type == 'way') {ways++}
            if (c.type == 'node') {nodes++}
        });
        if (changes.deleted.length > threshold) {
            warnings.push({
                id: 'many_deletions',
                message: t('validations.many_deletions',
                    { n: changes.deleted.length, p: nodes, l: ways, r: relations })
            });
        }

        return warnings;
    };


    return validation;
}
