import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { presetManager } from '../presets';
import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiCombobox} from './combobox';
import { uiField } from './field';
import { uiFormFields } from './form_fields';
import { utilArrayUniqBy, utilCleanOsmString, utilRebind, utilTriggerEvent, utilUnicodeCharsCount } from '../util';
import { getIncompatibleSources } from '../validations/incompatible_source';


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
                uiField(context, presets.field('source'), null, { show: true, revert: false }),
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
            const sourceField = _fieldsArr.find(field => field.id === 'source');
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

                    // add extra dropdown options to the `source` field
                    // based on the values used in recent changesets.
                    const recentSources = changesets
                        .flatMap((changeset) => changeset.tags.source?.split(';'))
                        .filter(value => !sourceField.options?.includes(value))
                        .filter(Boolean)
                        .map(title => ({ title, value: title, klass: 'raw-option' }));

                    sourceField.impl.setCustomOptions(utilArrayUniqBy(recentSources, 'title'));
                });
            }
        }

        function findIncompatibleSources(str, which) {
            const incompatibleSources = getIncompatibleSources(str);
            if (!incompatibleSources) return false;
            return incompatibleSources.map(rule => {
                const value = rule.regex.exec(str)[1];
                return {
                    id: `incompatible_source.${which}.${rule.id}`,
                    msg: selection => {
                        selection.call(t.append(`commit.changeset_incompatible_source.${which}`, { value }));
                        selection.append('br');
                        selection
                            .append('a')
                            .attr('href', t('commit.changeset_incompatible_source.link'))
                            .call(t.append(`issues.incompatible_source.reference.${rule.id}`));
                    }
                };
            });
        }

        function renderWarnings(warnings, selection, klass) {
            const entries = selection.selectAll(`.${klass}`)
                .data(warnings, d => d.id);

            entries.exit()
                .transition()
                .duration(200)
                .style('opacity', 0)
                .remove();

            const enter = entries.enter()
                .append('div')
                .classed('field-warning', true)
                .classed(klass, true)
                .style('opacity', 0);

            enter
                .call(svgIcon('#iD-icon-alert', 'inline'))
                .append('span');

            enter
                .transition()
                .duration(200)
                .style('opacity', 1);

            entries.merge(enter).selectAll('div > span')
                .text('')
                .each(function(d) {
                    d3_select(this).call(d.msg);
                });
        }

        // Show warning(s) if comment mentions an invalid source
        const commentWarnings = findIncompatibleSources(_tags.comment, 'comment');
        // also show warning when comment length exceeds 255 chars
        const maxChars = context.maxCharsForTagValue();
        const strLen = utilUnicodeCharsCount(utilCleanOsmString(_tags.comment, Number.POSITIVE_INFINITY));
        if (strLen > maxChars || !true) {
            commentWarnings.push({
                id: 'message too long',
                msg: t.append('commit.changeset_comment_length_warning', { maxChars: maxChars }),
            });
        }
        renderWarnings(commentWarnings, selection.select('.form-field-comment'), 'comment-warning');

        // Show warning(s) if sources contain an invalid source
        const sourceWarnings = findIncompatibleSources(_tags.source, 'source');
        renderWarnings(sourceWarnings, selection.select('.form-field-source'), 'source-warning');
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
