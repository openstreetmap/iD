import _debounce from 'lodash-es/debounce';

import { descending as d3_descending, ascending as d3_ascending } from 'd3-array';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg/icon';
import { uiCmd } from './cmd';
import { uiDisclosure } from './disclosure';
import { uiSettingsCustomTasking } from './settings/custom_tasking';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';


export function uiTasking(context) {
    var key = t('tasking.key');

    var _pane = d3_select(null);
    var _toggleButton = d3_select(null);
    var _managersList = d3_select(null);

    var managers = context.tasking().managers();

    var _customSource = context.tasking().findManager('custom');
    var _previousManager = context.tasking().findManager('none');

    var taskingCustomData = uiSettingsCustomTasking(context)
        .on('change', customChanged);


    function setManager(d) {
        if (d.id === 'custom' && !d.template()) {
            return editCustom();
        }

        d3_event.preventDefault();
        _previousManager = context.tasking().currentManager();
        context.tasking().currentManager(d);

        document.activeElement.blur();
    }


    function showsManager(d) {
        return _previousManager === d;
    }


    function customChanged(d) {
        if (d && d.template) {
            _customSource.template(d.template);
            setManager(_customSource);
        } else {
            _customSource.template('');
            setManager(context.tasking().findManager('none'));
        }
    }


    function editCustom() {
        d3_event.preventDefault();
        context.container()
            .call(taskingCustomData);
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
            .classed('manager-custom', function(d) { return d.id === 'custom'; })
            .call(tooltip()
                .title(function(d) {
                    return t('tasking.managers.' + d.id + '.tooltip') || null;
                })
                .placement('bottom')
            );

        enter.filter(function(d) { return d.id === 'custom'; })
            .append('button')
            .attr('class', 'manager-browse')
            .on('click', editCustom)
            .call(svgIcon('#iD-icon-more'));

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);

        label
            .append('span')
            .text(function(d) { return d.name(); });


        // Update
        items = items
            .merge(enter);

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active);
    }


    function renderManagersList(selection) {

        // the managers list
        var container = selection.selectAll('.layer-managers-list')
            .data([0]);

        _managersList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-managers-list')
            .attr('dir', 'auto')
            .merge(container);

        updateManagersList();
    }


    function updateManagersList() {
        _managersList
            .call(drawListItems, managers, 'radio', 'manager', setManager, showsManager);
    }


    function update() {
        if (!_pane.select('.disclosure-wrap-managers_list').classed('hide')) {
            updateManagersList();
        }
    }


    function hidePane() {
        context.ui().togglePanes();
    }


    var paneTooltip = tooltip()
        .placement((textDirection === 'rtl') ? 'right' : 'left')
        .html(true)
        .title(uiTooltipHtml(t('tasking.description'), key));

    uiTasking.togglePane = function() {
        if (d3_event) d3_event.preventDefault();
        paneTooltip.hide(_toggleButton);
        context.ui().togglePanes(!_pane.classed('shown') ? _pane : undefined);
    };


    uiTasking.renderToggleButton = function(selection) {

        _toggleButton = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', uiTasking.togglePane)
            .call(svgIcon('#iD-icon-tasking', 'light'))
            .call(paneTooltip);
    };


    uiTasking.renderPane = function(selection) {

        _pane = selection
            .append('div')
            .attr('class', 'fillL map-pane tasking-pane hide')
            .attr('pane', 'tasking');


        var heading = _pane
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text(t('tasking.title'));

        heading
            .append('button')
            .on('click', hidePane)
            .call(svgIcon('#iD-icon-close'));


        var content = _pane
            .append('div')
            .attr('class', 'pane-content');

        // manager list
        content
            .append('div')
            .attr('class', 'tasking-manager-list-container')
            .call(uiDisclosure(context, 'managers_list', true)
                .title(t('tasking.managers.name'))
                .content(renderManagersList)
            );


        // // add listeners
        // context.map()
        //     .on('move.background-update',
        //         _debounce(function() { window.requestIdleCallback(update); }, 1000)
        //     );


        // context.background()
        //     .on('change.background-update', update);


        update();

        context.keybinding()
            .on(key, uiTasking.togglePane);
    };

    return uiTasking;
}