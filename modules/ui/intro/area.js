import * as d3 from 'd3';
import { t } from '../../util/locale';
import { utilRebind } from '../../util/rebind';
import { utilBindOnce } from '../../util/bind_once';
import { icon, pad } from './helper';


export function uiIntroArea(context, reveal) {
    var dispatch = d3.dispatch('done'),
        playground = [-85.63552, 41.94159],
        corner = [-85.63565411045074, 41.9417715536927],
        timeouts = [];


    var chapter = {
        title: 'intro.areas.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function addArea() {
        var tooltip = reveal('button.add-area',
            t('intro.areas.add', { button: icon('#icon-area', 'pre-text') }));

        tooltip.selectAll('.tooltip-inner')
            .insert('svg', 'span')
            .attr('class', 'tooltip-illustration')
            .append('use')
            .attr('xlink:href', '#landuse-images');

        context.on('enter.intro', startArea);
    }


    function startArea(mode) {
        if (mode.id !== 'add-area') return;
        context.on('enter.intro', drawArea);

        var padding = 120 * Math.pow(2, context.map().zoom() - 19);
        var pointBox = pad(corner, padding, context);
        reveal(pointBox, t('intro.areas.corner'));

        context.map().on('move.intro drawn.intro', function() {
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

        context.map().on('move.intro drawn.intro', function() {
            padding = 150 * Math.pow(2, context.map().zoom() - 19);
            pointBox = pad(playground, padding, context);
            reveal(pointBox, t('intro.areas.place'), {duration: 0});
        });
    }


    function enterSelect(mode) {
        if (mode.id !== 'select') return;
        context.map().on('move.intro drawn.intro', null);
        context.on('enter.intro', null);

        timeout(function() {
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
            utilBindOnce(context.history(), 'change.intro', selectedPreset);
            d3.select('.preset-search-input').on('keyup.intro', null);
        }
    }


    function selectedPreset() {
        reveal('.pane',
            t('intro.areas.describe', { button: icon('#icon-apply', 'pre-text') }));

        context.on('exit.intro', function() {
            advance();
        });

        function advance() {
            context.on('exit.intro', null);
            play();
        }
    }


    function play() {
        reveal('.intro-nav-wrap .chapter-line',
            t('intro.area.play', { next: t('intro.line.title') }), {
                buttonText: t('intro.ok'),
                buttonCallback: function() {
                    dispatch.call('done');
                    reveal('#id-container');
                }
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
        context.history().on('change.intro', null);
        context.map().on('move.intro drawn.intro', null);
        d3.select('.preset-search-input').on('keyup.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
