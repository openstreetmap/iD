import { filters } from 'name-suggestion-index';

import { t } from '../util/locale';
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

    function isGenericName(entity) {
        var name = entity.tags.name;
        if (!name) return false;
        // a generic name is okay if it's a known brand or entity
        if (entity.hasWikidata()) return false;
        name = name.toLowerCase();

        var i, key, val;

        // test if the name is just the key or tag value (e.g. "park")
        for (i = 0; i < keysToTestForGenericValues.length; i++) {
            key = keysToTestForGenericValues[i];
            val = entity.tags[key];
            if (val) {
                val = val.toLowerCase();
                if (key === name ||
                    val === name ||
                    key.replace(/\_/g, ' ') === name ||
                    val.replace(/\_/g, ' ') === name) {
                    return entity.tags.name;
                }
            }
        }

        // test if the name is otherwise generic
        for (i = 0; i < discardNamesRegexes.length; i++) {
            if (discardNamesRegexes[i].test(name)) {
                return entity.tags.name;
            }
        }

        return false;
    }


    var validation = function checkGenericName(entity) {
        var generic = isGenericName(entity);
        if (!generic) return [];

        return [new validationIssue({
            type: type,
            severity: 'warning',
            message: function(context) {
                var entity = context.hasEntity(this.entityIds[0]);
                if (!entity) return '';
                var preset = utilPreset(entity, context);
                return t('issues.generic_name.message', { feature: preset.name(), name: generic });
            },
            reference: showReference,
            entityIds: [entity.id],
            hash: generic,
            fixes: [
                new validationIssueFix({
                    icon: 'iD-operation-delete',
                    title: t('issues.fix.remove_generic_name.title'),
                    onClick: function(context) {
                        var entityId = this.issue.entityIds[0];
                        var entity = context.entity(entityId);
                        var tags = Object.assign({}, entity.tags);   // shallow copy
                        delete tags.name;
                        context.perform(
                            actionChangeTags(entityId, tags),
                            t('issues.fix.remove_generic_name.annotation')
                        );
                    }
                })
            ]
        })];


        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.generic_name.reference'));
        }
    };

    validation.type = type;

    return validation;
}