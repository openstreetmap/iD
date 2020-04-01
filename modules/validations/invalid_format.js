import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util';
import { validationIssue } from '../core/validation';

export function validationFormatting() {
    var type = 'invalid_format';

    var validation = function(entity) {
        var issues = [];

        function isValidEmail(email) {
            // Emails in OSM are going to be official so they should be pretty simple
            // Using negated lists to better support all possible unicode characters (#6494)
            var valid_email = /^[^\(\)\\,":;<>@\[\]]+@[^\(\)\\,":;<>@\[\]\.]+(?:\.[a-z0-9-]+)*$/i;

            // An empty value is also acceptable
            return (!email || valid_email.test(email));
        }
        /*
        function isSchemePresent(url) {
            var valid_scheme = /^https?:\/\//i;
            return (!url || valid_scheme.test(url));
        }
        */
        function showReferenceEmail(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.invalid_format.email.reference'));
        }
        /*
        function showReferenceWebsite(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.invalid_format.website.reference'));
        }

        if (entity.tags.website) {
            // Multiple websites are possible
            // If ever we support ES6, arrow functions make this nicer
            var websites = entity.tags.website
                .split(';')
                .map(function(s) { return s.trim(); })
                .filter(function(x) { return !isSchemePresent(x); });

            if (websites.length) {
                issues.push(new validationIssue({
                    type: type,
                    subtype: 'website',
                    severity: 'warning',
                    message: function(context) {
                        var entity = context.hasEntity(this.entityIds[0]);
                        return entity ? t('issues.invalid_format.website.message' + this.data,
                            { feature: utilDisplayLabel(entity, context.graph()), site: websites.join(', ') }) : '';
                    },
                    reference: showReferenceWebsite,
                    entityIds: [entity.id],
                    hash: websites.join(),
                    data: (websites.length > 1) ? '_multi' : ''
                }));
            }
        }
        */
        if (entity.tags.email) {
            // Multiple emails are possible
            var emails = entity.tags.email
                .split(';')
                .map(function(s) { return s.trim(); })
                .filter(function(x) { return !isValidEmail(x); });

            if (emails.length) {
                issues.push(new validationIssue({
                    type: type,
                    subtype: 'email',
                    severity: 'warning',
                    message: function(context) {
                        var entity = context.hasEntity(this.entityIds[0]);
                        return entity ? t('issues.invalid_format.email.message' + this.data,
                            { feature: utilDisplayLabel(entity, context.graph()), email: emails.join(', ') }) : '';
                    },
                    reference: showReferenceEmail,
                    entityIds: [entity.id],
                    hash: emails.join(),
                    data: (emails.length > 1) ? '_multi' : ''
                }));
            }
        }

        return issues;
    };

    validation.type = type;

    return validation;
}
