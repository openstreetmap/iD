import _without from 'lodash-es/without';
import _isEmpty from 'lodash-es/isEmpty';

import { operationDelete } from '../operations/index';
import { osmIsInterestingTag } from '../osm/tags';
import { t } from '../util/locale';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationMissingTag() {
    var type = 'missing_tag';


    function hasDescriptiveTags(entity) {
        var keys = _without(Object.keys(entity.tags), 'area', 'name').filter(osmIsInterestingTag);
        if (entity.type === 'relation' && keys.length === 1) {
            return entity.tags.type !== 'multipolygon';
        }
        return keys.length > 0;
    }


    var validation = function(entity, context) {
        var graph = context.graph();

        // ignore vertex features and relation members
        if (entity.geometry(graph) === 'vertex' || entity.hasParentRelations(graph)) {
            return [];
        }

        var messageObj = {};
        var missingTagType;

        if (_isEmpty(entity.tags)) {
            missingTagType = 'any';
        } else if (!hasDescriptiveTags(entity)) {
            missingTagType = 'descriptive';
        } else if (entity.type === 'relation' && !entity.tags.type) {
            missingTagType = 'specific';
            messageObj.tag = 'type';
        }

        if (!missingTagType) {
            return [];
        }

        messageObj.feature = utilDisplayLabel(entity, context);

        var issues = [];

        var deleteFixOnClick = function() {
            var id = this.issue.entities[0].id;
            operationDelete([id], context)();
        };
        var canDelete = true;
        
        if (entity.type === 'relation' &&
            !entity.members.every(function(member) { return context.hasEntity(member.id); })) {
            deleteFixOnClick = null;
            canDelete = false;
        }

        issues.push(new validationIssue({
            type: type,
            // error if created or modified and is deletable, else warning
            severity: (!entity.version || entity.v) && canDelete  ? 'error' : 'warning',
            message: t('issues.missing_tag.' + missingTagType + '.message', messageObj),
            tooltip: t('issues.missing_tag.tip'),
            entities: [entity],
            fixes: [
                new validationIssueFix({
                    icon: 'iD-icon-search',
                    title: t('issues.fix.select_preset.title'),
                    onClick: function() {
                        context.ui().sidebar.showPresetList();
                    }
                }),
                new validationIssueFix({
                    icon: 'iD-operation-delete',
                    title: t('issues.fix.delete_feature.title'),
                    onClick: deleteFixOnClick
                })
            ]
        }));

        return issues;
    };

    validation.type = type;

    return validation;
}
