import { t } from '../util/locale';
import { utilDisplayLabel } from '../util';
import { validationIssue } from '../core/validation';

export function validationFormatting() {
    var type = 'invalid_format';

    var validation = function(entity, context) {
        var issues = [];
        if (entity.tags.website) {
            var valid_scheme = /^https?:\/\//i;

            if (!valid_scheme.test(entity.tags.website)) {
                issues.push(new validationIssue({
                    type: type,
                    subtype: 'website',
                    severity: 'warning',
                    message: function() {
                        var entity = context.hasEntity(this.entityIds[0]);
                        return entity ? t('issues.invalid_format.website.message', { feature: utilDisplayLabel(entity, context) }) : '';
                    },
                    reference: showReferenceWebsite,
                    entityIds: [entity.id]
                }));

                function showReferenceWebsite(selection) {
                    selection.selectAll('.issue-reference')
                        .data([0])
                        .enter()
                        .append('div')
                        .attr('class', 'issue-reference')
                        .text(t('issues.invalid_format.website.reference'));
                }
            }
        }

        if (entity.tags.email) {
            // Same regex as used by HTML5 "email" inputs
            // Emails in OSM are going to be official so they should be pretty simple
            var valid_email = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

            if (!valid_email.test(entity.tags.email)) {
                issues.push(new validationIssue({
                    type: type,
                    subtype: 'email',
                    severity: 'warning',
                    message: function() {
                        var entity = context.hasEntity(this.entityIds[0]);
                        return entity ? t('issues.invalid_format.email.message', { feature: utilDisplayLabel(entity, context) }) : '';
                    },
                    reference: showReferenceEmail,
                    entityIds: [entity.id]
                }));

                function showReferenceEmail(selection) {
                    selection.selectAll('.issue-reference')
                        .data([0])
                        .enter()
                        .append('div')
                        .attr('class', 'issue-reference')
                        .text(t('issues.invalid_format.email.reference'));
                }
            }
        }

        return issues;
    };

    validation.type = type;

    return validation;
}