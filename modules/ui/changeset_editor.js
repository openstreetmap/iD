import { dispatch as d3_dispatch } from 'd3-dispatch';

import { presetManager } from '../presets';
import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiCombobox} from './combobox';
import { uiField } from './field';
import { uiFormFields } from './form_fields';
import { utilArrayUniqBy, utilRebind, utilTriggerEvent } from '../util';


export function uiChangesetEditor(context) {
    var dispatch = d3_dispatch('change');
    var formFields = uiFormFields(context);
    var commentCombo = uiCombobox(context, 'comment').caseSensitive(true);
    var _fieldsArr;
    var _tags;
    var _changesetID;


    function changesetEditor(selection) {
        render(selection);
    }


    function render(selection) {
        var initial = false;

        if (!_fieldsArr) {
            initial = true;
            var presets = presetManager;

            _fieldsArr = [
                uiField(context, presets.field('comment'), null, { show: true, revert: false }),
                uiField(context, presets.field('source'), null, { show: false, revert: false }),
                uiField(context, presets.field('hashtags'), null, { show: false, revert: false }),
            ];

            _fieldsArr.forEach(function(field) {
                field
                    .on('change', function(t, onInput) {
                        dispatch.call('change', field, undefined, t, onInput);
                    });
            });
        }

        _fieldsArr.forEach(function(field) {
            field
                .tags(_tags);
        });


        selection
            .call(formFields.fieldsArr(_fieldsArr));


        if (initial) {
            var commentField = selection.select('.form-field-comment textarea');
            var commentNode = commentField.node();

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
                        var comment = changeset.tags.comment;
                        return comment ? { title: comment, value: comment } : null;
                    }).filter(Boolean);

                    commentField
                        .call(commentCombo
                            .data(utilArrayUniqBy(comments, 'title'))
                        );
                });
            }
        }

        var hasGoogle = _tags.comment.match(/google/i);
        var commentTooLong = _tags.comment.length > 255;
        var commentWarning = selection.select('.form-field-comment').selectAll('.comment-warning')
            .data(hasGoogle || commentTooLong ? [0] : []);

        commentWarning.exit()
            .transition()
            .duration(200)
            .style('opacity', 0)
            .remove();

        function displayWarningMessage(msg, link) {
            var commentEnter = commentWarning.enter()
                .insert('div', '.tag-reference-body')
                .attr('class', 'field-warning comment-warning')
                .style('opacity', 0);

            commentEnter
                .append('a')
                .attr('target', '_blank')
                .call(svgIcon('#iD-icon-alert', 'inline'))
                .attr('href', t(link))
                .append('span')
                .call(t.append(msg));

            commentEnter
                .transition()
                .duration(200)
                .style('opacity', 1);
        }

        // Add warning if comment mentions Google or comment length
        // exceeds 255 chars
        if (hasGoogle) displayWarningMessage('commit.google_warning', 'commit.google_warning_link');
        if (commentTooLong) displayWarningMessage('commit.changeset_comment_length_warning', 'commit.about_changeset_comments_link');
    }


    changesetEditor.tags = function(_) {
        if (!arguments.length) return _tags;
        _tags = _;
        // Don't reset _fieldsArr here.
        return changesetEditor;
    };


    changesetEditor.changesetID = function(_) {
        if (!arguments.length) return _changesetID;
        if (_changesetID === _) return changesetEditor;
        _changesetID = _;
        _fieldsArr = null;
        return changesetEditor;
    };


    return utilRebind(changesetEditor, dispatch, 'on');
}
