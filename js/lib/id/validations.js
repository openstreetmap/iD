(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.iD = global.iD || {}, global.iD.validations = global.iD.validations || {})));
}(this, function (exports) { 'use strict';

    function DeprecatedTag() {

        var validation = function(changes) {
            var warnings = [];
            for (var i = 0; i < changes.created.length; i++) {
                var change = changes.created[i],
                    deprecatedTags = change.deprecatedTags();

                if (!_.isEmpty(deprecatedTags)) {
                    var tags = iD.util.tagText({ tags: deprecatedTags });
                    warnings.push({
                        id: 'deprecated_tags',
                        message: t('validations.deprecated_tags', { tags: tags }),
                        entity: change
                    });
                }
            }
            return warnings;
        };

        return validation;
    }

    function ManyDeletions() {
        var threshold = 100;

        var validation = function(changes) {
            var warnings = [];
            if (changes.deleted.length > threshold) {
                warnings.push({
                    id: 'many_deletions',
                    message: t('validations.many_deletions', { n: changes.deleted.length })
                });
            }
            return warnings;
        };

        return validation;
    }

    function MissingTag() {

        // Slightly stricter check than Entity#isUsed (#3091)
        function hasTags(entity, graph) {
            return _.without(Object.keys(entity.tags), 'area', 'name').length > 0 ||
                graph.parentRelations(entity).length > 0;
        }

        var validation = function(changes, graph) {
            var warnings = [];
            for (var i = 0; i < changes.created.length; i++) {
                var change = changes.created[i],
                    geometry = change.geometry(graph);

                if ((geometry === 'point' || geometry === 'line' || geometry === 'area') && !hasTags(change, graph)) {
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

    function TagSuggestsArea() {

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
    }

    exports.DeprecatedTag = DeprecatedTag;
    exports.ManyDeletions = ManyDeletions;
    exports.MissingTag = MissingTag;
    exports.TagSuggestsArea = TagSuggestsArea;

    Object.defineProperty(exports, '__esModule', { value: true });

}));