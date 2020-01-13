import { filters } from 'name-suggestion-index';

import { t, languageName } from '../util/locale';
import { utilPreset } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';
import { actionChangeTags } from '../actions/change_tags';


export function validationSuspiciousName() {
    var type = 'suspicious_name';

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
            subtype: 'generic_name',
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
            dynamicFixes: function() {
                return [
                    new validationIssueFix({
                        icon: 'iD-operation-delete',
                        title: t('issues.fix.remove_the_name.title'),
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
                ];
            }
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

    function makeIncorrectNameIssue(entityId, nameKey, incorrectName, langCode) {
        return new validationIssue({
            type: type,
            subtype: 'not_name',
            severity: 'warning',
            message: function(context) {
                var entity = context.hasEntity(this.entityIds[0]);
                if (!entity) return '';
                var preset = utilPreset(entity, context);
                var langName = langCode && languageName(langCode);
                return t('issues.incorrect_name.message' + (langName ? '_language' : ''),
                    { feature: preset.name(), name: incorrectName, language: langName }
                );
            },
            reference: showReference,
            entityIds: [entityId],
            hash: nameKey + '=' + incorrectName,
            dynamicFixes: function() {
                return [
                    new validationIssueFix({
                        icon: 'iD-operation-delete',
                        title: t('issues.fix.remove_the_name.title'),
                        onClick: function(context) {
                            var entityId = this.issue.entityIds[0];
                            var entity = context.entity(entityId);
                            var tags = Object.assign({}, entity.tags);   // shallow copy
                            delete tags[nameKey];
                            context.perform(
                                actionChangeTags(entityId, tags),
                                t('issues.fix.remove_mistaken_name.annotation')
                            );
                        }
                    })
                ];
            }
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

        var notNames = (entity.tags['not:name'] || '').split(';');

        for (var key in entity.tags) {
            var m = key.match(/^name(?:(?::)([a-zA-Z_-]+))?$/);
            if (!m) continue;

            var langCode = m.length >= 2 ? m[1] : null;

            var value = entity.tags[key];
            if (notNames.length) {
                for (var i in notNames) {
                    var notName = notNames[i];
                    if (notName && value === notName) {
                        issues.push(makeIncorrectNameIssue(entity.id, key, value, langCode));
                        continue;
                    }
                }
            }
            if (isGenericName(value, entity.tags)) {
                issues.push(makeGenericNameIssue(entity.id, key, value, langCode));
            }
        }

        return issues;
    };

    validation.type = type;

    return validation;
}
