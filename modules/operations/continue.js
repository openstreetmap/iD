import _extend from 'lodash-es/extend';
import _groupBy from 'lodash-es/groupBy';

import { t } from '../util/locale';
import { modeDrawLine } from '../modes';
import { behaviorOperation } from '../behavior';


export function operationContinue(selectedIDs, context) {
    var graph = context.graph(),
        entities = selectedIDs.map(function(id) { return graph.entity(id); }),
        geometries = _extend({ line: [], vertex: [] },
            _groupBy(entities, function(entity) { return entity.geometry(graph); })),
        vertex = geometries.vertex[0];


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
            modeDrawLine(context, candidate.id, context.graph(), candidate.affix(vertex.id))
        );
    };


    operation.available = function() {
        return geometries.vertex.length === 1 && geometries.line.length <= 1 &&
            !context.features().hasHiddenConnections(vertex, context.graph());
    };


    operation.disabled = function() {
        var candidates = candidateWays();
        if (candidates.length === 0)
            return 'not_eligible';
        if (candidates.length > 1)
            return 'multiple';
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
