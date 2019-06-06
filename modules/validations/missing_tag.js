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


    var validation = function checkMissingTag(entity, graph) {

        // ignore vertex features and relation members
        if (entity.geometry(graph) === 'vertex' || entity.hasParentRelations(graph)) {
            return [];
        }

        var subtype;

        if (Object.keys(entity.tags).length === 0) {
            subtype = 'any';
        } else if (!hasDescriptiveTags(entity)) {
            subtype = 'descriptive';
        } else if (isUntypedRelation(entity)) {
            subtype = 'relation_type';
        } else if (isUnknownRoad(entity)) {
            subtype = 'highway_classification';
        }

        if (!subtype) return [];

        var selectFixType = subtype === 'highway_classification' ? 'select_road_type' : 'select_preset';

        var fixes = [
            new validationIssueFix({
                icon: 'iD-icon-search',
                title: t('issues.fix.' + selectFixType + '.title'),
                onClick: function(context) {
                    context.ui().sidebar.showPresetList();
                }
            })
        ];

        // can always delete if the user created it in the first place..
        var canDelete = (entity.version === undefined || entity.v !== undefined);
        fixes.push(
            new validationIssueFix({
                icon: 'iD-operation-delete',
                title: t('issues.fix.delete_feature.title'),
                onClick: function(context) {
                    var id = this.issue.entityIds[0];
                    var operation = operationDelete([id], context);
                    if (!operation.disabled()) {
                        operation();
                    }
                }
            })
        );

        var messageID = subtype === 'highway_classification' ? 'unknown_road' : 'missing_tag.' + subtype;
        var referenceID = subtype === 'highway_classification' ? 'unknown_road' : 'missing_tag';

        var severity = (canDelete && subtype !== 'highway_classification') ? 'error' : 'warning';

        return [new validationIssue({
            type: type,
            subtype: subtype,
            severity: severity,
            message: function(context) {
                var entity = context.hasEntity(this.entityIds[0]);
                return entity ? t('issues.' + messageID + '.message', {
                    feature: utilDisplayLabel(entity, context)
                }) : '';
            },
            reference: showReference,
            entityIds: [entity.id],
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
