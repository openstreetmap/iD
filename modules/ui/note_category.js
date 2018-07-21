import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select, selectAll as d3_selectAll } from 'd3-selection';

import { services } from '../services';
import { uiField } from './field';
import { uiFormFields } from './form_fields';

export function uiNoteCategory(context) {
    var formFields = uiFormFields(context);
    var _note;
    var _fieldsArr;

    function noteCategory(selection) {

        if (!_note.isNew()) return; // don't add category

        var initial = false;

        if (!_fieldsArr) {
                initial = true;
                var presets = context.presets();

                _fieldsArr = [
                    uiField(context, presets.field('category'), null, { show: true, revert: false }),
                ];

                _fieldsArr.forEach(function(field) {
                    field
                        .on('change', change);
                });
            }

            selection
                .append('div')
                .attr('class', 'note-category')
                .call(formFields.fieldsArr(_fieldsArr));

            function change() {
                var val = d3_select('input[name=\'category\']:checked').property('value') || undefined;
                // NOTE: perhaps there is a better way to get value, something like ...
                // var input = d3_select(this);
                // var val = input.property('value') || undefined;

                // store the unsaved comment with the note itself
                _note = _note.update({ newCategory: val });

                var osm = services.osm;
                if (osm) {
                    osm.replaceNote(_note);  // update note cache
                }
            }

    }

    noteCategory.note = function(_) {
        if (!arguments.length) return _note;
        _note = _;
        return noteCategory;
    };


    return noteCategory;
}