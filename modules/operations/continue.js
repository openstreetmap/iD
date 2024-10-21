import { t } from '../core/localizer';
import { modeDrawLine } from '../modes/draw_line';
import { modeDrawArea } from '../modes/draw_area';
import { behaviorOperation } from '../behavior/operation';
import { actionDeleteNode } from '../actions/delete_node';
import { utilArrayGroupBy } from '../util';


export function operationContinue(context, selectedIDs) {

    var _entities = selectedIDs.map(function(id) { return context.graph().entity(id); });
    var _geometries = Object.assign(
        { line: [], vertex: [] },
        utilArrayGroupBy(_entities, function(entity) { return entity.geometry(context.graph()); })
    );
    var _vertex = _geometries.vertex.length && _geometries.vertex[0];


    function candidateWays() {
        return _vertex ? context.graph().parentWays(_vertex).filter(function(parent) {
            return parent.contains(_vertex.id) &&
                (_geometries.line.length === 0 || _geometries.line[0] === parent);
        }) : [];
    }

    var _candidates = candidateWays();
    var _candidate = _candidates[0];
    var _candidateGeometry = _candidate && _candidate.geometry(context.graph());


    var operation = function() {
        var affix = _candidate.affix(_vertex.id);
        // Unless an endpoint is selected, delete the selected node in favor of whatever we're going to draw.
        // This avoids a situation where it's possible to draw along all but one of the edges.
        if (!affix) {
            context.perform(actionDeleteNode(_vertex.id));
        }
        context.enter(
            _candidateGeometry === 'line' ?
            modeDrawLine(context, _candidate.id, context.graph(), 'line', affix || _candidate.nodes.indexOf(_vertex.id), true) :
            modeDrawArea(context, _candidate.id, context.graph(), 'area', _candidate.nodes.indexOf(_vertex.id), true)
        );
    };


    operation.relatedEntityIds = function() {
        return _candidates.length ? [_candidates[0].id] : [];
    };


    operation.available = function() {
        return _geometries.vertex.length === 1 &&
            _geometries.line.length <= 1 &&
            !context.features().hasHiddenConnections(_vertex, context.graph());
    };


    operation.disabled = function() {
        if (_candidates.length === 0) {
            return 'not_eligible';
        } else if (_candidates.length > 1) {
            return 'multiple';
        }

        return false;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t.append('operations.continue.' + disable) :
            t.append('operations.continue.description.' + _candidateGeometry);
    };


    operation.annotation = function() {
        return t('operations.continue.annotation.' + _candidateGeometry);
    };


    operation.id = 'continue';
    operation.keys = [t('operations.continue.key')];
    operation.title = t.append('operations.continue.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
