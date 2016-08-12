import { rebind } from '../../util/rebind';
import * as d3 from 'd3';
import { t } from '../../util/locale';
import { icon, pad } from './helper';

export function area(context, reveal) {
    var event = d3.dispatch('done'),
        timeout;

    var step = {
        title: 'intro.areas.title'
    };

    step.enter = function() {
        var playground = [-85.63552, 41.94159],
            corner = [-85.63565411045074, 41.9417715536927];
        context.map().centerZoom(playground, 19);
        reveal('button.add-area',
            t('intro.areas.add', { button: icon('#icon-area', 'pre-text') }),
            { tooltipClass: 'intro-areas-add' });

        context.on('enter.intro', addArea);

        function addArea(mode) {
            if (mode.id !== 'add-area') return;
            context.on('enter.intro', drawArea);

            var padding = 120 * Math.pow(2, context.map().zoom() - 19);
            var pointBox = pad(corner, padding, context);
            reveal(pointBox, t('intro.areas.corner'));

            context.map().on('move.intro', function() {
                padding = 120 * Math.pow(2, context.map().zoom() - 19);
                pointBox = pad(corner, padding, context);
                reveal(pointBox, t('intro.areas.corner'), {duration: 0});
            });
        }

        function drawArea(mode) {
            if (mode.id !== 'draw-area') return;
            context.on('enter.intro', enterSelect);

            var padding = 150 * Math.pow(2, context.map().zoom() - 19);
            var pointBox = pad(playground, padding, context);
            reveal(pointBox, t('intro.areas.place'));

            context.map().on('move.intro', function() {
                padding = 150 * Math.pow(2, context.map().zoom() - 19);
                pointBox = pad(playground, padding, context);
                reveal(pointBox, t('intro.areas.place'), {duration: 0});
            });
        }

        function enterSelect(mode) {
            if (mode.id !== 'select') return;
            context.map().on('move.intro', null);
            context.on('enter.intro', null);

            timeout = setTimeout(function() {
                reveal('.preset-search-input',
                    t('intro.areas.search',
                    { name: context.presets().item('leisure/playground').name() }));
                d3.select('.preset-search-input').on('keyup.intro', keySearch);
            }, 500);
        }

        function keySearch() {
            var first = d3.select('.preset-list-item:first-child');
            if (first.classed('preset-leisure-playground')) {
                reveal(first.select('.preset-list-button').node(), t('intro.areas.choose'));
                d3.selection.prototype.one.call(context.history(), 'change.intro', selectedPreset);
                d3.select('.preset-search-input').on('keyup.intro', null);
            }
        }

        function selectedPreset() {
            reveal('.pane',
                t('intro.areas.describe', { button: icon('#icon-apply', 'pre-text') }));
            context.on('exit.intro', event.done);
        }
    };

    step.exit = function() {
        window.clearTimeout(timeout);
        context.on('enter.intro', null);
        context.on('exit.intro', null);
        context.history().on('change.intro', null);
        context.map().on('move.intro', null);
        d3.select('.preset-search-input').on('keyup.intro', null);
    };

    return rebind(step, event, 'on');
}
