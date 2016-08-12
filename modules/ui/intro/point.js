import { rebind } from '../../util/rebind';
import * as d3 from 'd3';
import { t } from '../../util/locale';
import { icon, pad } from './helper';

export function point(context, reveal) {
    var event = d3.dispatch('done'),
        timeouts = [];

    var step = {
        title: 'intro.points.title'
    };

    function setTimeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }

    function eventCancel() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }

    step.enter = function() {
        context.map().centerZoom([-85.63279, 41.94394], 19);
        reveal('button.add-point',
            t('intro.points.add', { button: icon('#icon-point', 'pre-text') }),
            { tooltipClass: 'intro-points-add' });

        var corner = [-85.632481,41.944094];

        context.on('enter.intro', addPoint);

        function addPoint(mode) {
            if (mode.id !== 'add-point') return;
            context.on('enter.intro', enterSelect);

            var pointBox = pad(corner, 150, context);
            reveal(pointBox, t('intro.points.place'));

            context.map().on('move.intro', function() {
                pointBox = pad(corner, 150, context);
                reveal(pointBox, t('intro.points.place'), {duration: 0});
            });
        }

        function enterSelect(mode) {
            if (mode.id !== 'select') return;
            context.map().on('move.intro', null);
            context.on('enter.intro', null);

            setTimeout(function() {
                reveal('.preset-search-input',
                    t('intro.points.search', {name: context.presets().item('amenity/cafe').name()}));
                d3.select('.preset-search-input').on('keyup.intro', keySearch);
            }, 500);
        }

        function keySearch() {
            var first = d3.select('.preset-list-item:first-child');
            if (first.classed('preset-amenity-cafe')) {
                reveal(first.select('.preset-list-button').node(), t('intro.points.choose'));
                d3.selection.prototype.one.call(context.history(), 'change.intro', selectedPreset);
                d3.select('.preset-search-input')
                    .on('keydown.intro', eventCancel, true)
                    .on('keyup.intro', null);
            }
        }

        function selectedPreset() {
            setTimeout(function() {
                reveal('.entity-editor-pane', t('intro.points.describe'), {tooltipClass: 'intro-points-describe'});
                context.history().on('change.intro', closeEditor);
                context.on('exit.intro', selectPoint);
            }, 400);
        }

        function closeEditor() {
            d3.select('.preset-search-input').on('keydown.intro', null);
            context.history().on('change.intro', null);
            reveal('.entity-editor-pane',
                t('intro.points.close', { button: icon('#icon-apply', 'pre-text') }));
        }

        function selectPoint() {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            context.on('enter.intro', enterReselect);

            var pointBox = pad(corner, 150, context);
            reveal(pointBox, t('intro.points.reselect'));

            context.map().on('move.intro', function() {
                pointBox = pad(corner, 150, context);
                reveal(pointBox, t('intro.points.reselect'), {duration: 0});
            });
        }

        function enterReselect(mode) {
            if (mode.id !== 'select') return;
            context.map().on('move.intro', null);
            context.on('enter.intro', null);

            setTimeout(function() {
                reveal('.entity-editor-pane',
                    t('intro.points.fixname', { button: icon('#icon-apply', 'pre-text') }));
                context.on('exit.intro', deletePoint);
            }, 500);
        }

        function deletePoint() {
            context.on('exit.intro', null);
            context.on('enter.intro', enterDelete);

            var pointBox = pad(corner, 150, context);
            reveal(pointBox, t('intro.points.reselect_delete'));

            context.map().on('move.intro', function() {
                pointBox = pad(corner, 150, context);
                reveal(pointBox, t('intro.points.reselect_delete'), {duration: 0});
            });
        }

        function enterDelete(mode) {
            if (mode.id !== 'select') return;
            context.map().on('move.intro', null);
            context.on('enter.intro', null);
            context.on('exit.intro', deletePoint);
            context.map().on('move.intro', deletePoint);
            context.history().on('change.intro', deleted);

            setTimeout(function() {
                var node = d3.select('.radial-menu-item-delete').node();
                var pointBox = pad(node.getBoundingClientRect(), 50, context);
                reveal(pointBox,
                    t('intro.points.delete', { button: icon('#operation-delete', 'pre-text') }));
            }, 300);
        }

        function deleted(changed) {
            if (changed.deleted().length) event.call("done");
        }

    };

    step.exit = function() {
        timeouts.forEach(window.clearTimeout);
        context.on('exit.intro', null);
        context.on('enter.intro', null);
        context.map().on('move.intro', null);
        context.history().on('change.intro', null);
        d3.select('.preset-search-input')
            .on('keyup.intro', null)
            .on('keydown.intro', null);
    };

    return rebind(step, event, 'on');
}
