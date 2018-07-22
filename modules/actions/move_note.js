import { geoVecInterp } from '../geo';
import { services } from '../services';

export function actionMoveNote(noteID, toLoc) {

    var action = function(graph, t) {
        if (t === null || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        var note = services.osm.getNote(noteID);
        note.move(geoVecInterp(note.loc, toLoc, t));
        // TODO: update
    };

    action.transitionable = true;

    return action;
}
