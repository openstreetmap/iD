import { t } from '../core/localizer';
import { modeDrawLine } from '../modes/draw_line';
import { behaviorOperation } from '../behavior/operation';
import { utilArrayGroupBy } from '../util';


export function operationContinue(context, selectedIDs) {
    var graph = context.graph();
    var entities = selectedIDs.map(function(id) { return graph.entity(id); });
    var geometries = Object.assign(
        { line: [], vertex: [] },
        utilArrayGroupBy(entities, function(entity) { return entity.geometry(graph); })
    );
    var vertex = geometries.vertex[0];


    function candidateWays() {
        return graph.parentWays(vertex).filter(function(parent) {
            return parent.geometry(graph) === 'line' &&
                !parent.isClosed() &&
                parent.affix(vertex.id) &&
                (geometries.line.length === 0 || geometries.line[0] === parent);
        });
    }


    var operation = function() {
        var candidate = candidateWays()[0];
        context.enter(
            modeDrawLine(context, candidate.id, context.graph(), 'line', candidate.affix(vertex.id), true)
        );
    };


    operation.available = function() {
        return geometries.vertex.length === 1 &&
            geometries.line.length <= 1 &&
            !context.features().hasHiddenConnections(vertex, context.graph());
    };


    operation.disabled = function() {
        var candidates = candidateWays();
        if (candidates.length === 0) {
            return 'not_eligible';
        } else if (candidates.length > 1) {
            return 'multiple';
        }

        return false;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.continue.' + disable) :
            t('operations.continue.description');
    };


    operation.annotation = function() {
        return t('operations.continue.annotation.line');
    };


    operation.id = 'continue';
    operation.keys = [t('operations.continue.key')];
    operation.title = t('operations.continue.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
