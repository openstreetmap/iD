import _uniqBy from 'lodash-es/uniqBy';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { d3combobox as d3_combobox } from '../lib/d3.combobox.js';
import { interpolateRgb as d3_interpolateRgb } from 'd3-interpolate';

import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { uiField } from './field';
import { uiFormFields } from './form_fields';
import { utilRebind, utilTriggerEvent } from '../util';


export function uiChangesetEditor(context) {
    var dispatch = d3_dispatch('change'),
        formFields = uiFormFields(context),
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


        selection
            .call(formFields.fieldsArr(fieldsArr));


        if (initial) {
            var commentField = selection.select('#preset-input-comment'),
                commentNode = commentField.node();

            if (commentNode) {
                commentNode.focus();
                commentNode.select();
            }

            // trigger a 'blur' event so that comment field can be cleaned
            // and checked for hashtags, even if retrieved from localstorage
            utilTriggerEvent(commentField, 'blur');

            var osm = context.connection();
            if (osm) {
                osm.userChangesets(function (err, changesets) {
                    if (err) return;

                    var comments = changesets.map(function(changeset) {
                        return {
                            title: changeset.tags.comment,
                            value: changeset.tags.comment
                        };
                    });

                    commentField
                        .call(d3_combobox()
                            .container(context.container())
                            .caseSensitive(true)
                            .data(_uniqBy(comments, 'title'))
                        );
                });
            }
        }

        // Change style if comment is short
        var SHORT = 25;
        var ENOUGH = 50;
        function getBackground(numChars) {
            var step;
            if (numChars <= SHORT) {
                step = numChars / SHORT;
                return d3_interpolateRgb('#f6d3ce', '#ffffbb')(step);  // light red -> yellow
            } else if (numChars <= ENOUGH) {
                step = Math.min((numChars - SHORT) / (ENOUGH - SHORT), 1.0);
                return d3_interpolateRgb('#ffffbb', '#f6f6f6')(step);  // yellow -> default-grey
            } else {
                return null; // default (inherit)
            }
        }

        function getBorderColor(numChars) {
            var step;
            if (numChars <= SHORT) {
                step = numChars / SHORT;
                return d3_interpolateRgb('#e06e5f', '#cccccc')(step);  // strong red -> default-grey
            // } else if (numChars <= ENOUGH) {
            //     step = Math.min((numChars - SHORT) / (ENOUGH - SHORT), 1.0);
            //    return d3_interpolateRgb('#f6d3ce', '#cccccc')(step);  // light red -> default-grey
            } else {
                return null; // default (inherit)
            }
        }
    
        var numChars = tags.comment.length;
        var background = getBackground(numChars);
        var bordercolor = getBorderColor(numChars);
        
        selection.select('.form-field-comment').selectAll('.form-label')
            .style('background' ,  background)
            .style('border-color' , bordercolor);
        
        selection.select('.form-field-comment').selectAll('.combobox-input')
            .style('border-color' , bordercolor);
        
        // Add warning if comment is short
        var isShort = (tags.comment.length < SHORT);
        var commentShortWarning = selection.select('.form-field-comment').selectAll('.comment-short-warning')
            .data(isShort ? [0] : []);

        commentShortWarning.exit()
            .transition()
            .duration(200)
            .style('opacity', 0)
            .remove();

        var commentShortEnter = commentShortWarning.enter()
            .insert('div', '.tag-reference-body')
            .attr('class', 'field-warning comment-short-warning')
            .style('opacity', 0);

        commentShortEnter
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .call(svgIcon('#icon-alert', 'inline'))
            .attr('href', t('commit.about_changeset_comments_link'))
            .append('span')
            .text(t('commit.short_changeset_comment_warning'));

        commentShortEnter
            .transition()
            .duration(200)
            .style('opacity', 1);

        // Add warning if comment mentions Google
        var hasGoogle = tags.comment.match(/google/i);
        var commentGoogleWarning = selection.select('.form-field-comment').selectAll('.comment-google-warning')
            .data(hasGoogle ? [0] : []);

        commentGoogleWarning.exit()
            .transition()
            .duration(200)
            .style('opacity', 0)
            .remove();

        var commentGoogleEnter = commentGoogleWarning.enter()
            .insert('div', '.tag-reference-body')
            .attr('class', 'field-warning comment-google-warning')
            .style('opacity', 0);

        commentGoogleEnter
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .call(svgIcon('#icon-alert', 'inline'))
            .attr('href', t('commit.google_warning_link'))
            .append('span')
            .text(t('commit.google_warning'));

        commentGoogleEnter
            .transition()
            .duration(200)
            .style('opacity', 1);
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
