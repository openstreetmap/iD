import * as d3 from 'd3';
import { d3combobox } from '../lib/d3.combobox.js';
import { t } from '../util/locale';
import { uiField } from './field';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../util';


export function uiChangesetEditor(context) {
    var dispatch = d3.dispatch('change'),
        fieldsArr,
        tags,
        changesetId;


    function changesetEditor(selection) {
        render(selection);
    }


    function render(selection) {
        var initial = false;

        if (!fieldsArr) {
            initial = true;
            var presets = context.presets();

            fieldsArr = [
                uiField(context, presets.field('comment'), null, { show: true, revert: false }),
                uiField(context, presets.field('source'), null, { show: false, revert: false }),
                uiField(context, presets.field('hashtags'), null, { show: false, revert: false }),
            ];

            fieldsArr.forEach(function(field) {
                field
                    .on('change', function(t, onInput) {
                        dispatch.call('change', field, t, onInput);
                    });
            });
        }

        fieldsArr.forEach(function(field) {
            field
                .tags(tags);
        });

        var shown = fieldsArr.filter(function(field) { return field.isShown(); }),
            notShown = fieldsArr.filter(function(field) { return !field.isShown(); });


        var form = selection.selectAll('.preset-form')
            .data([0]);

        form = form.enter()
            .append('div')
            .attr('class', 'preset-form')
            .merge(form);


        var fields = form.selectAll('.wrap-form-field')
            .data(shown, function(d) { return d.id; });

        fields.exit()
            .remove();

        // Enter
        var enter = fields.enter()
            .append('div')
            .attr('class', function(d) { return 'wrap-form-field wrap-form-field-' + d.id; });

        // Update
        fields = fields
            .merge(enter);

        fields
            .order()
            .each(function(d) {
                d3.select(this)
                    .call(d.render);
            });


        if (initial) {
            var node = d3.select('#preset-input-comment').node();
            if (node) {
                node.focus();
                node.select();
            }
        }

        notShown = notShown.map(function(field) {
            return {
                title: field.label(),
                value: field.label(),
                field: field
            };
        });


        var more = selection.selectAll('.more-fields')
            .data((notShown.length > 0) ? [0] : []);

        more.exit()
            .remove();

        more = more.enter()
            .append('div')
            .attr('class', 'more-fields')
            .append('label')
            .text(t('inspector.add_fields'))
            .merge(more);


        var input = more.selectAll('.value')
            .data([0]);

        input.exit()
            .remove();

        input = input.enter()
            .append('input')
            .attr('class', 'value')
            .attr('type', 'text')
            .call(utilNoAuto)
            .merge(input);

        input
            .call(utilGetSetValue, '')
            .attr('placeholder', function() {
                var placeholder = [];
                for (var field in notShown) {
                    placeholder.push(notShown[field].title);
                }
                return placeholder.slice(0,3).join(', ') + ((placeholder.length > 3) ? '…' : '');
            })
            .call(d3combobox()
                .container(context.container())
                .data(notShown)
                .minItems(1)
                .on('accept', function (d) {
                    var field = d.field;
                    field.show = true;
                    render(selection);
                    field.focus();
                })
            );
    }


    changesetEditor.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
        // Don't reset fieldsArr here.
        return changesetEditor;
    };


    changesetEditor.changesetID = function(_) {
        if (!arguments.length) return changesetId;
        if (changesetId === _) return changesetEditor;
        changesetId = _;
        fieldsArr = null;
        return changesetEditor;
    };


    return utilRebind(changesetEditor, dispatch, 'on');
}
