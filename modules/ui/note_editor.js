import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { services } from '../services';
import { modeBrowse } from '../modes';
import { svgIcon } from '../svg';

import {
    uiNoteComments,
    uiNoteHeader,
    uiNoteReport,
    uiViewOnOSM,
} from './index';

import {
    utilNoAuto,
    utilRebind
} from '../util';


export function uiNoteEditor(context) {
    var dispatch = d3_dispatch('change');
    var noteComments = uiNoteComments();
    var noteHeader = uiNoteHeader();
    var _note;


    function noteEditor(selection) {
        var header = selection.selectAll('.header')
            .data([0]);

        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'header fillL');

        headerEnter
            .append('button')
            .attr('class', 'fr note-editor-close')
            .on('click', function() { context.enter(modeBrowse(context)); })
            .call(svgIcon('#iD-icon-close'));

        headerEnter
            .append('h3')
            .text(t('note.title'));


        var body = selection.selectAll('.body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'body')
            .merge(body);

        body.selectAll('.note-editor')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'modal-section note-editor')
            .call(noteHeader.note(_note))
            .call(noteComments.note(_note))
            .call(noteSave);


        selection.selectAll('.footer')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'footer')
            .call(uiViewOnOSM(context).what(_note))
            .call(uiNoteReport(context).note(_note));
    }


    function noteSave(selection) {
        var isSelected = (_note && _note.id === context.selectedNoteID());
        var noteSave = selection.selectAll('.note-save-section')
            .data((isSelected ? [_note] : []), function(d) { return d.status + d.id; });

        // exit
        noteSave.exit()
            .remove();

        // enter
        var noteSaveEnter = noteSave.enter()
            .append('div')
            .attr('class', 'note-save-section save-section cf');

        noteSaveEnter
            .append('h4')
            .attr('class', '.note-save-header')
            .text(t('note.newComment'));

        noteSaveEnter
            .append('textarea')
            .attr('id', 'new-comment-input')
            .attr('placeholder', t('note.inputPlaceholder'))
            .attr('maxlength', 1000)
            .property('value', function(d) { return d.newComment; })
            .call(utilNoAuto)
            .on('input', change)
            .on('blur', change);

        // update
        noteSave = noteSaveEnter
            .merge(noteSave)
            .call(noteSaveButtons);


        function change() {
            var input = d3_select(this);
            var val = input.property('value').trim() || undefined;

            // store the unsaved comment with the note itself
            _note = _note.update({ newComment: val });

            var osm = services.osm;
            if (osm) {
                osm.replaceNote(_note);  // update note cache
            }

            noteSave
                .call(noteSaveButtons);
        }
    }


    function noteSaveButtons(selection) {
        var isSelected = (_note && _note.id === context.selectedNoteID());
        var buttonSection = selection.selectAll('.buttons')
            .data((isSelected ? [_note] : []), function(d) { return d.status + d.id; });

        // exit
        buttonSection.exit()
            .remove();

        // enter
        var buttonEnter = buttonSection.enter()
            .append('div')
            .attr('class', 'buttons');

        buttonEnter
            .append('button')
            .attr('class', 'button status-button action')
            .append('span')
            .attr('class', 'label');

        buttonEnter
            .append('button')
            .attr('class', 'button comment-button action')
            .append('span')
            .attr('class', 'label')
            .text(t('note.comment'));

        // update
        buttonSection = buttonSection
            .merge(buttonEnter);

        buttonSection.select('.status-button')   // select and propagate data
            .text(function(d) {
                var action = (d.status === 'open' ? 'close' : 'open');
                var andComment = (d.newComment ? '_comment' : '');
                return t('note.' + action + andComment);
            })
            .on('click.status', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var osm = services.osm;
                if (osm) {
                    var setStatus = (d.status === 'open' ? 'closed' : 'open');
                    osm.postNoteUpdate(d, setStatus, function(err, note) {
                        dispatch.call('change', note);
                    });
                }
            });

        buttonSection.select('.comment-button')   // select and propagate data
            .attr('disabled', function(d) {
                return (d.status === 'open' && d.newComment) ? null : true;
            })
            .on('click.save', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var osm = services.osm;
                if (osm) {
                    osm.postNoteUpdate(d, d.status, function(err, note) {
                        dispatch.call('change', note);
                    });
                }
            });
    }


    noteEditor.note = function(_) {
        if (!arguments.length) return _note;
        _note = _;
        return noteEditor;
    };


    return utilRebind(noteEditor, dispatch, 'on');
}
