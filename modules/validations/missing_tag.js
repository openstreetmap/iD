import { operationDelete } from '../operations/delete';
import { osmIsInterestingTag } from '../osm/tags';
import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationMissingTag(context) {
    const type = 'missing_tag';

    function hasDescriptiveTags(entity) {
        const onlyAttributeKeys = ['description', 'name', 'note', 'start_date', 'oneway'];
        const entityDescriptiveKeys = Object.keys(entity.tags)
            .filter(function(k) {
                if (k === 'area' || !osmIsInterestingTag(k)) return false;

                return !onlyAttributeKeys.some(function(attributeKey) {
                    return k === attributeKey || k.indexOf(attributeKey + ':') === 0;
                });
            });

        if (entity.type === 'relation' &&
            entityDescriptiveKeys.length === 1 &&
            entity.tags.type === 'multipolygon') {
            // this relation's only interesting tag just says its a multipolygon,
            // which is not descriptive enough
            return false;
        }

        return entityDescriptiveKeys.length > 0;
    }

    function isUnknownRoad(entity) {
        return entity.type === 'way' && entity.tags.highway === 'road';
    }

    function isUntypedRelation(entity) {
        return entity.type === 'relation' && !entity.tags.type;
    }

    const validation = function checkMissingTag(entity, graph) {

        let subtype;

        const osm = context.connection();
        const isUnloadedNode = entity.type === 'node' && osm && !osm.isDataLoaded(entity.loc);

        // we can't know if the node is a vertex if the tile is undownloaded
        if (!isUnloadedNode &&
            // allow untagged nodes that are part of ways
            entity.geometry(graph) !== 'vertex' &&
            // allow untagged entities that are part of relations
            !entity.hasParentRelations(graph)) {

            if (Object.keys(entity.tags).length === 0) {
                subtype = 'any';
            } else if (!hasDescriptiveTags(entity)) {
                subtype = 'descriptive';
            } else if (isUntypedRelation(entity)) {
                subtype = 'relation_type';
            }
        }

        // flag an unknown road even if it's a member of a relation
        if (!subtype && isUnknownRoad(entity)) {
            subtype = 'highway_classification';
        }

        if (!subtype) return [];

        const messageID = subtype === 'highway_classification' ? 'unknown_road' : 'missing_tag.' + subtype;
        const referenceID = subtype === 'highway_classification' ? 'unknown_road' : 'missing_tag';

        // can always delete if the user created it in the first place..
        const canDelete = (entity.version === undefined || entity.v !== undefined);
        const severity = (canDelete && subtype !== 'highway_classification') ? 'error' : 'warning';

        return [new validationIssue({
            type: type,
            subtype: subtype,
            severity: severity,
            message: function(context) {
                const entity = context.hasEntity(this.entityIds[0]);
                return entity ? t.append('issues.' + messageID + '.message', {
                    feature: utilDisplayLabel(entity, context.graph())
                }) : '';
            },
            reference: showReference,
            entityIds: [entity.id],
            dynamicFixes: function(context) {

                const fixes = [];

                const selectFixType = subtype === 'highway_classification' ? 'select_road_type' : 'select_preset';

                fixes.push(new validationIssueFix({
                    icon: 'iD-icon-search',
                    title: t.append('issues.fix.' + selectFixType + '.title'),
                    onClick: function(context) {
                        context.ui().sidebar.showPresetList();
                    }
                }));

                let deleteOnClick;

                const id = this.entityIds[0];
                const operation = operationDelete(context, [id]);
                const disabledReasonID = operation.disabled();
                if (!disabledReasonID) {
                    deleteOnClick = function(context) {
                        const id = this.issue.entityIds[0];
                        const operation = operationDelete(context, [id]);
                        if (!operation.disabled()) {
                            operation();
                        }
                    };
                }

                fixes.push(
                    new validationIssueFix({
                        icon: 'iD-operation-delete',
                        title: t.append('issues.fix.delete_feature.title'),
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
                .call(t.append('issues.' + referenceID + '.reference'));
        }
    };

    validation.type = type;

    return validation;
}
