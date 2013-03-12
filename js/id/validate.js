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

    if (changes.deleted.length > 100) {
        warnings.push({
            message: t('validations.many_deletions', { n: changes.deleted.length })
        });
    }

    for (var i = 0; i < changes.created.length; i++) {
        change = changes.created[i];

        if (change.geometry(graph) === 'point' && _.isEmpty(change.tags)) {
            warnings.push({
                message: t('validations.untagged_point'),
                entity: change
            });
        }

        if (change.geometry(graph) === 'line' && _.isEmpty(change.tags)) {
            warnings.push({ message: t('validations.untagged_line'), entity: change });
        }

        var deprecatedTags = change.deprecatedTags();
        if (!_.isEmpty(deprecatedTags)) {
            warnings.push({
                message: t('validations.deprecated_tags', {
                    tags: iD.util.tagText({ tags: deprecatedTags })
                }), entity: change });
        }

        if (change.geometry(graph) === 'area' && _.isEmpty(change.tags)) {
            warnings.push({ message: t('validations.untagged_area'), entity: change });
        }

        if (change.geometry(graph) === 'line' && tagSuggestsArea(change)) {
            warnings.push({
                message: t('validations.tag_suggests_area', {tag: tagSuggestsArea(change)}),
                entity: change
            });
        }
    }

    return warnings.length ? [warnings] : [];
};
