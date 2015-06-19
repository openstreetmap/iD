iD.validations.TagSuggestsArea = function() {

    // https://github.com/openstreetmap/josm/blob/mirror/src/org/
    // openstreetmap/josm/data/validation/tests/UnclosedWays.java#L80
    function tagSuggestsArea(tags) {
        if (_.isEmpty(tags)) return false;

        var presence = ['landuse', 'amenities', 'tourism', 'shop'];
        for (var i = 0; i < presence.length; i++) {
            if (tags[presence[i]] !== undefined) {
                return presence[i] + '=' + tags[presence[i]];
            }
        }

        if (tags.building && tags.building === 'yes') return 'building=yes';
    }

    var validation = function(changes, graph) {
        var warnings = [];
        for (var i = 0; i < changes.created.length; i++) {
            var change = changes.created[i],
                geometry = change.geometry(graph),
                suggestion = (geometry === 'line' ? tagSuggestsArea(change.tags) : undefined);

            if (suggestion) {
                warnings.push({
                    id: 'tag_suggests_area',
                    message: t('validations.tag_suggests_area', { tag: suggestion }),
                    entity: change
                });
            }
        }
        return warnings;
    };

    return validation;
};
