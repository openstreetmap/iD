iD.validate = function(changes, graph) {
    var warnings = [], change;

    // https://github.com/openstreetmap/josm/blob/mirror/src/org/
    // openstreetmap/josm/data/validation/tests/UnclosedWays.java#L80
    function tagSuggestsArea(change) {
        if (_.isEmpty(change.tags)) return false;
        var tags = change.tags;
        var presence = ['landuse', 'amenities', 'tourism', 'shop'];
        for (var i = 0; i < presence.length; i++) {
            if (tags[presence[i]] !== undefined) {
                return presence[i] + '=' + tags[presence[i]];
            }
        }
        if (tags.building && tags.building === 'yes') return 'building=yes';
    }

    if (changes.created.length) {
        for (var i = 0; i < changes.created.length; i++) {
            change = changes.created[i];

            if (change.geometry(graph) === 'point' && _.isEmpty(change.tags)) {
                warnings.push({
                    message: 'Untagged point which is not part of a line or area',
                    entity: change
                });
            }

            if (change.geometry(graph) === 'line' && _.isEmpty(change.tags)) {
                warnings.push({ message: 'Untagged line', entity: change });
            }

            if (change.geometry(graph) === 'area' && _.isEmpty(change.tags)) {
                warnings.push({ message: 'Untagged area', entity: change });
            }

            if (change.geometry(graph) === 'line' && tagSuggestsArea(change)) {
                warnings.push({
                    message: 'The tag ' + tagSuggestsArea(change) + ' suggests line should be area, but it is not and area',
                    entity: change
                });
            }
        }
    }

    return warnings.length ? [warnings] : [];
};
