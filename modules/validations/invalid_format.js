import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';
import { actionChangeTags } from '../actions/change_tags';
import { osmUrlKeys } from '../osm/tags';
import { showTagDiffReference } from './outdated_tags';
import { utilTagDiff } from '../util';

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
                return link.protocol.startsWith('http');
            } catch {
                if (strict) return false;
                // Fallback: accept if it looks like a valid scheme://something, even if semicolons are present
                return /^https?:\/\/\S+$/i.test(url);
            }
        }

        function cleanWikimediaCommonsReference(value, allTags) {
            if (!value) return null;
            if (allTags.wikimedia_commons) return null;
            for (const prefix of ['file', 'datei', 'fichier', 'plik']) {
                if (!value.toLowerCase().startsWith(prefix + ':')) continue;
                return 'File' + value.slice(prefix.length);
            }
            if (value.startsWith('Category:')) {
                return value;
            }
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
                const entity = context.hasEntity(this.entityIds[0]);
                return entity ? t.append('issues.invalid_format.website.message' + (this.data?.count > 1 ? '_multi' : ''),
                    { feature: utilDisplayLabel(entity, context.graph()), site: this.data?.value }) : '';
            },
            dynamicFixes: function(context) {
                if (this.data?.count > 1) return [];
                return [{ protocol: 'https', icon: 'temaki-lock' }, { protocol: 'http' }]
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
                            tags[key] = this.issue.data.fix.replace('{protocol}', fix.protocol);

                            context.perform(
                                actionChangeTags(entityID, tags),
                                t('issues.fix.add_protocol_'+ fix.protocol +'.annotation')
                            );
                        }
                    }));
            },
            entityIds: [entity.id]
        };

        function websiteReferenceWithDiff(oldTags, newTags) {
            return selection => showTagDiffReference(
                selection,
                showReferenceWebsite,
                utilTagDiff(oldTags, newTags)
            );
        }

        Object.entries(entity.tags).map(function([key, tag]) {
            if (!osmUrlKeys.has(key)) return null;
            if (!tag) return null;
            const value = tag.trim();
            if (!value) return null;
            if (key === 'image' && cleanWikimediaCommonsReference(value, entity.tags)) return null; // handled separately below
            if (!value.includes(';')) {
                // No semicolon, validate whole value
                if (isValidURL(value)) return null;
                const fix = `{protocol}://${value}`;
                return {
                    ...websiteValidationIssueBase,
                    data: { key, value, fix },
                    hash: key + '=' + value,
                    reference: websiteReferenceWithDiff(entity.tags, {...entity.tags, [key]: fix.replace('{protocol}', 'https') })
                };
            }
            const invalidParts = value.split(';').map(s => s.trim()).filter(x => !isValidURL(x));
            if (!invalidParts.length) {
                if (isValidURL(value)) return null;
                // All split parts valid, but whole value still invalid
                const fix = value
                    .split(';')
                    .map(s => s.trim())
                    .map(s => isValidURL(s) ? s : `{protocol}://${s}`)
                    .join(';');
                return {
                    ...websiteValidationIssueBase,
                    data: { key, value, fix },
                    hash: key + '=' + value,
                    reference: websiteReferenceWithDiff(entity.tags, {...entity.tags, [key]: fix.replace('{protocol}', 'https') })
                };
            }
            return {
                ...websiteValidationIssueBase,
                data: { key, value: invalidParts.join(', '), count: invalidParts.length },
                hash: key + '=' + invalidParts.join(),
                reference: showReferenceWebsite
            };
        }).filter(issue => issue !== null).forEach(issueData => issues.push(new validationIssue(issueData)));

        const wikimediaCommonsValidationIssueBase = {
            type: type,
            subtype: 'wikimedia_commons',
            severity: 'warning',
            message: function(context) {
                const entity = context.hasEntity(this.entityIds[0]);
                return entity ? t.append('issues.invalid_format.wikimedia_commons.message',
                    { feature: utilDisplayLabel(entity, context.graph()), site: this.data?.value }) : '';
            },
            entityIds: [entity.id]
        };

        if (entity.tags.image) {
            const value = entity.tags.image;
            const fix = cleanWikimediaCommonsReference(value, entity.tags);
            if (fix) {
                issues.push(new validationIssue({
                    ...wikimediaCommonsValidationIssueBase,
                    data: { key: 'image', value: value, fix },
                    hash: 'image=' + value,
                    dynamicFixes: function(context) {
                        const wikimedia_commons_reference = this.data?.fix;
                        return [new validationIssueFix({
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
                        })];
                    },
                    reference: selection => showTagDiffReference(
                        selection,
                        t.append('issues.invalid_format.wikimedia_commons.reference.wrong_key'),
                        utilTagDiff(entity.tags, { ...entity.tags, image: undefined, wikimedia_commons: fix })
                    )
                }));
            }
        }

        if (entity.tags.wikimedia_commons) {
            const value = entity.tags.wikimedia_commons;
            if (isValidURL(value, true)) {
                // wikimedia_commons should not contain a valid URL, see
                // https://wiki.openstreetmap.org/w/index.php?title=Key:wikimedia_commons&oldid=2959709#Common_tagging_mistakes
                const regex = /\/wiki\/(File|Category):(.*)/;
                const url = new URL(value);
                const path = url.pathname;
                if (url.host === 'commons.wikimedia.org' && regex.test(path)) {
                    const parts = path.match(regex);
                    const newValue = decodeURIComponent(`${parts[1]}:${parts[2]}`).replace(/_/g, ' ');
                    const previewDiff = utilTagDiff({ wikimedia_commons: value }, { wikimedia_commons: newValue });
                    issues.push(new validationIssue({
                        ...wikimediaCommonsValidationIssueBase,
                        data: { key: 'wikimedia_commons', value },
                        hash: 'wikimedia_commons=' + value,
                        dynamicFixes: function(context) {
                            return [new validationIssueFix({
                                title: t.append('issues.fix.upgrade_tags.title'),
                                onClick: function() {
                                    const entityID = this.issue.entityIds[0];
                                    const entity = context.entity(entityID);
                                    if (!entity) return;
                                    const tags = Object.assign({}, entity.tags);
                                    tags.wikimedia_commons = newValue;

                                    context.perform(
                                        actionChangeTags(entityID, tags),
                                        t('issues.fix.upgrade_tags.annotation')
                                    );
                                }
                            })];
                        },
                        reference: selection => showTagDiffReference(
                            selection,
                            t.append('issues.invalid_format.wikimedia_commons.reference.wrong_value'),
                            previewDiff
                        ),
                    }));
                }
            }
        }

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
