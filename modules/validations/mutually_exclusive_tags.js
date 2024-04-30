import { actionChangeTags } from '../actions/change_tags';
import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';
import { osmMutuallyExclusiveTagPairs } from '../osm/tags';

export function validationMutuallyExclusiveTags(/* context */) {
    const type = 'mutually_exclusive_tags';

    // https://wiki.openstreetmap.org/wiki/Special:WhatLinksHere/Property:P44
    const tagKeyPairs = osmMutuallyExclusiveTagPairs;

    const validation = function checkMutuallyExclusiveTags(entity /*, graph */) {

        let pairsFounds = tagKeyPairs.filter((pair) => {
            return (pair[0] in entity.tags && pair[1] in entity.tags);
        }).filter((pair) => {
            // noname=no is double-negation, thus positive and not conflicting. We'll ignore those
            return !((pair[0].match(/^(addr:)?no[a-z]/) && entity.tags[pair[0]] === 'no') ||
                     (pair[1].match(/^(addr:)?no[a-z]/) && entity.tags[pair[1]] === 'no'));
        });

        // Additional:
        // Check if name and not:name (and similar) are set and both have the same value
        // not:name can actually have multiple values, separate by ;
        // https://taginfo.openstreetmap.org/search?q=not%3A#keys
        Object.keys(entity.tags).forEach((key) => {
            let negative_key = 'not:' + key;
            if (negative_key in entity.tags && entity.tags[negative_key].split(';').includes(entity.tags[key])) {
                pairsFounds.push([negative_key, key, 'same_value']);
            }
            // For name:xx we also compare against the not:name tag
            if (key.match(/^name:[a-z]+/)) {
                negative_key = 'not:name';
                if (negative_key in entity.tags && entity.tags[negative_key].split(';').includes(entity.tags[key])) {
                    pairsFounds.push([negative_key, key, 'same_value']);
                }
            }
        });

        let issues = pairsFounds.map((pair) => {
            const subtype = pair[2] || 'default';
            return new validationIssue({
                type: type,
                subtype: subtype,
                severity: 'warning',
                message: function(context) {
                    let entity = context.hasEntity(this.entityIds[0]);
                    return entity ? t.append(`issues.${type}.${subtype}.message`, {
                        feature: utilDisplayLabel(entity, context.graph()),
                        tag1: pair[0],
                        tag2: pair[1]
                    }) : '';
                },
                reference: (selection) => showReference(selection, pair, subtype),
                entityIds: [entity.id],
                dynamicFixes: () => pair.slice(0,2).map((tagToRemove) => createIssueFix(tagToRemove))
            });
        });

        function createIssueFix(tagToRemove) {
            return new validationIssueFix({
                icon: 'iD-operation-delete',
                title: t.append('issues.fix.remove_named_tag.title', { tag: tagToRemove }),
                onClick: function(context) {
                    const entityId = this.issue.entityIds[0];
                    const entity = context.entity(entityId);
                    let tags = Object.assign({}, entity.tags);   // shallow copy
                    delete tags[tagToRemove];
                    context.perform(
                        actionChangeTags(entityId, tags),
                        t('issues.fix.remove_named_tag.annotation', { tag: tagToRemove })
                    );
                }
            });
        }

        function showReference(selection, pair, subtype) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append(`issues.${type}.${subtype}.reference`, { tag1: pair[0], tag2: pair[1] }));
        }

        return issues;
    };

    validation.type = type;

    return validation;
}