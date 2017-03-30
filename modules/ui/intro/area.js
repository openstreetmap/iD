import * as d3 from 'd3';
import { t } from '../../util/locale';
import { utilRebind } from '../../util/rebind';
import { icon, pad } from './helper';


export function uiIntroArea(context, reveal) {
    var dispatch = d3.dispatch('done'),
        playground = [-85.63552, 41.94159],
        timeouts = [];


    var chapter = {
        title: 'intro.areas.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }


    function addArea() {
        var tooltip = reveal('button.add-area',
            t('intro.areas.add', { button: icon('#icon-area', 'pre-text') }));

        tooltip.selectAll('.tooltip-inner')
            .insert('svg', 'span')
            .attr('class', 'tooltip-illustration')
            .append('use')
            .attr('xlink:href', '#landuse-images');

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'add-area') return;
            continueTo(startArea);
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function startArea() {
        if (context.mode().id !== 'add-area') {
            return chapter.restart();
        }

        var padding = 120 * Math.pow(2, context.map().zoom() - 19);
        var box = pad(playground, padding, context);
        reveal(box, t('intro.areas.corner'));

        context.map().on('move.intro drawn.intro', function() {
            padding = 120 * Math.pow(2, context.map().zoom() - 19);
            box = pad(playground, padding, context);
            reveal(box, t('intro.areas.corner'), { duration: 0 });
        });

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'draw-area') return chapter.restart();
            continueTo(drawArea);
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function drawArea() {
        if (context.mode().id !== 'draw-area') {
            return chapter.restart();
        }

        var padding = 150 * Math.pow(2, context.map().zoom() - 19);
        var box = pad(playground, padding, context);
        reveal(box, t('intro.areas.place'));

        context.map().on('move.intro drawn.intro', function() {
            padding = 150 * Math.pow(2, context.map().zoom() - 19);
            box = pad(playground, padding, context);
            reveal(box, t('intro.areas.place'), {duration: 0});
        });

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-area')
                return;
            else if (mode.id === 'select')
                return continueTo(enterSelect);
            else
                return chapter.restart();
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function enterSelect() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        d3.select('.preset-search-input')
            .on('keyup.intro', checkPresetSearch);

        timeout(function() {
            reveal('.preset-search-input',
                t('intro.areas.search',
                { name: context.presets().item('leisure/playground').name() })
            );
        }, 500);
    }


    function checkPresetSearch() {
        var first = d3.select('.preset-list-item:first-child');

        if (first.classed('preset-leisure-playground')) {
            reveal(first.select('.preset-list-button').node(),
                t('intro.areas.choose')
            );

            d3.select('.preset-search-input')
                .on('keydown.intro', eventCancel, true)
                .on('keyup.intro', null);

            context.history().on('change.intro', function() {
                continueTo(selectedPreset);
            });
        }

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            d3.select('.preset-search-input').on('keydown.intro', null);
            nextStep();
        }
    }


    function selectedPreset() {
        context.on('exit.intro', function() {
            continueTo(play);
        });

        reveal('.pane',
            t('intro.areas.describe', { button: icon('#icon-apply', 'pre-text') })
        );

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function play() {
        dispatch.call('done');
        reveal('.intro-nav-wrap .chapter-line',
            t('intro.areas.play', { next: t('intro.lines.title') }), {
                buttonText: t('intro.ok'),
                buttonCallback: function() { reveal('#id-container'); }
            }
        );
    }


    chapter.enter = function() {
        context.history().reset('initial');
        context.map().zoom(19).centerEase(playground);
        addArea();
    };


    chapter.exit = function() {
        timeouts.forEach(window.clearTimeout);
        context.on('enter.intro', null);
        context.on('exit.intro', null);
        context.map().on('move.intro drawn.intro', null);
        context.history().on('change.intro', null);
        d3.select('.preset-search-input').on('keydown.intro keyup.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
