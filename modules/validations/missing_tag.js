import { operationDelete } from '../operations/index';
import { osmIsInterestingTag } from '../osm/tags';
import { t } from '../util/locale';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationMissingTag() {
    var type = 'missing_tag';


    function hasDescriptiveTags(entity) {
        var keys = Object.keys(entity.tags)
            .filter(function(k) {
                if (k === 'area' || k === 'name') {
                    return false;
                } else {
                    return osmIsInterestingTag(k);
                }
            });

        if (entity.type === 'relation' && keys.length === 1) {
            return entity.tags.type !== 'multipolygon';
        }
        return keys.length > 0;
    }


    var validation = function checkMissingTag(entity, context) {
        var graph = context.graph();

        // ignore vertex features and relation members
        if (entity.geometry(graph) === 'vertex' || entity.hasParentRelations(graph)) {
            return [];
        }

        var messageObj = {};
        var missingTagType;

        if (Object.keys(entity.tags).length === 0) {
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

        var fixes = [
            new validationIssueFix({
                icon: 'iD-icon-search',
                title: t('issues.fix.select_preset.title'),
                onClick: function() {
                    context.ui().sidebar.showPresetList();
                }
            })
        ];

        var canDelete = false;
        if (!operationDelete([entity.id], context).disabled()) {
            canDelete = true;
            fixes.push(
                new validationIssueFix({
                    icon: 'iD-operation-delete',
                    title: t('issues.fix.delete_feature.title'),
                    onClick: function() {
                        var id = this.issue.entities[0].id;
                        var operation = operationDelete([id], context);
                        if (!operation.disabled()) {
                            operation();
                        }
                    }
                })
            );
        }

        // error if created or modified and is deletable, else warning
        var isError = (entity.version === undefined || entity.v !== undefined) && canDelete;

        return [new validationIssue({
            type: type,
            severity: isError ? 'error' : 'warning',
            message: t('issues.missing_tag.' + missingTagType + '.message', messageObj),
            reference: showReference,
            entities: [entity],
            fixes: fixes
        })];


        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.missing_tag.tip'));
        }
    };


    validation.type = type;

    return validation;
}
