import type { Action } from '../core/history';
import { actionDeleteRelation } from './delete_relation';
import type { Turn } from './restrict_turn';


// `actionUnrestrictTurn` deletes a turn restriction relation.
//
// `turn` must be an `osmTurn` object with a `restrictionID` property.
// see osm/intersection.js, pathToTurn()
//
export function actionUnrestrictTurn(turn: Turn): Action {
    const action: Action = function(graph) {
        return actionDeleteRelation(turn.restrictionID)(graph);
    };
    return action;
}
