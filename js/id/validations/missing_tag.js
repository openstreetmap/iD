iD.validations.MissingTag = function() {

    var validation = function(changes, graph) {
        var warnings = [];
        for (var i = 0; i < changes.created.length; i++) {
            var change = changes.created[i],
                geometry = change.geometry(graph);

            if ((geometry === 'point' || geometry === 'line' || geometry === 'area') && !change.isUsed(graph)) {
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
};
