import { t } from '../util/locale';
import { behaviorDraw } from '../behavior';
import { modeBrowse, modeSelectNote } from './index';
import { osmNote } from '../osm';
import { services } from '../services';
import { dispatch as d3_dispatch } from 'd3-dispatch';



export function modeAddNote(context) {

    var dispatch = d3_dispatch('change');

    var mode = {
        id: 'add-note',
        button: 'note',
        title: t('modes.add_note.title'),
        description: t('modes.add_note.description'),
        key: '4'
    };

    var behavior = behaviorDraw(context)
        .tail(t('modes.add_note.tail'))
        .on('click', add)
        .on('cancel', cancel)
        .on('finish', cancel);


    function add(loc) {
        var note = osmNote({
            id: -1,
            loc: loc,
            status: 'open',
            comments: {},
            newFeature: true
        });

        services.osm.replaceNote(note);

        context
            .selectedNoteID(note.id)
            .enter(modeSelectNote(context, note.id).newFeature(true));
    }


    function cancel() {
        context.enter(modeBrowse(context));
    }


    mode.enter = function() {
        context.install(behavior);
    };


    mode.exit = function() {
        context.uninstall(behavior);
    };


    return mode;
}
