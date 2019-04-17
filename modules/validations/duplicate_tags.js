import { actionChangeTags } from '../actions/index';
import { t } from '../util/locale';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationDuplicateTags() {
    var type = 'duplicate_tags';
    var tagsToCheck = [
                        ['Name', ['name']],
                        ['Address', ['addr:unit', 'addr:housenumber', 'addr:street']],
                        // Add more tags to check here
                      ];

    var validation = function(entity, context) {

        var issues = [];
        var fixes = [];

        tagsToCheck.forEach(function(tag) {
            var existingTagValues = Object.keys(context.graph().entities)
                                    .filter(function(n) {
                                        return n !== entity.id && context.hasEntity(n);
                                    })
                                    .map(function(n) {
                                        return tag[1].map(function(t) {
                                            return context.hasEntity(n).tags[t];
                                        }).join(',').toLowerCase();
                                    });

            var entityTagValue = tag[1].map(function(t) {
                                    return entity.tags[t];
                                }).join(',');

            if (!entityTagValue.match(/^,*$/) && existingTagValues.indexOf(entityTagValue.toLowerCase()) !== -1) {
                issues.push(new validationIssue({
                            type: type,
                            severity: 'warning',
                            message: t('issues.duplicate_tags.message', {
                                tag_type: tag[0],
                                tag_value: entityTagValue
                            }),
                            tooltip: t('issues.duplicate_tags.tip', {
                                tag_type: tag[0]
                            }),
                            entities: [entity],
                            fixes: fixes
                        }));

                fixes.push(
                    new validationIssueFix({
                        icon: 'iD-operation-delete',
                        title: t('issues.fix.remove_duplicated_tag.title'),
                        onClick: function() {
                            var updatedTags = entity.tags;

                            tag[1].forEach(function(t) {
                                delete updatedTags[t];
                            });
                            context.perform(
                                actionChangeTags(entity.id, updatedTags),
                                t('operations.change_tags.annotation')
                            );
                            
                            context.map().pan([0,0]); //force redraw
                        }
                    })
                );
            }
        });

        return issues;
    };

    validation.type = type;

    return validation;
}
