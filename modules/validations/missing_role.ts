import { actionChangeMember } from '../actions/change_member';
import { actionDeleteMember } from '../actions/delete_member';
import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';
import type { osmRelation, RelationMemberWithIndex } from '../osm/relation';
import type { osmWay, RelationId } from '../osm';
import type { CreateValidator, Validator } from '../core/validation/models';

interface Data { member: RelationMemberWithIndex }

export const validationMissingRole: CreateValidator = () => {
    var type = 'missing_role';

    const validation: Validator = function checkMissingRole(entity, graph) {
        var issues: validationIssue<Data>[] = [];
        if (entity.type === 'way') {
            graph.parentRelations(entity).forEach(function(relation) {
                if (!relation.isMultipolygon()) return;

                var member = relation.memberById(entity.id);
                if (member && isMissingRole(member)) {
                    issues.push(makeIssue(entity, relation, member));
                }
            });
        } else if (entity.type === 'relation' && entity.isMultipolygon()) {
            entity.indexedMembers().forEach(function(member) {
                var way = graph.hasEntity<osmWay>(member.id);
                if (way && isMissingRole(member)) {
                    issues.push(makeIssue(way, entity, member));
                }
            });
        }

        return issues;
    };


    function isMissingRole(member: RelationMemberWithIndex) {
        return !member.role || !member.role.trim().length;
    }


    function makeIssue(way: osmWay, relation: osmRelation, member: RelationMemberWithIndex) {
        return new validationIssue<Data>({
            type: type,
            severity: 'warning',
            message: function(context) {
                const member = context.hasEntity(this.entityIds[0]),
                    relation = context.hasEntity(this.entityIds[1]);
                return (member && relation) ? t.append('issues.missing_role.message', {
                    member: utilDisplayLabel(member, context.graph()),
                    relation: utilDisplayLabel(relation, context.graph())
                }) : '';
            },
            reference: showReference,
            entityIds: [way.id, relation.id],
            extent: function(graph) {
                return graph.entity(this.entityIds[0]).extent(graph);
            },
            data: {
                member: member
            },
            hash: member.index.toString(),
            dynamicFixes: function() {
                return [
                    makeAddRoleFix('inner'),
                    makeAddRoleFix('outer'),
                    new validationIssueFix<Data>({
                        icon: 'iD-operation-delete',
                        title: t.append('issues.fix.remove_from_relation.title'),
                        onClick: function(context) {
                            context.perform(
                                actionDeleteMember(relation.id, member.index),
                                t('operations.delete_member.annotation', {
                                    n: 1
                                })
                            );
                        }
                    })
                ];
            }
        });


        function showReference(selection: d3.Selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.missing_role.multipolygon.reference'));
        }
    }


    function makeAddRoleFix(role: string) {
        return new validationIssueFix<Data>({
            title: t.append('issues.fix.set_as_' + role + '.title'),
            onClick: function(context) {
                var oldMember = this.issue!.data!.member;
                var member = { id: this.issue!.entityIds[0], type: oldMember.type, role: role };
                context.perform(
                    actionChangeMember(this.issue!.entityIds[1] as RelationId, member, oldMember.index),
                    t('operations.change_role.annotation', {
                        n: 1
                    })
                );
            }
        });
    }

    validation.type = type;

    return validation;
};
