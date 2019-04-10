import { t } from '../util/locale';
import { actionDeleteMultiple } from '../actions';
import { behaviorOperation } from '../behavior';
import { geoExtent, geoSphericalDistance } from '../geo';
import { modeBrowse, modeSelect } from '../modes';
import { uiCmd } from '../ui';
import { utilGetAllNodes } from '../util';


export function operationDelete(selectedIDs, context) {
    var multi = (selectedIDs.length === 1 ? 'single' : 'multiple');
    var action = actionDeleteMultiple(selectedIDs);
    var nodes = utilGetAllNodes(selectedIDs, context.graph());
    var coords = nodes.map(function(n) { return n.loc; });
    var extent = nodes.reduce(function(extent, node) {
        return extent.extend(node.extent(context.graph()));
    }, geoExtent());
    var _disabled;


    var operation = function() {
        var nextSelectedID;
        var nextSelectedLoc;

        if (selectedIDs.length === 1) {
            var id = selectedIDs[0];
            var entity = context.entity(id);
            var geometry = context.geometry(id);
            var parents = context.graph().parentWays(entity);
            var parent = parents[0];

            // Select the next closest node in the way.
            if (geometry === 'vertex') {
                var nodes = parent.nodes;
                var i = nodes.indexOf(id);

                if (i === 0) {
                    i++;
                } else if (i === nodes.length - 1) {
                    i--;
                } else {
                    var a = geoSphericalDistance(entity.loc, context.entity(nodes[i - 1]).loc);
                    var b = geoSphericalDistance(entity.loc, context.entity(nodes[i + 1]).loc);
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
        if (_disabled !== undefined) return _disabled;

        if (extent.area() && extent.percentContainedIn(context.extent()) < 0.8) {
            return _disabled = 'too_large';
        } else if (someMissing()) {
            return _disabled = 'not_downloaded';
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return _disabled = 'connected_to_hidden';
        } else if (selectedIDs.some(protectedMember)) {
            return _disabled = 'part_of_relation';
        } else if (selectedIDs.some(incompleteRelation)) {
            return _disabled = 'incomplete_relation';
        } else if (selectedIDs.some(hasWikidataTag)) {
            return _disabled = 'has_wikidata_tag';
        }

        return _disabled = false;


        function someMissing() {
            var osm = context.connection();
            if (osm) {
                var missing = coords.filter(function(loc) { return !osm.isDataLoaded(loc); });
                if (missing.length) {
                    missing.forEach(function(loc) { context.loadTileAtLoc(loc); });
                    return true;
                }
            }
            return false;
        }

        function hasWikidataTag(id) {
            var entity = context.entity(id);
            return entity.tags.wikidata && entity.tags.wikidata.trim().length > 0;
        }

        function incompleteRelation(id) {
            var entity = context.entity(id);
            return entity.type === 'relation' && !entity.isComplete(context.graph());
        }

        function protectedMember(id) {
            var entity = context.entity(id);
            if (entity.type !== 'way') return false;

            var parents = context.graph().parentRelations(entity);
            for (var i = 0; i < parents.length; i++) {
                var parent = parents[i];
                var type = parent.tags.type;
                var role = parent.memberById(id).role || 'outer';
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
