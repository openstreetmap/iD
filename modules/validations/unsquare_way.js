import { t } from '../util/locale';
import { actionOrthogonalize } from '../actions/orthogonalize';
import { geoOrthoCanOrthogonalize } from '../geo';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationUnsquareWay() {
    var type = 'unsquare_way';

    // use looser constraints for detection than those for completing the action
    var epsilon = 0.01;
    var degreeThreshold = 6;

    function isBuilding(entity, graph) {
        if (entity.type !== 'way' || entity.geometry(graph) !== 'area') return false;

        return entity.tags.building && entity.tags.building !== 'no';
    }

    var validation = function checkMissingRole(entity, context) {

        var graph = context.graph();

        if (!isBuilding(entity, graph)) return [];

        var isClosed = entity.isClosed();
        var nodes = context.childNodes(entity).slice();  // shallow copy
        if (isClosed) nodes.pop();

        // don't flag ways with lots of nodes since they are likely detail-mapped
        if (nodes.length > 6) return [];

        var osm = context.connection();
        var connectedToUnloadedTile = nodes.some(function(node) {
            return !osm.isDataLoaded(node.loc);
        });
        // ignore if not all conncted tiles are downloaded
        if (connectedToUnloadedTile) return [];

        var hasConnectedSquarableWays = nodes.some(function(node) {
            return graph.parentWays(node).some(function(way) {
                if (way.id === entity.id) return false;
                return isBuilding(way, graph);
            });
        });
        // don't flag connected ways to avoid unresolvable unsquare loops
        if (hasConnectedSquarableWays) return [];

        var projectedLocs = nodes.map(function(node) {
            return context.projection(node.loc);
        });

        if (!geoOrthoCanOrthogonalize(projectedLocs, isClosed, epsilon, degreeThreshold, true)) return [];

        var action = actionOrthogonalize(entity.id, context.projection, undefined, epsilon, degreeThreshold);
        action.transitionable = false;  // do it instantly

        return [new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.unsquare_way.message', {
                feature: utilDisplayLabel(entity, context)
            }),
            reference: showReference,
            entityIds: [entity.id],
            fixes: [
                new validationIssueFix({
                    icon: 'iD-operation-orthogonalize',
                    title: t('issues.fix.square_feature.title'),
                    autoArgs: [action, t('operations.orthogonalize.annotation.area')],
                    onClick: function() {
                        context.perform(action, t('operations.orthogonalize.annotation.area'));
                    }
                })
            ]
        })];

        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.unsquare_way.buildings.reference'));
        }
    };

    validation.type = type;

    return validation;
}
