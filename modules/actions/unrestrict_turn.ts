import type { osmTurn } from '../osm';
import type { Action } from '../core/history';
import { actionDeleteRelation } from './delete_relation';


// `actionUnrestrictTurn` deletes a turn restriction relation.
//
// `turn` must be an `osmTurn` object with a `restrictionID` property.
// see osm/intersection.js, pathToTurn()
//
export function actionUnrestrictTurn(turn: osmTurn): Action {
    const action: Action = function(graph) {
        return actionDeleteRelation(turn.restrictionID!)(graph);
    };
    return action;
}
