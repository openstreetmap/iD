import { dispatch as d3_dispatch } from 'd3-dispatch';
import { uiFormFields } from './form_fields';


import { uiField } from './field';
import { utilRebind } from '../util';
import { utilDetect } from '../util/detect';
import { t } from '../util/locale';


export function uiNoteEditor(context) {
    var dispatch = d3_dispatch('change');
    var formFields = uiFormFields(context);
    var _fieldsArr;
    var _note;


    function localeDateString(s) {
        if (!s) return null;
        var detected = utilDetect();
        var options = { day: 'numeric', month: 'short', year: 'numeric' };
        var d = new Date(s);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString(detected.locale, options);
    }


    function noteEditor(selection) {
        render(selection);
    }


    function noteHeader(selection) {
        selection.selectAll('.note-header')
            .data(_note, function(d) { return d.id; })
            .enter()
            .append('h3')
            .attr('class', 'note-header')
            .text(function(d) { return String(t('note.note') + ' ' + d.id); });
    }


    function noteComments(selection) {
        function noteCreator(d) {
            var userName = d.user ? d.user : t('note.anonymous');
            return String(userName + ' ' + localeDateString(d.date));
        }

        var comments = selection.selectAll('.comments')
            .data([0]);

        comments = comments.enter()
            .append('div')
            .attr('class', 'comments')
            .merge(comments);

        var commentEnter = comments.selectAll('.comment')
            .data(_note.comments, function(d) { return d.uid; })
            .enter()
            .append('div')
            .attr('class', 'comment');

        commentEnter
            .append('p')
            .attr('class', 'commentText')
            .text(function(d) { return d.text; });

        commentEnter
            .append('p')
            .attr('class', 'commentCreator')
            .text(function(d) { return noteCreator(d); });

    }


    function render(selection) {
        var header = selection.selectAll('.header')
            .data([0]);

        header.enter()
            .append('div')
            .attr('class', 'header fillL')
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
            .call(noteHeader)
            .call(noteComments);
    }


    noteEditor.note = function(_) {
        if (!arguments.length) return _note;
        _note = _;
        _fieldsArr = null;
        return noteEditor;
    };


    return utilRebind(noteEditor, dispatch, 'on');
}
