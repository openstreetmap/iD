import { actionDeleteRelation } from './delete_relation';


// Remove the effects of `turn.restriction` on `turn`, which must have the
// following structure:
//
//     {
//         from: { node: <node ID>, way: <way ID> },
//         via:  { node: <node ID> },
//         to:   { node: <node ID>, way: <way ID> },
//         restrictionID: <relation ID>
//     }
//
// In the simple case, `restrictionID` is a reference to a `no_*` restriction
// on the turn itself. In this case, it is simply deleted.
//
// The more complex case is where `restrictionID` references an `only_*`
// restriction on a different turn in the same intersection. In that case,
// that restriction is also deleted, but at the same time restrictions on
// the turns other than the first two are created.
//
export function actionUnrestrictTurn(turn) {
    return function(graph) {
        return actionDeleteRelation(turn.restrictionID)(graph);
    };
}
