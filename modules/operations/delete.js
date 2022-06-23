import { t } from '../core/localizer';
import { actionDeleteMultiple } from '../actions/delete_multiple';
import { behaviorOperation } from '../behavior/operation';
import { geoSphericalDistance } from '../geo';
import { modeBrowse } from '../modes/browse';
import { modeSelect } from '../modes/select';
import { uiCmd } from '../ui/cmd';
import { utilGetAllNodes, utilTotalExtent } from '../util';


export function operationDelete(context, selectedIDs) {
    var multi = (selectedIDs.length === 1 ? 'single' : 'multiple');
    var action = actionDeleteMultiple(selectedIDs);
    var nodes = utilGetAllNodes(selectedIDs, context.graph());
    var coords = nodes.map(function(n) { return n.loc; });
    var extent = utilTotalExtent(selectedIDs, context.graph());


    var operation = function() {
        var nextSelectedID;
        var nextSelectedLoc;

        if (selectedIDs.length === 1) {
            var id = selectedIDs[0];
            var entity = context.entity(id);
            var geometry = entity.geometry(context.graph());
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
        context.validator().validate();

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
        if (extent.percentContainedIn(context.map().extent()) < 0.8) {
            return 'too_large';
        } else if (someMissing()) {
            return 'not_downloaded';
        } else if (selectedIDs.some(context.hasHiddenConnections)) {
            return 'connected_to_hidden';
        } else if (selectedIDs.some(protectedMember)) {
            return 'part_of_relation';
        } else if (selectedIDs.some(incompleteRelation)) {
            return 'incomplete_relation';
        } else if (selectedIDs.some(hasWikidataTag)) {
            return 'has_wikidata_tag';
        }

        return false;


        function someMissing() {
            if (context.inIntro()) return false;
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
            t.append('operations.delete.' + disable + '.' + multi) :
            t.append('operations.delete.description.' + multi);
    };


    operation.annotation = function() {
        return selectedIDs.length === 1 ?
            t('operations.delete.annotation.' + context.graph().geometry(selectedIDs[0])) :
            t('operations.delete.annotation.feature', { n: selectedIDs.length });
    };


    operation.id = 'delete';
    operation.keys = [uiCmd('⌘⌫'), uiCmd('⌘⌦'), uiCmd('⌦')];
    operation.title = t.append('operations.delete.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
