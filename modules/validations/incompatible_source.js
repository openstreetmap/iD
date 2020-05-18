import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationIncompatibleSource() {
    var type = 'incompatible_source';
    var invalidSources = [
        {
            id:'google', regex:'google', exceptRegex: 'books.google|Google Books|drive.google|googledrive|Google Drive'
        }
    ];

    var validation = function checkIncompatibleSource(entity) {

        var entitySources = entity.tags && entity.tags.source && entity.tags.source.split(';');

        if (!entitySources) return [];

        var issues = [];

        invalidSources.forEach(function(invalidSource) {

            var hasInvalidSource = entitySources.some(function(source) {
                if (!source.match(new RegExp(invalidSource.regex, 'i'))) return false;
                if (invalidSource.exceptRegex && source.match(new RegExp(invalidSource.exceptRegex, 'i'))) return false;
                return true;
            });

            if (!hasInvalidSource) return;

            issues.push(new validationIssue({
                type: type,
                severity: 'warning',
                message: function(context) {
                    var entity = context.hasEntity(this.entityIds[0]);
                    return entity ? t('issues.incompatible_source.' + invalidSource.id + '.feature.message', {
                        feature: utilDisplayLabel(entity, context.graph())
                    }) : '';
                },
                reference: getReference(invalidSource.id),
                entityIds: [entity.id],
                dynamicFixes: function() {
                    return [
                        new validationIssueFix({
                            title: t('issues.fix.remove_proprietary_data.title')
                        })
                    ];
                }
            }));
        });

        return issues;


        function getReference(id) {
            return function showReference(selection) {
                selection.selectAll('.issue-reference')
                    .data([0])
                    .enter()
                    .append('div')
                    .attr('class', 'issue-reference')
                    .text(t('issues.incompatible_source.' + id + '.reference'));
            };
        }
    };

    validation.type = type;

    return validation;
}
