import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';
import { actionChangeTags } from '../actions/change_tags';

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

        function isValidURL(url, strict = false) {
            try {
                // First try strict WHATWG parsing
                const link = new URL(url);
                return link.href.includes(url);
            } catch {
                if (strict) return false;
                // Fallback: accept if it looks like a valid scheme://something, even if semicolons are present
                return /^https?:\/\/\S+$/i.test(url);
            }
        }

        function cleanWikimediaCommonsReference(value) {
            if (!value) return null;
            for (const prefix of ['file', 'datei', 'fichier', 'plik']) {
                if (!value.toLowerCase().startsWith(prefix + ':')) continue;
                return 'File' + decodeURIComponent(value.slice(prefix.length));
            }
            if (value.startsWith('Category:')) return decodeURIComponent(value);
            return null;
        }

        function showReferenceWebsite(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.invalid_format.website.reference'));
        }

        const websiteValidationIssueBase = {
            type: type,
            subtype: 'website',
            severity: 'warning',
            message: function(context) {
                var entity = context.hasEntity(this.entityIds[0]);
                return entity ? t.append('issues.invalid_format.website.message' + (this.data?.count > 1 ? '_multi' : ''),
                    { feature: utilDisplayLabel(entity, context.graph()), site: this.data?.value }) : '';
            },
            dynamicFixes: function(context) {
                const wikimedia_commons_reference = cleanWikimediaCommonsReference(this.data?.value);
                const fixes = [{ protocol: 'https', icon: 'temaki-lock' }, { protocol: 'http' }]
                    .filter(fix => isValidURL(fix.protocol + '://' + this.data?.value, true))
                    .map(fix => new validationIssueFix({
                        icon: fix.icon,
                        title: t.append('issues.fix.add_protocol_'+ fix.protocol +'.title'),
                        onClick: function() {
                            const entityID = this.issue.entityIds[0];
                            const entity = context.entity(entityID);
                            if (!entity) return;
                            const key = this.issue.data.key;
                            const tags = Object.assign({}, entity.tags);
                            tags[key] = entity.tags[key]
                                .split(';')
                                .map(s => s.trim())
                                .map(s => isValidURL(s) ? s : fix.protocol + '://' + s)
                                .join(';');

                            context.perform(
                                actionChangeTags(entityID, tags),
                                t('issues.fix.add_protocol_'+ fix.protocol +'.annotation')
                            );
                        }
                    }));
                if (this.data?.key === 'image' && !entity.tags.wikimedia_commons && wikimedia_commons_reference) {
                    fixes.push(new validationIssueFix({
                        icon: 'iD-icon-out-link',
                        title: t.append('issues.fix.move_value_to_wikimedia_commons.title'),
                        onClick: function() {
                            const entityID = this.issue.entityIds[0];
                            const entity = context.entity(entityID);
                            if (!entity) return;
                            const key = this.issue.data.key;
                            const tags = Object.assign({}, entity.tags);
                            tags.wikimedia_commons = wikimedia_commons_reference;
                            delete tags[key];

                            context.perform(
                                actionChangeTags(entityID, tags),
                                t('issues.fix.move_value_to_wikimedia_commons.annotation')
                            );
                        }
                    }));
                }
                return fixes;
            },
            reference: showReferenceWebsite,
            entityIds: [entity.id]
        };

        Object.entries(entity.tags).map(function([key, tag]) {
            if (!/\b(website|url)\b|^image$/i.test(key)) return null;
            if (!tag) return null;
            const value = tag.trim();
            if (!value) return null;
            if (!value.includes(';')) {
                // No semicolon, validate whole value
                if (isValidURL(value)) return null;
                return {
                    ...websiteValidationIssueBase,
                    data: { key, value },
                    hash: key + '=' + value
                };
            }
            const invalidParts = value.split(';').map(s => s.trim()).filter(x => !isValidURL(x));
            if (!invalidParts.length) {
                if (isValidURL(value)) return null;
                // All split parts valid, but whole value still invalid
                return {
                    ...websiteValidationIssueBase,
                    data: { key, value },
                    hash: key + '=' + value
                };
            }
            return {
                ...websiteValidationIssueBase,
                data: { key, value: invalidParts.join(', '), count: invalidParts.length },
                hash: key + '=' + invalidParts.join()
            };
        }).filter(issue => issue !== null).forEach(issueData => issues.push(new validationIssue(issueData)));

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
