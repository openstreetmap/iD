import { t } from '../util/locale';
import { behaviorDraw } from '../behavior';
import { modeBrowse, modeSelectNote } from './index';
import { osmNote } from '../osm';
import { services } from '../services';


export function modeAddNote(context) {
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
        var osm = services.osm;
        if (!osm) return;

        var note = osmNote({ loc: loc, status: 'open', comments: [] });
        osm.replaceNote(note);

        // force a reraw (there is no history change that would otherwise do this)
        context.pan([0,0]);

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
