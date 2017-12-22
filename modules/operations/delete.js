import _some from 'lodash-es/some';

import { t } from '../util/locale';
import { actionDeleteMultiple } from '../actions';
import { behaviorOperation } from '../behavior';
import { geoExtent, geoSphericalDistance } from '../geo';
import { modeBrowse, modeSelect } from '../modes';
import { uiCmd } from '../ui';


export function operationDelete(selectedIDs, context) {
    var multi = (selectedIDs.length === 1 ? 'single' : 'multiple'),
        action = actionDeleteMultiple(selectedIDs),
        extent = selectedIDs.reduce(function(extent, id) {
                return extent.extend(context.entity(id).extent(context.graph()));
            }, geoExtent());


    var operation = function() {
        var nextSelectedID;
        var nextSelectedLoc;

        if (selectedIDs.length === 1) {
            var id = selectedIDs[0],
                entity = context.entity(id),
                geometry = context.geometry(id),
                parents = context.graph().parentWays(entity),
                parent = parents[0];

            // Select the next closest node in the way.
            if (geometry === 'vertex') {
                var nodes = parent.nodes,
                    i = nodes.indexOf(id);

                if (i === 0) {
                    i++;
                } else if (i === nodes.length - 1) {
                    i--;
                } else {
                    var a = geoSphericalDistance(entity.loc, context.entity(nodes[i - 1]).loc),
                        b = geoSphericalDistance(entity.loc, context.entity(nodes[i + 1]).loc);
                    i = a < b ? i - 1 : i + 1;
                }

                nextSelectedID = nodes[i];
                nextSelectedLoc = context.entity(nextSelectedID).loc;
            }
        }

        context.perform(action, operation.annotation());

        if (nextSelectedID && nextSelectedLoc) {
            if (context.hasEntity(nextSelectedID)) {
                context.enter(modeSelect(context, [nextSelectedID]).follow(true));
            } else {
                context.map().centerEase(nextSelectedLoc);
                context.enter(modeBrowse(context));
            }
        } else {
            context.enter(modeBrowse(context));
        }

    };


    operation.available = function() {
        return true;
    };


    operation.disabled = function() {
        var reason;
        if (extent.area() && extent.percentContainedIn(context.extent()) < 0.8) {
            reason = 'too_large';
        } else if (_some(selectedIDs, context.hasHiddenConnections)) {
            reason = 'connected_to_hidden';
        } else if (_some(selectedIDs, protectedMember)) {
            reason = 'part_of_relation';
        } else if (_some(selectedIDs, incompleteRelation)) {
            reason = 'incomplete_relation';
        }
        return reason;

        function incompleteRelation(id) {
            var entity = context.entity(id);
            return entity.type === 'relation' && !entity.isComplete(context.graph());
        }

        function protectedMember(id) {
            var entity = context.entity(id);
            if (entity.type !== 'way') return false;

            var parents = context.graph().parentRelations(entity);
            for (var i = 0; i < parents.length; i++) {
                var parent = parents[i],
                    type = parent.tags.type,
                    role = parent.memberById(id).role || 'outer';
                if (type === 'route' || type === 'boundary' || (type === 'multipolygon' && role === 'outer')) {
                    return true;
                }
            }
            return false;
        }

    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.delete.' + disable + '.' + multi) :
            t('operations.delete.description' + '.' + multi);
    };


    operation.annotation = function() {
        return selectedIDs.length === 1 ?
            t('operations.delete.annotation.' + context.geometry(selectedIDs[0])) :
            t('operations.delete.annotation.multiple', { n: selectedIDs.length });
    };


    operation.id = 'delete';
    operation.keys = [uiCmd('⌘⌫'), uiCmd('⌘⌦'), uiCmd('⌦')];
    operation.title = t('operations.delete.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
