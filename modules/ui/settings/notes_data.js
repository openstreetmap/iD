import { tooltip } from '../../util/tooltip';
import _cloneDeep from 'lodash-es/cloneDeep';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
  select as d3_select
} from 'd3-selection';

import { t } from '../../util/locale';
import { uiConfirm } from '../confirm';
import { utilRebind } from '../../util';
import { uiTooltipHtml } from '../tooltipHtml';


export function uiSettingsNotesData(context) {
    var dispatch = d3_dispatch('change');

    var _filterStatusList = d3_select(null);
    var _filterStatusDateRangeList = d3_select(null);
    var _filterContributionList = d3_select(null);

    function render(selection) {
        var notesLayer = context.layers().layer('notes');
        var _origSettings = {
            status: (notesLayer && notesLayer.status()) || null,
            statusOptions: (notesLayer && notesLayer.statusOptions()) || null,
            toggleDateRange: (notesLayer && notesLayer.toggleDateRange()) || null,
            toggleDateRangeOptions: (notesLayer && notesLayer.toggleDateRangeOptions()) || null,
            statusDateRange: (notesLayer && notesLayer.statusDateRange()) || null,
            statusDateRangeOptions: (notesLayer && notesLayer.statusDateRangeOptions()) || null,
            contribution: (notesLayer && notesLayer.contribution()) || null,
            contributionOptions: (notesLayer && notesLayer.contributionOptions()) || null,
        };
        var _currSettings = _cloneDeep(_origSettings);

        function showsStatus(d) {
            return _currSettings.status === d;
        }

        function setStatus(d) {
          _currSettings.status = d;
        }

        function showsToggle(d) {
            return _currSettings.toggleDateRange === d;
        }

        function setToggle(d) {
          _currSettings.toggleDateRange = d;
        }

        function setStatusDateRange(d) {
            // TODO: fix date looping when going below or above min/max
            var index = d.range === 'min' ? 0 : 1;

            var val = d3_select('#note-datePicker-' + d.range).property('value');

            if (d.min <= val && val <= d.max) {

                _currSettings.statusDateRange[index] = val;

                if (_currSettings.statusDateRange[0] > _currSettings.statusDateRange[1]) {
                    _currSettings.statusDateRange[1] = _currSettings.statusDateRange[0];
                }

            }
            if (!(val <= d.max)){
                _currSettings.statusDateRange[index] = d.max;
            }
            if (!(d.min <= val)){
                _currSettings.statusDateRange[index] = d.min;
            }

            // update values of pickers
            d3_select('#note-datePicker-min').property('value', _currSettings.statusDateRange[0]);
            d3_select('#note-datePicker-max').property('value', _currSettings.statusDateRange[1]);
        }

        function showsContribution(d) {
            return _currSettings.contribution === d;
        }

        function setContribution(d) {
            _currSettings.contribution = d;
        }

        // var example = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
        var modal = uiConfirm(selection).okButton();

        modal
            .classed('settings-modal settings-custom-data', true);

        modal.select('.modal-section.header')
            .append('h3')
            .text(t('settings.notes_data.header'));


        var textSection = modal.select('.modal-section.message-text');

        textSection
            .append('pre')
            .attr('class', 'notes_data-summary')
            .text(t('settings.notes_data.summary'));

        textSection
          .append('div')
          .attr('class', 'notes-filters-container');




        var filtersContainer = textSection.selectAll('.notes-filters-container');

        filtersContainer
            .append('h3')
            .text(t('settings.notes_data.filters.title'));

        filtersContainer
          .call(renderStatusList)
          .call(renderStatusDateRange)
          .call(renderContributionList);

        textSection
            .merge(filtersContainer);


        // insert a cancel button
        var buttonSection = modal.select('.modal-section.buttons');

        buttonSection
            .insert('button', '.ok-button')
            .attr('class', 'button cancel-button secondary-action')
            .text(t('confirm.cancel'));


        buttonSection.select('.cancel-button')
            .on('click.cancel', clickCancel);

        buttonSection.select('.ok-button')
            .attr('disabled', isSaveDisabled)
            .on('click.save', clickSave);


        function isSaveDisabled() {
            return null;
        }


        // cancel settings changes
        function clickCancel() {
            this.blur();
            modal.close();
        }

        // accept settings changes
        function clickSave() {

            notesLayer.status(_currSettings.status);
            notesLayer.toggleDateRange(_currSettings.toggleDateRange);
            notesLayer.statusDateRange(_currSettings.statusDateRange);
            notesLayer.contribution(_currSettings.contribution);
            this.blur();
            modal.close();
            dispatch.call('change', this, _currSettings);
        }


        function renderStatusList(selection) {
            var container = selection.selectAll('.note-status')
                .data([0]);

            _filterStatusList = container.enter()
                .append('div')
                .attr('class', 'note-status');

            _filterStatusList
                .append('h4')
                .text(t('settings.notes_data.filters.status.title'));

            _filterStatusList = _filterStatusList
                .append('ul')
                .attr('class', 'note-status-list layer-list layer-fill-list');

            _filterStatusList
                .call(drawListItems, _currSettings.statusOptions, 'radio', 'settings.notes_data.filters.status', setStatus, showsStatus )
                .merge(container);
        }


        function renderStatusDateRange(selection) {
            var container = selection.selectAll('.note-statusDateRange')
                  .data([0]);

            _filterStatusDateRangeList = container.enter()
                .append('div')
                .attr('class', 'note-statusDateRange');

            _filterStatusDateRangeList
                .append('h4')
                .text(t('settings.notes_data.filters.statusDateRange.title'));

            // toggle for open / closed date range
            _filterStatusDateRangeList = _filterStatusDateRangeList
                .append('ul')
                .attr('class', 'note-toggleDateRange-list layer-list layer-fill-list');

            _filterStatusDateRangeList
                .call(drawListItems, _currSettings.toggleDateRangeOptions, 'radio', 'settings.notes_data.filters.toggleDateRange', setToggle, showsToggle);

            // TODO: bring this ul outside of other ul
            // date range
            _filterStatusDateRangeList
                .append('ul')
                .attr('class', 'note-statusDateRange-list layer-list layer-fill-list');

            container = container
                .merge(_filterStatusDateRangeList);

            var ul = container.selectAll('.note-statusDateRange-list');

            var data = [
                {
                    d: _currSettings.statusDateRange[0],
                    name: 'settings.notes_data.filters.statusDateRange',
                    range: 'min',
                    min: _currSettings.statusDateRangeOptions[0],
                    max: _currSettings.statusDateRangeOptions[1]
                },
                {
                    d: _currSettings.statusDateRange[1],
                    name: 'settings.notes_data.filters.statusDateRange',
                    range: 'max',
                    min: _currSettings.statusDateRangeOptions[0],
                    max: _currSettings.statusDateRangeOptions[1]
                }
            ];

            var li = ul.selectAll('.list-item')
                .data(data);

            li.exit()
                .remove();

            var liEnter = li.enter()
                .append('li')
                .attr('class', 'layer datePicker')
                .call(tooltip()
                    .html(true)
                    .title(function(d) {
                        var status = _currSettings.toggleDateRange === 'all' ? '' : _currSettings.toggleDateRange;
                        var tip = t(d.name + '.' + d.range + '.tooltip', { status: status }),
                            key = null;

                        return uiTooltipHtml(tip, key);
                    })
                    .placement('top')
                );

            var label = liEnter
                .append('label');

            label
                .append('span')
                .text(function(d) { return t(d.name + '.' + d.range + '.description'); });

            label
                .append('input')
                .attr('id', function(d) { return 'note-datePicker-' + d.range; })
                .attr('type', 'date')
                .attr('name', function(d) { return d.name; })
                .property('value', function(d) { return d.d; })
                .attr('min', function(d) { return d.min; })
                .attr('max', function(d) { return d.max; })
                .on('change', setStatusDateRange);

            // Update
            li = li
              .merge(liEnter);
        }


        function renderContributionList(selection) {
            var container = selection.selectAll('.note-contribution')
                .data([0]);

          _filterContributionList = container.enter()
              .append('div')
              .attr('class', 'note-contribution');

            _filterContributionList
              .append('h4')
              .text(t('settings.notes_data.filters.contribution.title'));

            _filterContributionList = _filterContributionList
              .append('ul')
              .attr('class', 'note-contribution-list layer-list layer-fill-list');

            _filterContributionList
              .call(drawListItems, _currSettings.contributionOptions, 'radio', 'settings.notes_data.filters.contribution', setContribution, showsContribution )
              .merge(container);
        }


        function drawListItems(selection, data, type, name, change, active) {
          var items = selection.selectAll('li')
              .data(data);

          // Exit
          items.exit()
              .remove();

          // Enter
          var enter = items.enter()
              .append('li')
              .attr('class', 'layer')
              .call(tooltip()
                  .html(true)
                  .title(function(d) {
                      var tip = t(name + '.' + d + '.tooltip'),
                          key = null;

                      return uiTooltipHtml(tip, key);
                  })
                  .placement('top')
              );

          var label = enter
              .append('label');

          label
              .append('input')
              .attr('type', type)
              .attr('name', name)
              .on('change', change);

          label
              .append('span')
              .text(function(d) { return t(name + '.' + d + '.description'); });

          // Update
          items = items
              .merge(enter);

          items
              .classed('active', active)
              .selectAll('input')
              .property('checked', active);
              // .property('indeterminate', function(d) {
              //     return (name === 'feature' && autoHiddenFeature(d));
              // });
      }

    }

    return utilRebind(render, dispatch, 'on');
}
