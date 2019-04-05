import { actionChangeMember, actionDeleteMember } from '../actions';
import { t } from '../util/locale';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationMissingRole() {
    var type = 'missing_role';

    var validation = function checkMissingRole(entity, context) {
        var issues = [];
        if (entity.type === 'way') {
            context.graph().parentRelations(entity).forEach(function(relation) {
                if (!relation.isMultipolygon()) {
                    return;
                }
                var member = relation.memberById(entity.id);
                if (member && isMissingRole(member)) {
                    issues.push(makeIssue(entity, relation, member, context));
                }
            });
        } else if (entity.type === 'relation' && entity.isMultipolygon()) {
            entity.indexedMembers().forEach(function(member) {
                var way = context.hasEntity(member.id);
                if (way && isMissingRole(member)) {
                    issues.push(makeIssue(way, entity, member, context));
                }
            });
        }

        return issues;
    };

    function isMissingRole(member) {
        return !member.role || !member.role.trim().length;
    }

    function makeIssue(way, relation, member, context) {
        return new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.missing_role.message', {
                member: utilDisplayLabel(way, context),
                relation: utilDisplayLabel(relation, context),
            }),
            tooltip: t('issues.missing_role.multipolygon.tip'),
            entities: [relation, way],
            info: {member: member},
            fixes: [
                makeAddRoleFix('inner', context),
                makeAddRoleFix('outer', context),
                new validationIssueFix({
                    icon: 'iD-operation-delete',
                    title: t('issues.fix.remove_from_relation.title'),
                    onClick: function() {
                        context.perform(
                            actionDeleteMember(this.issue.entities[0].id, this.issue.info.member.index),
                            t('operations.delete_member.annotation')
                        );
                    }
                })
            ]
        });
    }

    function makeAddRoleFix(role, context) {
        return new validationIssueFix({
            title: t('issues.fix.set_as_' + role + '.title'),
            onClick: function() {
                var oldMember = this.issue.info.member;
                var member = { id: this.issue.entities[1].id, type: oldMember.type, role: role };
                context.perform(
                    actionChangeMember(this.issue.entities[0].id, member, oldMember.index),
                    t('operations.change_role.annotation')
                );
            }
        });
    }

    validation.type = type;

    return validation;
}
