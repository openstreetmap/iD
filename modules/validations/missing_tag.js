import { operationDelete } from '../operations/delete';
import { osmIsInterestingTag } from '../osm/tags';
import { osmOldMultipolygonOuterMemberOfRelation } from '../osm/multipolygon';
import { t } from '../util/locale';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationMissingTag() {
    var type = 'missing_tag';

    function hasDescriptiveTags(entity, graph) {
        var keys = Object.keys(entity.tags)
            .filter(function(k) {
                if (k === 'area' || k === 'name') {
                    return false;
                } else {
                    return osmIsInterestingTag(k);
                }
            });

        if (entity.type === 'relation' &&
            keys.length === 1 &&
            entity.tags.type === 'multipolygon') {
            // this relation's only interesting tag just says its a multipolygon,
            // which is not descriptive enough

            // It's okay for a simple multipolygon to have no descriptive tags
            // if its outer way has them (old model, see `outdated_tags.js`)
            return osmOldMultipolygonOuterMemberOfRelation(entity, graph);
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
        } else if (!hasDescriptiveTags(entity, graph)) {
            subtype = 'descriptive';
        } else if (isUntypedRelation(entity)) {
            subtype = 'relation_type';
        } else if (isUnknownRoad(entity)) {
            subtype = 'highway_classification';
        }

        if (!subtype) return [];

        var messageID = subtype === 'highway_classification' ? 'unknown_road' : 'missing_tag.' + subtype;
        var referenceID = subtype === 'highway_classification' ? 'unknown_road' : 'missing_tag';

        // can always delete if the user created it in the first place..
        var canDelete = (entity.version === undefined || entity.v !== undefined);
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
            dynamicFixes: function(context) {

                var fixes = [];

                var selectFixType = subtype === 'highway_classification' ? 'select_road_type' : 'select_preset';

                fixes.push(new validationIssueFix({
                    icon: 'iD-icon-search',
                    title: t('issues.fix.' + selectFixType + '.title'),
                    onClick: function(context) {
                        context.ui().sidebar.showPresetList();
                    }
                }));

                var deleteOnClick;

                var id = this.entityIds[0];
                var operation = operationDelete([id], context);
                var disabledReasonID = operation.disabled();
                if (!disabledReasonID) {
                    deleteOnClick = function(context) {
                        var id = this.issue.entityIds[0];
                        var operation = operationDelete([id], context);
                        if (!operation.disabled()) {
                            operation();
                        }
                    };
                }

                fixes.push(
                    new validationIssueFix({
                        icon: 'iD-operation-delete',
                        title: t('issues.fix.delete_feature.title'),
                        disabledReason: disabledReasonID ? t('operations.delete.' + disabledReasonID + '.single') : undefined,
                        onClick: deleteOnClick
                    })
                );

                return fixes;
            }
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
