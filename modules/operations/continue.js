import { t } from '../core/localizer';
import { modeDrawLine } from '../modes/draw_line';
import { behaviorOperation } from '../behavior/operation';
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
            return parent.geometry(context.graph()) === 'line' &&
                !parent.isClosed() &&
                parent.affix(_vertex.id) &&
                (_geometries.line.length === 0 || _geometries.line[0] === parent);
        }) : [];
    }

    var _candidates = candidateWays();


    var operation = function() {
        var candidate = _candidates[0];
        context.enter(
            modeDrawLine(context, candidate.id, context.graph(), 'line', candidate.affix(_vertex.id), true)
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
            t.append('operations.continue.description');
    };


    operation.annotation = function() {
        return t('operations.continue.annotation.line');
    };


    operation.id = 'continue';
    operation.keys = [t('operations.continue.key')];
    operation.title = t.append('operations.continue.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
