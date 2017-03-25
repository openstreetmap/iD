import * as d3 from 'd3';
import { t, textDirection } from '../../util/locale';
import { utilRebind } from '../../util/rebind';
import { icon, pointBox } from './helper';


export function uiIntroNavigation(context, reveal) {
    var dispatch = d3.dispatch('done'),
        timeouts = [];


    var chapter = {
        title: 'intro.navigation.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }


    function welcome() {
        reveal('.intro-nav-wrap', 'This walkthrough will teach you the basics of editing on OpenStreetMap.');
        timeout(function() {
            dragMap();
        }, 5000);
    }


    function dragMap() {
        var dragged = false,
            rect = context.surfaceRect(),
            map = {
                left: rect.left + (textDirection === 'rtl' ? 60 : 10),
                top: rect.top + 70,
                width: rect.width - 70,
                height: rect.height - 170
            };

        context.map().centerZoom([-85.63591, 41.94285], 19);
        reveal(map, t('intro.navigation.drag'));

        context.map().on('move.intro', function() {
            dragged = true;
        });

        d3.select(window).on('mouseup.intro', function() {
            if (!dragged) return;
            d3.select(window).on('mouseup.intro', null, true);
            context.map().on('move.intro', null);
            clickTownHall();
        }, true);
    }


    function clickTownHall() {
        context.history().reset('initial');  // ensure townhall exists
        var hall = context.entity('n2140018997');

        context.on('enter.intro', inspectTownHall);
        context.map().centerEase(hall.loc, 250);

        timeout(function() {
            var box = pointBox(hall.loc, context);
            reveal(box, t('intro.navigation.select'));
            context.map().on('move.intro drawn.intro', function() {
                var box = pointBox(hall.loc, context);
                reveal(box, t('intro.navigation.select'), { duration: 0 });
            });
        }, 260);
    }


    function inspectTownHall(mode) {
        if (mode.id !== 'select') return;

        context.on('enter.intro', null);
        context.map().on('move.intro drawn.intro', null);
        context.on('exit.intro', streetSearch);

        timeout(function() {
            reveal('.entity-editor-pane',
                t('intro.navigation.pane', { button: icon('#icon-close', 'pre-text') })
            );
        }, 700);
    }


    function streetSearch() {
        context.history().reset('initial');  // ensure spring street exists
        context.on('exit.intro', null);
        reveal('.search-header input',
            t('intro.navigation.search', { name: t('intro.graph.spring_st') }));
        d3.select('.search-header input')
            .on('keyup.intro', searchResult);
    }


    function searchResult() {
        var first = d3.select('.feature-list-item:nth-child(0n+2)'),  // skip No Results item
            firstName = first.select('.entity-name'),
            name = t('intro.graph.spring_st');

        if (!firstName.empty() && firstName.text() === name) {
            reveal(first.node(), t('intro.navigation.choose', { name: name }));
            context.on('exit.intro', selectedStreet);
            d3.select('.search-header input')
                .on('keydown.intro', eventCancel, true)
                .on('keyup.intro', null);
        }
    }


    function selectedStreet() {
        var springSt = [-85.63585099140167, 41.942506848938926];
        context.map().centerEase(springSt);
        context.on('exit.intro', function() {
            dispatch.call('done');
        });

        timeout(function() {
            reveal('.entity-editor-pane',
                t('intro.navigation.chosen', {
                    name: t('intro.graph.spring_st'),
                    button: icon('#icon-close', 'pre-text')
                })
            );
        }, 400);
    }


    chapter.enter = function() {
        context.history().reset('initial');
        welcome();
    };


    chapter.exit = function() {
        timeouts.forEach(window.clearTimeout);
        d3.select(window).on('mouseup.intro', null, true);
        context.map().on('move.intro drawn.intro', null);
        context.on('enter.intro', null);
        context.on('exit.intro', null);
        d3.select('.search-header input')
            .on('keydown.intro', null)
            .on('keyup.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
