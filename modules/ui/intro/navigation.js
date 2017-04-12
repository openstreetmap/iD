import * as d3 from 'd3';
import { t, textDirection } from '../../util/locale';
import { utilRebind } from '../../util/rebind';
import { icon, pointBox, transitionTime } from './helper';


export function uiIntroNavigation(context, reveal) {
    var dispatch = d3.dispatch('done'),
        timeouts = [],
        hallId = 'n2061',
        townHall = [-85.63591, 41.94285],
        springStreet = [-85.63585099140167, 41.942506848938926];


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


    function trimmedMap() {
        var rect = d3.select('#map').node().getBoundingClientRect();
        return {
            left: rect.left + (textDirection === 'rtl' ? 60 : 10),
            top: rect.top + 70,
            width: rect.width - 60,
            height: rect.height - 170
        };
    }


    function dragMap() {
        context.history().reset('initial');

        var msec = transitionTime(townHall, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().zoom(19).centerEase(townHall, msec);

        timeout(function() {
            var dragged = false;

            reveal(trimmedMap(), t('intro.navigation.drag'));

            context.map().on('drawn.intro', function() {
                reveal(trimmedMap(), t('intro.navigation.drag'), { duration: 0 });
            });

            context.map().on('move.intro', function() {
                dragged = true;
            });

            d3.select(window).on('mouseup.intro', function() {
                if (dragged) continueTo(clickTownHall);
            }, true);

        }, msec + 100 );

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            d3.select(window).on('mouseup.intro', null, true);
            nextStep();
        }
    }


    function clickTownHall() {
        if (!context.hasEntity(hallId)) {
            context.history().reset('initial');
        }

        var hall = context.entity(hallId);
        context.map().centerEase(hall.loc, 600);

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
        }, 700); // after centerEase

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

        reveal('.entity-editor-pane',
            t('intro.navigation.pane', { button: icon('#icon-close', 'pre-text') })
        );

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function streetSearch() {
        context.history().reset('initial');  // ensure spring street exists

        reveal('.search-header input',
            t('intro.navigation.search', { name: t('intro.graph.name.spring-street') })
        );

        d3.select('.search-header input')
            .on('keyup.intro', checkSearchResult);
    }


    function checkSearchResult() {
        var first = d3.select('.feature-list-item:nth-child(0n+2)'),  // skip "No Results" item
            firstName = first.select('.entity-name'),
            name = t('intro.graph.name.spring-street');

        if (!firstName.empty() && firstName.text() === name) {
            reveal(first.node(),
                t('intro.navigation.choose', { name: name }),
                { duration: 300 }
            );

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
        context.map().centerEase(springStreet);

        timeout(function() {
            reveal('.entity-editor-pane',
                t('intro.navigation.chosen', {
                    name: t('intro.graph.name.spring-street'),
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
        reveal('.intro-nav-wrap .chapter-point',
            t('intro.navigation.play', { next: t('intro.points.title') }), {
                buttonText: t('intro.ok'),
                buttonCallback: function() {
                    dispatch.call('done');
                    reveal('#id-container');
                }
            }
        );
    }


    chapter.enter = function() {
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
