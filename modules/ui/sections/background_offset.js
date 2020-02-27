import {
    event as d3_event,
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import { t, textDirection } from '../../util/locale';
import { geoMetersToOffset, geoOffsetToMeters } from '../../geo';
import { svgIcon } from '../../svg/icon';
import { uiSection } from '../section';


export function uiSectionBackgroundOffset(context) {

    var section = uiSection('background-offset', context)
        .title(t('background.fix_misalignment'))
        .disclosureContent(renderDisclosureContent)
        .expandedByDefault(false);

    var _directions = [
        ['right', [0.5, 0]],
        ['top', [0, -0.5]],
        ['left', [-0.5, 0]],
        ['bottom', [0, 0.5]]
    ];


    function d3_eventCancel() {
        d3_event.stopPropagation();
        d3_event.preventDefault();
    }


    function updateValue() {
        var meters = geoOffsetToMeters(context.background().offset());
        var x = +meters[0].toFixed(2);
        var y = +meters[1].toFixed(2);

        d3_selectAll('.nudge-inner-rect')
            .select('input')
            .classed('error', false)
            .property('value', x + ', ' + y);

        d3_selectAll('.nudge-reset')
            .classed('disabled', function() {
                return (x === 0 && y === 0);
            });
    }


    function resetOffset() {
        context.background().offset([0, 0]);
        updateValue();
    }


    function nudge(d) {
        context.background().nudge(d, context.map().zoom());
        updateValue();
    }


    function clickNudgeButton(d) {
        var interval;
        var timeout = window.setTimeout(function() {
                interval = window.setInterval(nudge.bind(null, d), 100);
            }, 500);

        function doneNudge() {
            window.clearTimeout(timeout);
            window.clearInterval(interval);
            d3_select(window)
                .on('mouseup.buttonoffset', null, true)
                .on('mousedown.buttonoffset', null, true);
        }

        d3_select(window)
            .on('mouseup.buttonoffset', doneNudge, true)
            .on('mousedown.buttonoffset', doneNudge, true);

        nudge(d);
    }


    function inputOffset() {
        var input = d3_select(this);
        var d = input.node().value;

        if (d === '') return resetOffset();

        d = d.replace(/;/g, ',').split(',').map(function(n) {
            // if n is NaN, it will always get mapped to false.
            return !isNaN(n) && n;
        });

        if (d.length !== 2 || !d[0] || !d[1]) {
            input.classed('error', true);
            return;
        }

        context.background().offset(geoMetersToOffset(d));
        updateValue();
    }


    function dragOffset() {
        if (d3_event.button !== 0) return;

        var origin = [d3_event.clientX, d3_event.clientY];

        context.container()
            .append('div')
            .attr('class', 'nudge-surface');

        d3_select(window)
            .on('mousemove.offset', function() {
                var latest = [d3_event.clientX, d3_event.clientY];
                var d = [
                    -(origin[0] - latest[0]) / 4,
                    -(origin[1] - latest[1]) / 4
                ];

                origin = latest;
                nudge(d);
            })
            .on('mouseup.offset', function() {
                if (d3_event.button !== 0) return;
                d3_selectAll('.nudge-surface')
                    .remove();

                d3_select(window)
                    .on('mousemove.offset', null)
                    .on('mouseup.offset', null);
            });
    }


    function renderDisclosureContent(selection) {
        var container = selection.selectAll('.nudge-container')
            .data([0]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'nudge-container cf');

        containerEnter
            .append('div')
            .attr('class', 'nudge-instructions')
            .text(t('background.offset'));

        var nudgeEnter = containerEnter
            .append('div')
            .attr('class', 'nudge-outer-rect')
            .on('mousedown', dragOffset);

        nudgeEnter
            .append('div')
            .attr('class', 'nudge-inner-rect')
            .append('input')
            .on('change', inputOffset);

        containerEnter
            .append('div')
            .selectAll('button')
            .data(_directions).enter()
            .append('button')
            .attr('class', function(d) { return d[0] + ' nudge'; })
            .on('contextmenu', d3_eventCancel)
            .on('mousedown', function(d) {
                if (d3_event.button !== 0) return;
                clickNudgeButton(d[1]);
            });

        containerEnter
            .append('button')
            .attr('title', t('background.reset'))
            .attr('class', 'nudge-reset disabled')
            .on('contextmenu', d3_eventCancel)
            .on('click', function() {
                if (d3_event.button !== 0) return;
                resetOffset();
            })
            .call(svgIcon('#iD-icon-' + (textDirection === 'rtl' ? 'redo' : 'undo')));

        updateValue();
    }

    context.background()
        .on('change.backgroundOffset-update', updateValue);

    return section;
}
