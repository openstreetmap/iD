import { t } from '../core/localizer';
import { actionDeleteMultiple } from '../actions/delete_multiple';
import { behaviorOperation } from '../behavior/operation';
import { geoSphericalDistance } from '../geo';
import { modeBrowse } from '../modes/browse';
import { modeSelect } from '../modes/select';
import { uiCmd } from '../ui/cmd';
import { utilGetAllNodes, utilTotalExtent } from '../util';


export function operationDelete(context, selectedIDs) {
    const multi = (selectedIDs.length === 1 ? 'single' : 'multiple');
    const action = actionDeleteMultiple(selectedIDs);
    const nodes = utilGetAllNodes(selectedIDs, context.graph());
    const coords = nodes.map(function(n) { return n.loc; });
    const extent = utilTotalExtent(selectedIDs, context.graph());


    const operation = function() {
        let nextSelectedID;
        let nextSelectedLoc;

        if (selectedIDs.length === 1) {
            const id = selectedIDs[0];
            const entity = context.entity(id);
            const geometry = entity.geometry(context.graph());
            const parents = context.graph().parentWays(entity);
            const parent = parents[0];

            // Select the next closest node in the way.
            if (geometry === 'vertex') {
                const nodes = parent.nodes;
                let i = nodes.indexOf(id);

                if (i === 0) {
                    i++;
                } else if (i === nodes.length - 1) {
                    i--;
                } else {
                    const a = geoSphericalDistance(entity.loc, context.entity(nodes[i - 1]).loc);
                    const b = geoSphericalDistance(entity.loc, context.entity(nodes[i + 1]).loc);
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
            const osm = context.connection();
            if (osm) {
                const missing = coords.filter(function(loc) { return !osm.isDataLoaded(loc); });
                if (missing.length) {
                    missing.forEach(function(loc) { context.loadTileAtLoc(loc); });
                    return true;
                }
            }
            return false;
        }

        function hasWikidataTag(id) {
            const entity = context.entity(id);
            return entity.tags.wikidata && entity.tags.wikidata.trim().length > 0;
        }

        function incompleteRelation(id) {
            const entity = context.entity(id);
            return entity.type === 'relation' && !entity.isComplete(context.graph());
        }

        function protectedMember(id) {
            const entity = context.entity(id);
            if (entity.type !== 'way') return false;

            const parents = context.graph().parentRelations(entity);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                const type = parent.tags.type;
                const role = parent.memberById(id).role || 'outer';
                if (type === 'route' || type === 'boundary' || (type === 'multipolygon' && role === 'outer')) {
                    return true;
                }
            }
            return false;
        }
    };


    operation.tooltip = function() {
        const disable = operation.disabled();
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
