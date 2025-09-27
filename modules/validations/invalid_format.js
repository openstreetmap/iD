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
                new URL(url); // eslint-disable-line no-new
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

        // Refactored: Iterate all tags, skip 'image', process tags matching /(website|url)/
        Object.keys(entity.tags).forEach(function(tag) {
            if (tag === 'image') return; // skip image
            if (!/(website|url)/i.test(tag)) return; // only process website/url tags
            var value = entity.tags[tag].trim();
            if (value.includes(';')) {
                // If semicolon present, validate each part
                var parts = value.split(';').map(function(s) { return s.trim(); });
                var invalidParts = parts.filter(function(x) { return !isValidURL(x); });
                if (invalidParts.length) {
                    // Always warn if any split parts are invalid
                    issues.push(new validationIssue({
                        type: type,
                        subtype: 'website',
                        severity: 'warning',
                        message: function(context) {
                            var entity = context.hasEntity(this.entityIds[0]);
                            return entity ? t.append('issues.invalid_format.website.message' + this.data,
                                { feature: utilDisplayLabel(entity, context.graph()), site: invalidParts.join(', ') }) : '';
                        },
                        reference: showReferenceWebsite,
                        entityIds: [entity.id],
                        hash: tag + '=' + invalidParts.join(),
                        data: (invalidParts.length > 1) ? '_multi' : ''
                    }));
                } else if (!isValidURL(value)) {
                    // All split parts valid, but whole value still invalid
                    issues.push(new validationIssue({
                        type: type,
                        subtype: 'website',
                        severity: 'warning',
                        message: function(context) {
                            var entity = context.hasEntity(this.entityIds[0]);
                            return entity ? t.append('issues.invalid_format.website.message',
                                { feature: utilDisplayLabel(entity, context.graph()), site: value }) : '';
                        },
                        reference: showReferenceWebsite,
                        entityIds: [entity.id],
                        hash: tag + '=' + value,
                        data: ''
                    }));
                }
            } else {
                // No semicolon, validate whole value
                if (!isValidURL(value)) {
                    issues.push(new validationIssue({
                        type: type,
                        subtype: 'website',
                        severity: 'warning',
                        message: function(context) {
                            var entity = context.hasEntity(this.entityIds[0]);
                            return entity ? t.append('issues.invalid_format.website.message',
                                { feature: utilDisplayLabel(entity, context.graph()), site: value }) : '';
                        },
                        reference: showReferenceWebsite,
                        entityIds: [entity.id],
                        hash: tag + '=' + value,
                        data: ''
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
