import { prefs } from '../core/preferences';
import { t } from '../core/localizer';
//import { actionChangeTags } from '../actions/change_tags';
import { actionOrthogonalize } from '../actions/orthogonalize';
import { geoOrthoCanOrthogonalize } from '../geo/ortho';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';
import { services } from '../services';

export function validationUnsquareWay(context) {
    var type = 'unsquare_way';
    var DEFAULT_DEG_THRESHOLD = 5;   // see also issues.js

    // use looser epsilon for detection to reduce warnings of buildings that are essentially square already
    var epsilon = 0.05;
    var nodeThreshold = 10;

    function isBuilding(entity, graph) {
        if (entity.type !== 'way' || entity.geometry(graph) !== 'area') return false;
        return entity.tags.building && entity.tags.building !== 'no';
    }


    var validation = function checkUnsquareWay(entity, graph) {

        if (!isBuilding(entity, graph)) return [];

        // don't flag ways marked as physically unsquare
        if (entity.tags.nonsquare === 'yes') return [];

        var isClosed = entity.isClosed();
        if (!isClosed) return [];        // this building has bigger problems

        // don't flag ways with lots of nodes since they are likely detail-mapped
        var nodes = graph.childNodes(entity).slice();    // shallow copy
        if (nodes.length > nodeThreshold + 1) return [];   // +1 because closing node appears twice

        // ignore if not all nodes are fully downloaded
        var osm = services.osm;
        if (!osm || nodes.some(function(node) { return !osm.isDataLoaded(node.loc); })) return [];

        // don't flag connected ways to avoid unresolvable unsquare loops
        var hasConnectedSquarableWays = nodes.some(function(node) {
            return graph.parentWays(node).some(function(way) {
                if (way.id === entity.id) return false;
                if (isBuilding(way, graph)) return true;
                return graph.parentRelations(way).some(function(parentRelation) {
                    return parentRelation.isMultipolygon() &&
                        parentRelation.tags.building &&
                        parentRelation.tags.building !== 'no';
                });
            });
        });
        if (hasConnectedSquarableWays) return [];


        // user-configurable square threshold
        var storedDegreeThreshold = prefs('validate-square-degrees');
        var degreeThreshold = isNaN(storedDegreeThreshold) ? DEFAULT_DEG_THRESHOLD : parseFloat(storedDegreeThreshold);

        var points = nodes.map(function(node) { return context.projection(node.loc); });
        if (!geoOrthoCanOrthogonalize(points, isClosed, epsilon, degreeThreshold, true)) return [];

        var autoArgs;
        // don't allow autosquaring features linked to wikidata
        if (!entity.tags.wikidata) {
            // use same degree threshold as for detection
            var autoAction = actionOrthogonalize(entity.id, context.projection, undefined, degreeThreshold);
            autoAction.transitionable = false;  // when autofixing, do it instantly
            autoArgs = [autoAction, t('operations.orthogonalize.annotation.feature', { n: 1 })];
        }

        return [new validationIssue({
            type: type,
            subtype: 'building',
            severity: 'warning',
            message: function(context) {
                var entity = context.hasEntity(this.entityIds[0]);
                return entity ? t.append('issues.unsquare_way.message', {
                    feature: utilDisplayLabel(entity, context.graph())
                }) : '';
            },
            reference: showReference,
            entityIds: [entity.id],
            hash: degreeThreshold,
            dynamicFixes: function() {
                return [
                    new validationIssueFix({
                        icon: 'iD-operation-orthogonalize',
                        title: t.append('issues.fix.square_feature.title'),
                        autoArgs: autoArgs,
                        onClick: function(context, completionHandler) {
                            var entityId = this.issue.entityIds[0];
                            // use same degree threshold as for detection
                            context.perform(
                                actionOrthogonalize(entityId, context.projection, undefined, degreeThreshold),
                                t('operations.orthogonalize.annotation.feature', { n: 1 })
                            );
                            // run after the squaring transition (currently 150ms)
                            window.setTimeout(function() { completionHandler(); }, 175);
                        }
                    }),
                    /*
                    new validationIssueFix({
                        title: t.append('issues.fix.tag_as_unsquare.title'),
                        onClick: function(context) {
                            var entityId = this.issue.entityIds[0];
                            var entity = context.entity(entityId);
                            var tags = Object.assign({}, entity.tags);  // shallow copy
                            tags.nonsquare = 'yes';
                            context.perform(
                                actionChangeTags(entityId, tags),
                                t('issues.fix.tag_as_unsquare.annotation')
                            );
                        }
                    })
                    */
                ];
            }
        })];

        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.unsquare_way.buildings.reference'));
        }
    };

    validation.type = type;

    return validation;
}
