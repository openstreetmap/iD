import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';
import { services } from '../services';
import { modeBrowse } from '../modes/browse';
import { svgIcon } from '../svg/icon';
import { uiMapRouletteDetails } from './maproulette_details';
import { uiViewOnMapRoulette } from './view_on_maproulette';

import { utilNoAuto, utilRebind } from '../util';

export function uiMapRouletteEditor(context) {
    const dispatch = d3_dispatch('change');

    let _qaItem;
    let _actionTaken = '';
    let _mapRouletteApiKey;
    let _goToNearbyTask = false;

    function render(selection) {
        const headerEnter = selection
            .selectAll('.header')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'header fillL');

        headerEnter
            .append('button')
            .attr('class', 'close')
            .attr('title', t('icons.close'))
            .on('click', () => context.enter(modeBrowse(context)))
            .call(svgIcon('#iD-icon-close'));

        headerEnter.append('h2').text(t('map_data.layers.maproulette.title'));

        let body = selection.selectAll('.body').data([0]);
        body = body.enter().append('div').attr('class', 'body').merge(body);

        const editor = body.selectAll('.mr-editor').data([0]);
        const editorEnter = editor
            .enter()
            .append('div')
            .attr('class', 'modal-section mr-editor')
            .merge(editor);

        editorEnter
            .call(uiMapRouletteDetails(context).task(_qaItem))
            .call(mRSaveSection)
            .call(commentSaveSection);

        const footer = selection.selectAll('.footer').data([0]);

        footer
            .enter()
            .append('div')
            .attr('class', 'footer')
            .merge(footer)
            .call(uiViewOnMapRoulette().what(_qaItem));
        function mRSaveSection(selection) {
            const isSelected =
                _qaItem && _qaItem.id === context.selectedErrorID();
            const isShown = !!_qaItem && isSelected;
            let saveSection = selection
                .selectAll('.mr-save')
                .data(isShown ? [_qaItem] : [], (d) => d.id);

            saveSection.exit().remove();

            const saveEnter = saveSection
                .enter()
                .append('div')
                .attr('class', 'mr-save save-section cf');

            saveSection = saveEnter.merge(saveSection);

            saveSection.call(mRSaveButtons).call(nearbyTaskToggle);
        }
    }

    function mRSaveButtons(selection) {
        const isSelected = _qaItem && _qaItem.id === context.selectedErrorID();
        let buttonSection = selection
            .selectAll('.buttons')
            .data(isSelected ? [_qaItem] : [], (d) => d.id);

        buttonSection.exit().remove();

        const buttonEnter = buttonSection
            .enter()
            .append('div')
            .attr('class', 'buttons');

        buttonEnter
            .append('button')
            .attr('class', 'button fixedIt-button action');
        buttonEnter
            .append('button')
            .attr('class', 'button cantComplete-button action');
        buttonEnter
            .append('button')
            .attr('class', 'button alreadyFixed-button action');
        buttonEnter
            .append('button')
            .attr('class', 'button notAnIssue-button action');

        buttonSection = buttonSection.merge(buttonEnter);

        const disabled = !_qaItem;
        buttonSection
            .select('.fixedIt-button')
            .attr('disabled', disabled ? true : null)
            .text(t('map_data.layers.maproulette.fixed'))
            .on('click.fixedIt', function (d3_event, d) {
                setStatus(d, 1, 'FIXED', selection);
            });

        buttonSection
            .select('.cantComplete-button')
            .attr('disabled', disabled ? true : null)
            .text(t('map_data.layers.maproulette.cantComplete'))
            .on('click.cantComplete', function (d3_event, d) {
                setStatus(d, 6, 'CAN\'T COMPLETE', selection);
            });

        buttonSection
            .select('.alreadyFixed-button')
            .attr('disabled', disabled ? true : null)
            .text(t('map_data.layers.maproulette.alreadyFixed'))
            .on('click.alreadyFixed', function (d3_event, d) {
                setStatus(d, 5, 'ALREADY FIXED', selection);
            });

        buttonSection
            .select('.notAnIssue-button')
            .attr('disabled', disabled ? true : null)
            .text(t('map_data.layers.maproulette.notAnIssue'))
            .on('click.notAnIssue', function (d3_event, d) {
                setStatus(d, 2, 'NOT AN ISSUE', selection);
            });
    }

    function commentSaveSection(selection) {
        const isSelected = _qaItem && _qaItem.id === context.selectedErrorID();
        let commentSave = selection
            .selectAll('.note-save')
            .data(isSelected && _actionTaken ? [_qaItem] : [], (d) => d.id);

        commentSave.exit().remove();

        let commentSaveEnter = commentSave
            .enter()
            .append('div')
            .attr('class', 'note-save save-section cf');

        commentSaveEnter.append('h4').attr('class', 'note-save-header');

        commentSave = commentSaveEnter.merge(commentSave);
        commentSave
            .select('.note-save-header')
            .html(
                t('map_data.layers.maproulette.comment') +
                    ' ' +
                    (_actionTaken || ''),
            );

        commentSaveEnter
            .append('textarea')
            .attr('class', 'new-comment-input')
            .attr(
                'placeholder',
                t('map_data.layers.maproulette.inputPlaceholder'),
            )
            .attr('maxlength', 1000)
            .property('value', (d) => d.newComment)
            .call(utilNoAuto)
            .on('input.note-input', changeInput)
            .on('blur.note-input', changeInput)
            .style('resize', 'none');

        commentSave = commentSaveEnter.merge(commentSave).call(submitButtons);

        function changeInput() {
            const input = d3_select(this);
            const val = input.property('value').trim() || undefined;
            _qaItem = _qaItem.update({ newComment: val });
            const mr = services.maproulette;
            if (mr) mr.replaceItem(_qaItem);
            commentSave.call(mRSaveButtons);
        }
    }

    function submitButtons(selection) {
        const isSelected = _qaItem && _qaItem.id === context.selectedErrorID();
        let buttonSection = selection
            .selectAll('.buttons')
            .data(isSelected ? [_qaItem] : [], (d) => d.id);

        buttonSection.exit().remove();

        const buttonEnter = buttonSection
            .enter()
            .append('div')
            .attr('class', 'buttons');
        buttonEnter
            .append('button')
            .attr('class', 'button cancel-button action');
        buttonEnter
            .append('button')
            .attr('class', 'button submit-button action');

        buttonSection = buttonSection.merge(buttonEnter);

        buttonSection
            .select('.cancel-button')
            .text(t('map_data.layers.maproulette.cancel'))
            .on('click.cancel', function () {
                this.blur();
                _actionTaken = '';
                if (_qaItem) _qaItem._status = '';
                selection.call(commentSaveSection);
            });

        buttonSection
            .select('.submit-button')
            .text(t('map_data.layers.maproulette.submit'))
            .on('click.submit', function (d) {
                this.blur();
                const osm = services.osm;
                if (osm && typeof osm.loadMapRouletteKey === 'function') {
                    osm.loadMapRouletteKey((err, prefs) => {
                        _mapRouletteApiKey =
                            prefs && prefs.maproulette_apikey_v2;
                        submitTask(d);
                    });
                } else {
                    submitTask(d);
                }
            });
    }

    function setStatus(d, status, label, selection) {
        d._status = status;
        _actionTaken = label;
        selection.call(commentSaveSection);
    }

    function submitTask(d) {
        const mr = services.maproulette;
        if (!mr) return;
        d.comment = d3_select('.new-comment-input').empty()
            ? ''
            : d3_select('.new-comment-input').property('value').trim();
        d.mapRouletteApiKey = _mapRouletteApiKey;
        mr.postUpdate(d, (err) => {
            if (!err) dispatch.call('change', d);
            // navigate to next nearby task if enabled
            if (!err && _goToNearbyTask) {
                // Find another MR item nearby and select it
                const projection = context.projection;
                if (services.maproulette && projection) {
                    const items =
                        services.maproulette.getItems(projection) || [];
                    const next = items.find((item) => item.id !== d.id);
                    if (next) {
                        context.enter('select-error', { error: next });
                    }
                }
            }
        });
    }

    function nearbyTaskToggle(selection) {
        const section = selection.selectAll('.checkbox-section').data([0]);
        const enter = section
            .enter()
            .append('div')
            .attr('class', 'checkbox-section modal-section');

        enter
            .append('input')
            .attr('type', 'checkbox')
            .attr('id', 'nearbyTaskCheckbox')
            .on('change', function () {
                _goToNearbyTask = !!this.checked;
            });

        enter
            .append('label')
            .attr('for', 'nearbyTaskCheckbox')
            .text(t('map_data.layers.maproulette.nearbyTask.title'));
    }

    render.error = function (val) {
        if (!arguments.length) return _qaItem;
        _qaItem = val;
        _actionTaken = '';
        return render;
    };

    return utilRebind(render, dispatch, 'on');
}
