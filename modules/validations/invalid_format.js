import { t } from '../util/locale';
import { utilDisplayLabel } from '../util';
import { validationIssue } from '../core/validation';

export function validationFormatting() {
    var type = 'invalid_format';

    var validation = function(entity, context) {
        var issues = [];

        function isInvalidEmail(email) {
            // Same regex as used by HTML5 "email" inputs
            // Emails in OSM are going to be official so they should be pretty simple
            var valid_email = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
            return !valid_email.test(email);
        }

        function isSchemeMissing(url) {
            var valid_scheme = /^https?:\/\//i;
            return !valid_scheme.test(url);
        }


        if (entity.tags.website) {
            // Multiple websites are possible
            var websites = entity.tags.website.split(';').filter(isSchemeMissing);

            if (websites.length) {
                var multi = (websites.length > 1) ? '_multi' : '';

                issues.push(new validationIssue({
                    type: type,
                    subtype: 'website',
                    severity: 'warning',
                    message: function() {
                        var entity = context.hasEntity(this.entityIds[0]);
                        return entity ? t('issues.invalid_format.website.message' + multi, { feature: utilDisplayLabel(entity, context), site: websites.join(', ') }) : '';
                    },
                    reference: showReferenceWebsite,
                    entityIds: [entity.id],
                    hash: websites.join()
                }));
            }

            function showReferenceWebsite(selection) {
                selection.selectAll('.issue-reference')
                    .data([0])
                    .enter()
                    .append('div')
                    .attr('class', 'issue-reference')
                    .text(t('issues.invalid_format.website.reference'));
            }
        }

        if (entity.tags.email) {
            // Multiple emails are possible
            var emails = entity.tags.email.split(';').filter(isInvalidEmail);

            if (emails.length) {
                var multi = (emails.length > 1) ? '_multi' : '';

                issues.push(new validationIssue({
                    type: type,
                    subtype: 'email',
                    severity: 'warning',
                    message: function() {
                        var entity = context.hasEntity(this.entityIds[0]);
                        return entity ? t('issues.invalid_format.email.message' + multi, { feature: utilDisplayLabel(entity, context), email: emails.join(', ') }) : '';
                    },
                    reference: showReferenceEmail,
                    entityIds: [entity.id],
                    hash: emails.join()
                }));
            }

            function showReferenceEmail(selection) {
                selection.selectAll('.issue-reference')
                    .data([0])
                    .enter()
                    .append('div')
                    .attr('class', 'issue-reference')
                    .text(t('issues.invalid_format.email.reference'));
            }
        }

        return issues;
    };

    validation.type = type;

    return validation;
}