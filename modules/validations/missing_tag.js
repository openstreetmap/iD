import { actionChangeTags } from '../actions/change_tags';
import { operationDelete } from '../operations/delete';
import { osmIsInterestingTag } from '../osm/tags';
import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationMissingTag(context) {
    var type = 'missing_tag';

    function hasDescriptiveTags(entity) {
        var onlyAttributeKeys = ['description', 'name', 'note', 'start_date', 'oneway'];
        var entityDescriptiveKeys = Object.keys(entity.tags)
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

    // There was a highway=<road_type> tag that was changed to highway=construction without
    // adding a construction=<road_type> tag.
    function hadRoadTypeChangedToConstruction(context, entity) {
        let origGraph = context.history().base();
        if (!origGraph.hasEntity(entity.id)) {
            return false;
        }
        const origTags = origGraph.entity(entity.id).tags;
        const wasKnownType = 'highway' in origTags && origTags.highway !== 'road' && origTags.highway !== 'construction';
        const isUnknownType = entity.tags.highway === 'construction' && !('construction' in entity.tags);
        return entity.type === 'way' && wasKnownType && isUnknownType;
    }

    function isUntypedRelation(entity) {
        return entity.type === 'relation' && !entity.tags.type;
    }

    var validation = function checkMissingTag(entity, graph) {

        var subtype;

        var osm = context.connection();
        var isUnloadedNode = entity.type === 'node' && osm && !osm.isDataLoaded(entity.loc);

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
        if (!subtype) {
            if (isUnknownRoad(entity)) {
                subtype = 'highway_classification';
            } else if (hadRoadTypeChangedToConstruction(context, entity)) {
                subtype = 'highway_classification_construction';
            }
        }

        if (!subtype) return [];

        // can always delete if the user created it in the first place..
        var userCreatedEntity = (entity.version === undefined || entity.v !== undefined);

        // If tags are missing, display a warning with a dynamic fix offering to select a
        // (new) preset.
        let messageID = `issues.missing_tag.${subtype}.message`;
        let referenceID = 'issues.missing_tag.reference';
        let mainFixLabel = 'issues.fix.select_preset.title';
        let mainFixAction = function(context) {
            context.ui().sidebar.showPresetList();
        };
        let mainFixIcon = 'iD-icon-search';
        let severity = 'warning';
        // Whether the warning should contain a fix that will (attempt) to delete
        // the entity with missing tags.
        let offerDeletionFix = true;

        switch (subtype) {
            // An entity lacks tags to make it relevant, for example:
            // - no tags at all (and not a way in a relation or a node in a way)
            // - a node without tags that is not part of a way)
            // - a relation without a type=... tag
            case 'any':
            case 'descriptive':
            case 'relation_type':
                if (userCreatedEntity) {
                    severity = 'error';
                }
                break;
            // A way tagged as highway=road (a more precise highway value should be
            // used).
            case 'highway_classification':
                messageID = 'issues.unknown_road.message';
                referenceID = 'issues.unknown_road.reference';
                mainFixLabel = 'issues.fix.select_road_type.title';
                break;
            // A way had a highway!=road tag, but it was changed to highway=construction
            // without a a construction=... tag.
            case 'highway_classification_construction':
                messageID = 'issues.unknown_road.message';
                referenceID = 'issues.unknown_road.reference';
                mainFixLabel = 'issues.fix.restore_road_type.title';
                mainFixIcon = 'iD-icon-undo';
                offerDeletionFix = false;
                mainFixAction = function(context) {
                    // We checked in hadRoadTypeChangedToConstruction() that a highway tag
                    // did exist before the edit and can thus just collect it here.
                    const origRoadType = context.history().base().entity(entity.id).tags.highway;
                    let newTags = Object.assign({}, entity.tags);   // shallow copy
                    newTags.construction = origRoadType;
                    context.perform(
                        actionChangeTags(entity.id, newTags),
                        t('operations.change_tags.annotation')
                    );
                };
                break;
        }

        return [new validationIssue({
            type: type,
            subtype: subtype,
            severity: severity,
            message: function(context) {
                var entity = context.hasEntity(this.entityIds[0]);
                return entity ? t.append(messageID, {
                    feature: utilDisplayLabel(entity, context.graph())
                }) : '';
            },
            reference: showReference,
            entityIds: [entity.id],
            dynamicFixes: function(context) {

                var fixes = [];

                fixes.push(new validationIssueFix({
                    icon: mainFixIcon,
                    title: t.append(mainFixLabel),
                    onClick: mainFixAction
                }));

                if (offerDeletionFix) {
                    var deleteOnClick;
                    var id = this.entityIds[0];
                    var operation = operationDelete(context, [id]);
                    var disabledReasonID = operation.disabled();
                    if (!disabledReasonID) {
                        deleteOnClick = function(context) {
                            var id = this.issue.entityIds[0];
                            var operation = operationDelete(context, [id]);
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
                }
                return fixes;
            }
        })];

        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append(referenceID));
        }
    };

    validation.type = type;

    return validation;
}
