import { actionChangeMember } from '../actions/change_member';
import { actionDeleteMember } from '../actions/delete_member';
import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationMissingRole() {
    var type = 'missing_role';

    var validation = function checkMissingRole(entity, graph) {
        var issues = [];
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
                var way = graph.hasEntity(member.id);
                if (way && isMissingRole(member)) {
                    issues.push(makeIssue(way, entity, member));
                }
            });
        }

        return issues;
    };


    function isMissingRole(member) {
        return !member.role || !member.role.trim().length;
    }


    function makeIssue(way, relation, member) {
        return new validationIssue({
            type: type,
            severity: 'warning',
            message: function(context) {
                var member = context.hasEntity(this.entityIds[1]),
                    relation = context.hasEntity(this.entityIds[0]);
                return (member && relation) ? t.append('issues.missing_role.message', {
                    member: utilDisplayLabel(member, context.graph()),
                    relation: utilDisplayLabel(relation, context.graph())
                }) : '';
            },
            reference: showReference,
            entityIds: [relation.id, way.id],
            data: {
                member: member
            },
            hash: member.index.toString(),
            dynamicFixes: function() {
                return [
                    makeAddRoleFix('inner'),
                    makeAddRoleFix('outer'),
                    new validationIssueFix({
                        icon: 'iD-operation-delete',
                        title: t.append('issues.fix.remove_from_relation.title'),
                        onClick: function(context) {
                            context.perform(
                                actionDeleteMember(this.issue.entityIds[0], this.issue.data.member.index),
                                t('operations.delete_member.annotation', {
                                    n: 1
                                })
                            );
                        }
                    })
                ];
            }
        });


        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.missing_role.multipolygon.reference'));
        }
    }


    function makeAddRoleFix(role) {
        return new validationIssueFix({
            title: t.append('issues.fix.set_as_' + role + '.title'),
            onClick: function(context) {
                var oldMember = this.issue.data.member;
                var member = { id: this.issue.entityIds[1], type: oldMember.type, role: role };
                context.perform(
                    actionChangeMember(this.issue.entityIds[0], member, oldMember.index),
                    t('operations.change_role.annotation', {
                        n: 1
                    })
                );
            }
        });
    }

    validation.type = type;

    return validation;
}
