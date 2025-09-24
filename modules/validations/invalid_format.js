import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
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

        function showReferenceEmail(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.invalid_format.email.reference'));
        }

        function isValidURL(url) {
            try {
                // First try strict WHATWG parsing
                new URL(url);
                return true;
            } catch {
                // Fallback: accept if it looks like a valid scheme://something, even if semicolons are present
                return /^https?:\/\/\S+$/i.test(url);
            }
        }

        function showReferenceWebsite(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.invalid_format.website.reference'));
        }

        // URL field validation - check multiple possible URL tags (excluding image which allows File: format)
        const urlTags = ['website', 'url', 'website:mobile', 'contact:website', 'contact:url', 'source:website', 'source:url'];

        urlTags.forEach(function(tag) {
            if (entity.tags[tag]) {
                var value = entity.tags[tag].trim();
                // First, try validating the entire value as a single URL
                if (isValidURL(value)) {
                    return; // Valid, skip further checks
                }
                // If not valid, split on semicolons and check each part
                var urls = value
                    .split(';')
                    .map(function(s) { return s.trim(); })
                    .filter(function(x) { return !isValidURL(x); });

                if (urls.length) {
                    issues.push(new validationIssue({
                        type: type,
                        subtype: 'website',
                        severity: 'warning',
                        message: function(context) {
                            var entity = context.hasEntity(this.entityIds[0]);
                            return entity ? t.append('issues.invalid_format.website.message' + this.data,
                                { feature: utilDisplayLabel(entity, context.graph()), site: urls.join(', ') }) : '';
                        },
                        reference: showReferenceWebsite,
                        entityIds: [entity.id],
                        hash: tag + '=' + urls.join(),
                        data: (urls.length > 1) ? '_multi' : ''
                    }));
                }
            }
        });

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
                        return entity ? t.append('issues.invalid_format.email.message' + this.data,
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
