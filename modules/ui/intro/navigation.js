import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select
} from 'd3-selection';

import { presetManager } from '../../presets';
import { t } from '../../core/localizer';
import { modeBrowse } from '../../modes/browse';
import { modeSelect } from '../../modes/select';
import { utilRebind } from '../../util/rebind';
import { helpHtml, icon, pointBox, transitionTime } from './helper';


export function uiIntroNavigation(context, reveal) {
    const dispatch = d3_dispatch('done');
    const timeouts = [];
    const hallId = 'n2061';
    const townHall = [-85.63591, 41.94285];
    const springStreetId = 'w397';
    const springStreetEndId = 'n1834';
    const springStreet = [-85.63582, 41.94255];
    const onewayField = presetManager.field('oneway');
    const maxspeedField = presetManager.field('maxspeed');


    const chapter = {
        title: 'intro.navigation.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel(d3_event) {
        d3_event.stopPropagation();
        d3_event.preventDefault();
    }


    function isTownHallSelected() {
        const ids = context.selectedIDs();
        return ids.length === 1 && ids[0] === hallId;
    }


    function dragMap() {
        context.enter(modeBrowse(context));
        context.history().reset('initial');

        const msec = transitionTime(townHall, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().centerZoomEase(townHall, 19, msec);

        timeout(function() {
            const centerStart = context.map().center();

            const textId = context.lastPointerType() === 'mouse' ? 'drag' : 'drag_touch';
            const dragString = helpHtml('intro.navigation.map_info') + '{br}' + helpHtml('intro.navigation.' + textId);
            reveal('.main-map .surface', dragString);
            context.map().on('drawn.intro', function() {
                reveal('.main-map .surface', dragString, { duration: 0 });
            });

            context.map().on('move.intro', function() {
                const centerNow = context.map().center();
                if (centerStart[0] !== centerNow[0] || centerStart[1] !== centerNow[1]) {
                    context.map().on('move.intro', null);
                    timeout(function() { continueTo(zoomMap); }, 3000);
                }
            });

        }, msec + 100);

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function zoomMap() {
        const zoomStart = context.map().zoom();

        const textId = context.lastPointerType() === 'mouse' ? 'zoom' : 'zoom_touch';
        const zoomString = helpHtml('intro.navigation.' + textId);

        reveal('.main-map .surface', zoomString);

        context.map().on('drawn.intro', function() {
            reveal('.main-map .surface', zoomString, { duration: 0 });
        });

        context.map().on('move.intro', function() {
            if (context.map().zoom() !== zoomStart) {
                context.map().on('move.intro', null);
                timeout(function() { continueTo(features); }, 3000);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function features() {
        const onClick = function() { continueTo(pointsLinesAreas); };

        reveal('.main-map .surface', helpHtml('intro.navigation.features'),
            { buttonText: t.html('intro.ok'), buttonCallback: onClick }
        );

        context.map().on('drawn.intro', function() {
            reveal('.main-map .surface', helpHtml('intro.navigation.features'),
                { duration: 0, buttonText: t.html('intro.ok'), buttonCallback: onClick }
            );
        });

        function continueTo(nextStep) {
            context.map().on('drawn.intro', null);
            nextStep();
        }
    }

    function pointsLinesAreas() {
        const onClick = function() { continueTo(nodesWays); };

        reveal('.main-map .surface', helpHtml('intro.navigation.points_lines_areas'),
            { buttonText: t.html('intro.ok'), buttonCallback: onClick }
        );

        context.map().on('drawn.intro', function() {
            reveal('.main-map .surface', helpHtml('intro.navigation.points_lines_areas'),
                { duration: 0, buttonText: t.html('intro.ok'), buttonCallback: onClick }
            );
        });

        function continueTo(nextStep) {
            context.map().on('drawn.intro', null);
            nextStep();
        }
    }

    function nodesWays() {
        const onClick = function() { continueTo(clickTownHall); };

        reveal('.main-map .surface', helpHtml('intro.navigation.nodes_ways'),
            { buttonText: t.html('intro.ok'), buttonCallback: onClick }
        );

        context.map().on('drawn.intro', function() {
            reveal('.main-map .surface', helpHtml('intro.navigation.nodes_ways'),
                { duration: 0, buttonText: t.html('intro.ok'), buttonCallback: onClick }
            );
        });

        function continueTo(nextStep) {
            context.map().on('drawn.intro', null);
            nextStep();
        }
    }

    function clickTownHall() {
        context.enter(modeBrowse(context));
        context.history().reset('initial');

        const entity = context.hasEntity(hallId);
        if (!entity) return;
        reveal(null, null, { duration: 0 });
        context.map().centerZoomEase(entity.loc, 19, 500);

        timeout(function() {
            const entity = context.hasEntity(hallId);
            if (!entity) return;
            const box = pointBox(entity.loc, context);
            const textId = context.lastPointerType() === 'mouse' ? 'click_townhall' : 'tap_townhall';
            reveal(box, helpHtml('intro.navigation.' + textId));

            context.map().on('move.intro drawn.intro', function() {
                const entity = context.hasEntity(hallId);
                if (!entity) return;
                const box = pointBox(entity.loc, context);
                reveal(box, helpHtml('intro.navigation.' + textId), { duration: 0 });
            });

            context.on('enter.intro', function() {
                if (isTownHallSelected()) continueTo(selectedTownHall);
            });

        }, 550);  // after centerZoomEase

        context.history().on('change.intro', function() {
            if (!context.hasEntity(hallId)) {
                continueTo(clickTownHall);
            }
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function selectedTownHall() {
        if (!isTownHallSelected()) return clickTownHall();

        const entity = context.hasEntity(hallId);
        if (!entity) return clickTownHall();

        const box = pointBox(entity.loc, context);
        const onClick = function() { continueTo(editorTownHall); };

        reveal(box, helpHtml('intro.navigation.selected_townhall'),
            { buttonText: t.html('intro.ok'), buttonCallback: onClick }
        );

        context.map().on('move.intro drawn.intro', function() {
            const entity = context.hasEntity(hallId);
            if (!entity) return;
            const box = pointBox(entity.loc, context);
            reveal(box, helpHtml('intro.navigation.selected_townhall'),
                { duration: 0, buttonText: t.html('intro.ok'), buttonCallback: onClick }
            );
        });

        context.history().on('change.intro', function() {
            if (!context.hasEntity(hallId)) {
                continueTo(clickTownHall);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function editorTownHall() {
        if (!isTownHallSelected()) return clickTownHall();

        // disallow scrolling
        context.container().select('.inspector-wrap').on('wheel.intro', eventCancel);

        const onClick = function() { continueTo(presetTownHall); };

        reveal('.entity-editor-pane',
            helpHtml('intro.navigation.editor_townhall'),
            { buttonText: t.html('intro.ok'), buttonCallback: onClick }
        );

        context.on('exit.intro', function() {
            continueTo(clickTownHall);
        });

        context.history().on('change.intro', function() {
            if (!context.hasEntity(hallId)) {
                continueTo(clickTownHall);
            }
        });

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            context.container().select('.inspector-wrap').on('wheel.intro', null);
            nextStep();
        }
    }


    function presetTownHall() {
        if (!isTownHallSelected()) return clickTownHall();

        // reset pane, in case user happened to change it..
        context.container().select('.inspector-wrap .panewrap').style('right', '0%');
        // disallow scrolling
        context.container().select('.inspector-wrap').on('wheel.intro', eventCancel);

        // preset match, in case the user happened to change it.
        const entity = context.entity(context.selectedIDs()[0]);
        const preset = presetManager.match(entity, context.graph());

        const onClick = function() { continueTo(fieldsTownHall); };

        reveal('.entity-editor-pane .section-feature-type',
            helpHtml('intro.navigation.preset_townhall', { preset: preset.name() }),
            { buttonText: t.html('intro.ok'), buttonCallback: onClick }
        );

        context.on('exit.intro', function() {
            continueTo(clickTownHall);
        });

        context.history().on('change.intro', function() {
            if (!context.hasEntity(hallId)) {
                continueTo(clickTownHall);
            }
        });

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            context.container().select('.inspector-wrap').on('wheel.intro', null);
            nextStep();
        }
    }


    function fieldsTownHall() {
        if (!isTownHallSelected()) return clickTownHall();

        // reset pane, in case user happened to change it..
        context.container().select('.inspector-wrap .panewrap').style('right', '0%');
        // disallow scrolling
        context.container().select('.inspector-wrap').on('wheel.intro', eventCancel);

        const onClick = function() { continueTo(closeTownHall); };

        reveal('.entity-editor-pane .section-preset-fields',
            helpHtml('intro.navigation.fields_townhall'),
            { buttonText: t.html('intro.ok'), buttonCallback: onClick }
        );

        context.on('exit.intro', function() {
            continueTo(clickTownHall);
        });

        context.history().on('change.intro', function() {
            if (!context.hasEntity(hallId)) {
                continueTo(clickTownHall);
            }
        });

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            context.container().select('.inspector-wrap').on('wheel.intro', null);
            nextStep();
        }
    }


    function closeTownHall() {
        if (!isTownHallSelected()) return clickTownHall();

        const selector = '.entity-editor-pane button.close svg use';
        const href = d3_select(selector).attr('href') || '#iD-icon-close';

        reveal('.entity-editor-pane',
            helpHtml('intro.navigation.close_townhall', { button: { html: icon(href, 'inline') } })
        );

        context.on('exit.intro', function() {
            continueTo(searchStreet);
        });

        context.history().on('change.intro', function() {
            // update the close icon in the tooltip if the user edits something.
            const selector = '.entity-editor-pane button.close svg use';
            const href = d3_select(selector).attr('href') || '#iD-icon-close';

            reveal('.entity-editor-pane',
                helpHtml('intro.navigation.close_townhall', { button: { html: icon(href, 'inline') } }),
                { duration: 0 }
            );
        });

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function searchStreet() {
        context.enter(modeBrowse(context));
        context.history().reset('initial');  // ensure spring street exists

        const msec = transitionTime(springStreet, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().centerZoomEase(springStreet, 19, msec);  // ..and user can see it

        timeout(function() {
            reveal('.search-header input',
                helpHtml('intro.navigation.search_street', { name: t('intro.graph.name.spring-street') })
            );

            context.container().select('.search-header input')
                .on('keyup.intro', checkSearchResult);
        }, msec + 100);
    }


    function checkSearchResult() {
        const first = context.container().select('.feature-list-item:nth-child(0n+2)');  // skip "No Results" item
        const firstName = first.select('.entity-name');
        const name = t('intro.graph.name.spring-street');

        if (!firstName.empty() && firstName.html() === name) {
            reveal(first.node(),
                helpHtml('intro.navigation.choose_street', { name: name }),
                { duration: 300 }
            );

            context.on('exit.intro', function() {
                continueTo(selectedStreet);
            });

            context.container().select('.search-header input')
                .on('keydown.intro', eventCancel, true)
                .on('keyup.intro', null);
        }

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.container().select('.search-header input')
                .on('keydown.intro', null)
                .on('keyup.intro', null);
            nextStep();
        }
    }


    function selectedStreet() {
        if (!context.hasEntity(springStreetEndId) || !context.hasEntity(springStreetId)) {
            return searchStreet();
        }

        const onClick = function() { continueTo(editorStreet); };
        const entity = context.entity(springStreetEndId);
        const box = pointBox(entity.loc, context);
        box.height = 500;

        reveal(box,
            helpHtml('intro.navigation.selected_street', { name: t('intro.graph.name.spring-street') }),
            { duration: 600, buttonText: t.html('intro.ok'), buttonCallback: onClick }
        );

        timeout(function() {
            context.map().on('move.intro drawn.intro', function() {
                const entity = context.hasEntity(springStreetEndId);
                if (!entity) return;
                const box = pointBox(entity.loc, context);
                box.height = 500;
                reveal(box,
                    helpHtml('intro.navigation.selected_street', { name: t('intro.graph.name.spring-street') }),
                    { duration: 0, buttonText: t.html('intro.ok'), buttonCallback: onClick }
                );
            });
        }, 600);  // after reveal.

        context.on('enter.intro', function(mode) {
            if (!context.hasEntity(springStreetId)) {
                return continueTo(searchStreet);
            }
            const ids = context.selectedIDs();
            if (mode.id !== 'select' || !ids.length || ids[0] !== springStreetId) {
                // keep Spring Street selected..
                context.enter(modeSelect(context, [springStreetId]));
            }
        });

        context.history().on('change.intro', function() {
            if (!context.hasEntity(springStreetEndId) || !context.hasEntity(springStreetId)) {
                timeout(function() {
                    continueTo(searchStreet);
                }, 300);  // after any transition (e.g. if user deleted intersection)
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function editorStreet() {
        const selector = '.entity-editor-pane button.close svg use';
        const href = d3_select(selector).attr('href') || '#iD-icon-close';

        reveal('.entity-editor-pane', helpHtml('intro.navigation.street_different_fields') + '{br}' +
            helpHtml('intro.navigation.editor_street', {
                button: { html: icon(href, 'inline') },
                field1: onewayField.title(),
                field2: maxspeedField.title()
            }));

        context.on('exit.intro', function() {
            continueTo(play);
        });

        context.history().on('change.intro', function() {
            // update the close icon in the tooltip if the user edits something.
            const selector = '.entity-editor-pane button.close svg use';
            const href = d3_select(selector).attr('href') || '#iD-icon-close';

            reveal('.entity-editor-pane', helpHtml('intro.navigation.street_different_fields') + '{br}' +
                helpHtml('intro.navigation.editor_street', {
                    button: { html: icon(href, 'inline') },
                    field1: onewayField.title(),
                    field2: maxspeedField.title()
                }), { duration: 0 }
            );
        });

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function play() {
        dispatch.call('done');
        reveal('.ideditor',
            helpHtml('intro.navigation.play', { next: t('intro.points.title') }), {
                tooltipBox: '.intro-nav-wrap .chapter-point',
                buttonText: t.html('intro.ok'),
                buttonCallback: function() { reveal('.ideditor'); }
            }
        );
    }


    chapter.enter = function() {
        dragMap();
    };


    chapter.exit = function() {
        timeouts.forEach(window.clearTimeout);
        context.on('enter.intro exit.intro', null);
        context.map().on('move.intro drawn.intro', null);
        context.history().on('change.intro', null);
        context.container().select('.inspector-wrap').on('wheel.intro', null);
        context.container().select('.search-header input').on('keydown.intro keyup.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
