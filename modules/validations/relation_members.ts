import { validationIssue, validationIssueFix } from '../core/validation';
import type { osmRelation, RelationMemberWithIndex } from '../osm/relation';
import type { CreateValidator, Validator } from '../core/validation/models';
import type { PresetRelationDefinitions } from '../presets/preset';
import { utilGetRelationSchema, utilRelationAllowsDuplicateMembers } from '../util/relation_schema';
import type { EntityId } from '../osm';
import type { coreGraph } from '../core/graph';
import { presetManager } from '../presets';
import { utilDisplayName, utilDisplayType } from '../util/util';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { t } from '../core';
import type { Replacements } from '../core/localizer';
import { actionDeleteMembers } from '../actions/delete_members';

const type = 'relation_members';

function makeIssue({ issueId, relation, members, messageData, dynamicFixes }: {
    issueId: string;
    relation: osmRelation;
    members?: RelationMemberWithIndex[];
    messageData?: Replacements;
    dynamicFixes: validationIssueFix[];
}) {
    return new validationIssue({
        type,
        subtype: issueId,
        severity: 'suggestion',
        message: () =>
            t.append(`issues.${type}.messages.${issueId}.message`, messageData),
        reference: (selection) => {
            selection
                .selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(
                    t.append(
                        `issues.${type}.messages.${issueId}.reference`,
                        messageData
                    )
                );
        },
        entityIds: [...(members || []).map(m => m.id), relation.id],
        hash: `${issueId}-${relation.id}-${members?.map(m => m.id + m.index).join('-')}`,
        dynamicFixes: () => [...dynamicFixes],
    });
}

function validateDuplicateMembers(relation: osmRelation, schema: PresetRelationDefinitions, graph: coreGraph): validationIssue[] {
    const issues: validationIssue[] = [];

    const membersById: Record<EntityId, RelationMemberWithIndex[]> = {};
    for (const member of relation.indexedMembers()) {
        membersById[member.id] ||= [];
        membersById[member.id].push(member);
    }
    for (const members of Object.values(membersById)) {
        if (members.length < 2) continue;
        // this entity exists multiple times in the relation

        const uniqueRoles = new Set(members.map(m => m.role));
        const memberId = members[0].id;
        const memberEntity = graph.hasEntity(memberId);
        const messageData = {
            memberPreset: memberEntity
                ? presetManager.match(memberEntity, graph).name()
                : utilDisplayType(memberId),
            relationPreset: presetManager.match(relation, graph).name(),
            member: (memberEntity && utilDisplayName(memberEntity, {})),
            relation: utilDisplayLabel(relation, graph),
        };

        if (uniqueRoles.size === 1) {
            // the members have the same role, so it doesn't
            // matter which one we remove.
            const survivor = members[0];
            issues.push(
                makeIssue({
                    issueId: 'duplicate_member',
                    relation,
                    members,
                    messageData,
                    dynamicFixes: [
                        new validationIssueFix({
                            icon: 'iD-operation-delete',
                            title: t.append('issues.fix.remove_from_relation.title'),
                            onClick: (context) => {
                                const indexesToDelete = members.filter(m => m !== survivor).map(m => m.index);
                                context.perform(
                                    actionDeleteMembers(relation.id, indexesToDelete),
                                    t('operations.delete_member.annotation', { n: indexesToDelete.length })
                                );
                            },
                            entityIds: [survivor.id],
                        }),
                    ],
                }),
            );
        } else {
            // the members have different roles, so the user
            // needs to decide which role to remove.
            issues.push(
                makeIssue({
                    issueId: 'duplicate_member',
                    relation,
                    members,
                    messageData,
                    dynamicFixes: [...uniqueRoles].map(role => {
                        const roleLabel = schema[role]?.label || role;

                        const membersToRemove = members.filter(m => m.role === role);

                        return new validationIssueFix({
                            icon: 'iD-operation-delete',
                            title: t.append('issues.fix.remove_from_relation_with_role.title', { role: roleLabel, n: membersToRemove.length }),
                            onClick: (context) => {
                                context.perform(
                                    actionDeleteMembers(relation.id, membersToRemove.map(m => m.index)),
                                    t('operations.delete_member.annotation', { n: membersToRemove.length })
                                );
                            },
                            entityIds: membersToRemove.map(m => m.id),
                        });
                    })
                })
            );
        }
    }

    return issues;
}

function validateAgainstSchema(relation: osmRelation, schema: PresetRelationDefinitions, allowsDuplicates: boolean, graph: coreGraph) {
    const issues: validationIssue[] = [];
    // only part of this validator has been implemented, as a soft-launch.
    // the rest will eventually be added.

    // (1) too_few
    // (2) too_many
    // (3) invalid_geometry
    // (4) invalid_tags
    // (5) wrong_role
    // (6) role_not_allowed

    // (7) duplicate_member
    if (!allowsDuplicates) {
        issues.push(...validateDuplicateMembers(relation, schema, graph));
    }

    return issues;
}

export const validationRelationMembers: CreateValidator = () => {
    const validation: Validator = function validateRelationMembers(entity, graph) {
        const issues: validationIssue[] = [];

        const toCheck = new Set(graph.parentRelations(entity));

        // for relations, also validate themselves
        if (entity.type === 'relation') toCheck.add(entity);

        for (const relation of toCheck) {
            const schema = utilGetRelationSchema(relation, graph);
            if (!Object.keys(schema).length) continue;
            const allowsDuplicates = utilRelationAllowsDuplicateMembers(relation, graph);

            issues.push(...validateAgainstSchema(relation, schema, allowsDuplicates, graph));
        }

        return issues;
    };

    validation.type = type;

    return validation;
};
