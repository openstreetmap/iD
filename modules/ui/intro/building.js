import * as d3 from 'd3';
import { t } from '../../util/locale';
import { utilRebind } from '../../util/rebind';
import { icon, pad } from './helper';


export function uiIntroBuilding(context, reveal) {
    var dispatch = d3.dispatch('done'),
        house = [-85.62815, 41.95638],
        tank = [-85.62732, 41.95347],
        timeouts = [];


    var chapter = {
        title: 'intro.buildings.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }


    function addBuilding() {
        var tooltip = reveal('button.add-area',
            t('intro.buildings.add_building', { button: icon('#icon-area', 'pre-text') }));

        // tooltip.selectAll('.tooltip-inner')
        //     .insert('svg', 'span')
        //     .attr('class', 'tooltip-illustration')
        //     .append('use')
        //     .attr('xlink:href', '#landuse-images');

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'add-area') return;
            continueTo(startBuilding);
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function startBuilding() {
        if (context.mode().id !== 'add-area') {
            return chapter.restart();
        }

        context.map().zoomEase(20, 500);

        timeout(function() {
            var padding = 160 * Math.pow(2, context.map().zoom() - 20);
            var box = pad(house, padding, context);
            reveal(box, t('intro.buildings.start_building'));

            context.map().on('move.intro drawn.intro', function() {
                padding = 160 * Math.pow(2, context.map().zoom() - 20);
                box = pad(house, padding, context);
                reveal(box, t('intro.buildings.start_building'), { duration: 0 });
            });

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'draw-area') return chapter.restart();
                continueTo(drawBuilding);
            });

        }, 520);  // after easing

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function drawBuilding() {
        if (context.mode().id !== 'draw-area') {
            return chapter.restart();
        }

        var padding = 160 * Math.pow(2, context.map().zoom() - 20);
        var box = pad(house, padding, context);
        reveal(box, t('intro.buildings.continue_building'));

        context.map().on('move.intro drawn.intro', function() {
            padding = 160 * Math.pow(2, context.map().zoom() - 20);
            box = pad(house, padding, context);
            reveal(box, t('intro.buildings.continue_building'), {duration: 0});
        });

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-area')
                return;
            else if (mode.id === 'select')
                return continueTo(chooseBuildingCategory);
            else
                return chapter.restart();
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function chooseBuildingCategory() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        var button = d3.select('.preset-category-building .preset-list-button');
        if (button.empty()) return chapter.restart();

        timeout(function() {
            reveal(button.node(), t('intro.buildings.choose_building'));
            button.on('click.intro', function() { continueTo(chooseHouse); });
        }, 500);

        function continueTo(nextStep) {
            d3.select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function chooseHouse() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        var button = d3.select('.preset-building-house .preset-list-button');
        if (button.empty()) return chapter.restart();


        timeout(function() {
            reveal(button.node(), t('intro.buildings.choose_house'));
            button.on('click.intro', function() { continueTo(closeEditor); });
        }, 500);

        function continueTo(nextStep) {
            d3.select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function closeEditor() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        context.on('exit.intro', function() {
            continueTo(play);
        });

        timeout(function() {
            reveal('.entity-editor-pane',
                t('intro.buildings.close', { button: icon('#icon-apply', 'pre-text') })
            );
        }, 500);

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function play() {
        dispatch.call('done');
        reveal('.intro-nav-wrap .chapter-startEditing',
            t('intro.buildings.play', { next: t('intro.startediting.title') }), {
                buttonText: t('intro.ok'),
                buttonCallback: function() { reveal('#id-container'); }
            }
        );
    }


    chapter.enter = function() {
        context.history().reset('initial');
        context.map().zoom(19).centerEase(house, 500);
        timeout(addBuilding, 520);
    };


    chapter.exit = function() {
        timeouts.forEach(window.clearTimeout);
        context.on('enter.intro', null);
        context.on('exit.intro', null);
        context.map().on('move.intro drawn.intro', null);
        context.history().on('change.intro', null);
        d3.select('.preset-search-input').on('keydown.intro keyup.intro', null);
        d3.select('.more-fields .combobox-input').on('click.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
