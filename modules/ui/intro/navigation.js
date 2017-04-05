import * as d3 from 'd3';
import { t, textDirection } from '../../util/locale';
import { utilRebind } from '../../util/rebind';
import { icon, pointBox } from './helper';


export function uiIntroNavigation(context, reveal) {
    var dispatch = d3.dispatch('done'),
        hallId = 'n2061',
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


    function isTownHallSelected() {
        var ids = context.selectedIDs();
        return ids.length === 1 && ids[0] === hallId;
    }


    function dragMap() {
        var dragged = false,
            rect = context.surfaceRect(),
            box = {
                left: rect.left + (textDirection === 'rtl' ? 60 : 10),
                top: rect.top + 70,
                width: rect.width - 70,
                height: rect.height - 170
            };

        context.map().centerZoom([-85.63591, 41.94285], 19);
        reveal(box, t('intro.navigation.drag'));

        context.map().on('move.intro', function() {
            dragged = true;
        });

        d3.select(window).on('mouseup.intro', function() {
            if (dragged) continueTo(clickTownHall);
        }, true);

        function continueTo(nextStep) {
            context.map().on('move.intro', null);
            d3.select(window).on('mouseup.intro', null, true);
            nextStep();
        }
    }


    function clickTownHall() {
        if (!context.hasEntity(hallId)) {
            context.history().reset('initial');
        }

        var hall = context.entity(hallId);
        context.map().centerEase(hall.loc, 250);

        context.on('enter.intro', function() {
            if (isTownHallSelected()) continueTo(selectedTownHall);
        });

        timeout(function() {
            var box = pointBox(hall.loc, context);
            reveal(box, t('intro.navigation.select'));

            context.map().on('move.intro drawn.intro', function() {
                var box = pointBox(hall.loc, context);
                reveal(box, t('intro.navigation.select'), { duration: 0 });
            });
        }, 260); // after centerEase

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function selectedTownHall() {
        if (!isTownHallSelected()) return clickTownHall();

        var hall = context.entity(hallId);
        var box = pointBox(hall.loc, context);
        var advance = function() { continueTo(inspectTownHall); };

        reveal(box, t('intro.navigation.selected'),
            { buttonText: t('intro.ok'), buttonCallback: advance }
        );

        context.map().on('move.intro drawn.intro', function() {
            var box = pointBox(hall.loc, context);
            reveal(box, t('intro.navigation.selected'),
                { duration: 0, buttonText: t('intro.ok'), buttonCallback: advance }
            );
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function inspectTownHall() {
        if (!isTownHallSelected()) return clickTownHall();

        context.on('exit.intro', function() {
            continueTo(streetSearch);
        });

        timeout(function() {
            reveal('.entity-editor-pane',
                t('intro.navigation.pane', { button: icon('#icon-close', 'pre-text') })
            );
        }, 700);

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function streetSearch() {
        context.history().reset('initial');  // ensure spring street exists

        reveal('.search-header input',
            t('intro.navigation.search', { name: t('intro.graph.spring_st') }));

        d3.select('.search-header input')
            .on('keyup.intro', checkSearchResult);
    }


    function checkSearchResult() {
        var first = d3.select('.feature-list-item:nth-child(0n+2)'),  // skip "No Results" item
            firstName = first.select('.entity-name'),
            name = t('intro.graph.spring_st');

        if (!firstName.empty() && firstName.text() === name) {
            reveal(first.node(), t('intro.navigation.choose', { name: name }));

            context.on('exit.intro', function() {
                continueTo(selectedStreet);
            });

            d3.select('.search-header input')
                .on('keydown.intro', eventCancel, true)
                .on('keyup.intro', null);
        }

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function selectedStreet() {
        var springSt = [-85.63585099140167, 41.942506848938926];
        context.map().centerEase(springSt);

        timeout(function() {
            reveal('.entity-editor-pane',
                t('intro.navigation.chosen', {
                    name: t('intro.graph.spring_st'),
                    button: icon('#icon-close', 'pre-text')
                })
            );
            context.on('exit.intro', function() {
                continueTo(play);
            });
        }, 400);

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function play() {
        dispatch.call('done');
        reveal('.intro-nav-wrap .chapter-point',
            t('intro.navigation.play', { next: t('intro.points.title') }), {
                buttonText: t('intro.ok'),
                buttonCallback: function() { reveal('#id-container'); }
            }
        );
    }


    chapter.enter = function() {
        context.history().reset('initial');
        dragMap();
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
