import { operationDelete } from '../operations/delete';
import { osmIsInterestingTag } from '../osm/tags';
import { t } from '../util/locale';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


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


    function isUnknownRoad(entity) {
        return entity.type === 'way' && entity.tags.highway === 'road';
    }

    function isUntypedRelation(entity) {
        return entity.type === 'relation' && !entity.tags.type;
    }


    var validation = function checkMissingTag(entity, context) {
        var graph = context.graph();

        // ignore vertex features and relation members
        if (entity.geometry(graph) === 'vertex' || entity.hasParentRelations(graph)) {
            return [];
        }

        var messageObj = {};
        var missingTagType;
        var subtype;

        if (Object.keys(entity.tags).length === 0) {
            missingTagType = 'any';
            subtype = 'any';
        } else if (!hasDescriptiveTags(entity)) {
            missingTagType = 'descriptive';
            subtype = 'descriptive';
        } else if (isUntypedRelation(entity)) {
            missingTagType = 'specific';
            messageObj.tag = 'type';
            subtype = 'relation_type';
        } else if (isUnknownRoad(entity)) {
            missingTagType = 'unknown_road';
            subtype = 'highway_classification';
        }

        if (!missingTagType) return [];

        messageObj.feature = utilDisplayLabel(entity, context);

        var selectFixType = missingTagType === 'unknown_road' ? 'select_road_type' : 'select_preset';

        var fixes = [
            new validationIssueFix({
                icon: 'iD-icon-search',
                title: t('issues.fix.' + selectFixType + '.title'),
                onClick: function() {
                    context.ui().sidebar.showPresetList();
                }
            })
        ];

        // can always delete if the user created it in the first place..
        var canDelete = (entity.version === undefined || entity.v !== undefined);

        // otherwise check with operationDelete whether we can delete this entity
        if (!canDelete) {
            canDelete = !operationDelete([entity.id], context).disabled();
        }

        if (canDelete) {
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

        var messageID = missingTagType === 'unknown_road' ? 'unknown_road' : 'missing_tag.' + missingTagType;
        var referenceID = missingTagType === 'unknown_road' ? 'unknown_road' : 'missing_tag';

        var severity = (canDelete && missingTagType !== 'unknown_road') ? 'error' : 'warning';

        return [new validationIssue({
            type: type,
            subtype: subtype,
            severity: severity,
            message: t('issues.' + messageID + '.message', messageObj),
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
                .text(t('issues.' + referenceID + '.reference'));
        }
    };


    validation.type = type;

    return validation;
}
