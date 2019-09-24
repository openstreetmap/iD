import { filters } from 'name-suggestion-index';

import { t, languageName } from '../util/locale';
import { utilPreset } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';
import { actionChangeTags } from '../actions/change_tags';


export function validationGenericName() {
    var type = 'generic_name';

    // known list of generic names (e.g. "bar")
    var discardNamesRegexes = filters.discardNames.map(function(discardName) {
        return new RegExp(discardName, 'i');
    });

    var keysToTestForGenericValues = ['amenity', 'building', 'leisure', 'man_made', 'shop', 'tourism'];

    function isDiscardedSuggestionName(lowercaseName) {
        for (var i = 0; i < discardNamesRegexes.length; i++) {
            if (discardNamesRegexes[i].test(lowercaseName)) {
                return true;
            }
        }
        return false;
    }

    // test if the name is just the key or tag value (e.g. "park")
    function nameMatchesRawTag(lowercaseName, tags) {
        var i, key, val;
        for (i = 0; i < keysToTestForGenericValues.length; i++) {
            key = keysToTestForGenericValues[i];
            val = tags[key];
            if (val) {
                val = val.toLowerCase();
                if (key === lowercaseName ||
                    val === lowercaseName ||
                    key.replace(/\_/g, ' ') === lowercaseName ||
                    val.replace(/\_/g, ' ') === lowercaseName) {
                    return true;
                }
            }
        }
        return false;
    }

    function isGenericName(name, tags) {
        name = name.toLowerCase();
        return nameMatchesRawTag(name, tags) || isDiscardedSuggestionName(name);
    }

    function makeGenericNameIssue(entityId, nameKey, genericName, langCode) {
        return new validationIssue({
            type: type,
            severity: 'warning',
            message: function(context) {
                var entity = context.hasEntity(this.entityIds[0]);
                if (!entity) return '';
                var preset = utilPreset(entity, context);
                var langName = langCode && languageName(langCode);
                return t('issues.generic_name.message' + (langName ? '_language' : ''),
                    { feature: preset.name(), name: genericName, language: langName }
                );
            },
            reference: showReference,
            entityIds: [entityId],
            hash: nameKey + '=' + genericName,
            fixes: [
                new validationIssueFix({
                    icon: 'iD-operation-delete',
                    title: t('issues.fix.remove_generic_name.title'),
                    onClick: function(context) {
                        var entityId = this.issue.entityIds[0];
                        var entity = context.entity(entityId);
                        var tags = Object.assign({}, entity.tags);   // shallow copy
                        delete tags[nameKey];
                        context.perform(
                            actionChangeTags(entityId, tags),
                            t('issues.fix.remove_generic_name.annotation')
                        );
                    }
                })
            ]
        });

        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.generic_name.reference'));
        }
    }


    var validation = function checkGenericName(entity) {
        // a generic name is okay if it's a known brand or entity
        if (entity.hasWikidata()) return [];

        var issues = [];

        for (var key in entity.tags) {
            var m = key.match(/^name(?:(?::)([a-zA-Z_-]+))?$/);
            if (!m) continue;

            var value = entity.tags[key];
            if (isGenericName(value, entity.tags)) {
                var langCode = null;
                if (m.length >=2) langCode = m[1];

                issues.push(makeGenericNameIssue(entity.id, key, value, langCode));
            }
        }

        return issues;
    };

    validation.type = type;

    return validation;
}
