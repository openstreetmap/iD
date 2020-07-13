import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event
} from 'd3-selection';

import { presetManager } from '../../presets';
import { t } from '../../core/localizer';
import { modeBrowse } from '../../modes/browse';
import { modeSelect } from '../../modes/select';
import { utilArrayUniq, utilRebind } from '../../util';
import { helpString, icon, pad, isMostlySquare, selectMenuItem, transitionTime } from './helper';


export function uiIntroBuilding(context, reveal) {
    var dispatch = d3_dispatch('done');
    var house = [-85.62815, 41.95638];
    var tank = [-85.62732, 41.95347];
    var buildingCatetory = presetManager.item('category-building');
    var housePreset = presetManager.item('building/house');
    var tankPreset = presetManager.item('man_made/storage_tank');
    var timeouts = [];
    var _houseID = null;
    var _tankID = null;


    var chapter = {
        title: 'intro.buildings.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel() {
        d3_event.stopPropagation();
        d3_event.preventDefault();
    }


    function revealHouse(center, text, options) {
        var padding = 160 * Math.pow(2, context.map().zoom() - 20);
        var box = pad(center, padding, context);
        reveal(box, text, options);
    }


    function revealTank(center, text, options) {
        var padding = 190 * Math.pow(2, context.map().zoom() - 19.5);
        var box = pad(center, padding, context);
        reveal(box, text, options);
    }


    function addHouse() {
        context.enter(modeBrowse(context));
        context.history().reset('initial');
        _houseID = null;

        var msec = transitionTime(house, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().centerZoomEase(house, 19, msec);

        timeout(function() {
            var tooltip = reveal('button.add-area',
                helpString('intro.buildings.add_building'));

            tooltip.selectAll('.popover-inner')
                .insert('svg', 'span')
                .attr('class', 'tooltip-illustration')
                .append('use')
                .attr('xlink:href', '#iD-graphic-buildings');

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'add-area') return;
                continueTo(startHouse);
            });
        }, msec + 100);

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function startHouse() {
        if (context.mode().id !== 'add-area') {
            return continueTo(addHouse);
        }

        _houseID = null;
        context.map().zoomEase(20, 500);

        timeout(function() {
            var startString = helpString('intro.buildings.start_building') +
                helpString('intro.buildings.building_corner_' + (context.lastPointerType() === 'mouse' ? 'click' : 'tap'));
            revealHouse(house, startString);

            context.map().on('move.intro drawn.intro', function() {
                revealHouse(house, startString, { duration: 0 });
            });

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'draw-area') return chapter.restart();
                continueTo(continueHouse);
            });

        }, 550);  // after easing

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function continueHouse() {
        if (context.mode().id !== 'draw-area') {
            return continueTo(addHouse);
        }

        _houseID = null;

        var continueString = helpString('intro.buildings.continue_building') + '{br}' +
            helpString('intro.areas.finish_area_' + (context.lastPointerType() === 'mouse' ? 'click' : 'tap')) +
            helpString('intro.buildings.finish_building');

        revealHouse(house, continueString);

        context.map().on('move.intro drawn.intro', function() {
            revealHouse(house, continueString, { duration: 0 });
        });

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-area') {
                return;
            } else if (mode.id === 'select') {
                var graph = context.graph();
                var way = context.entity(context.selectedIDs()[0]);
                var nodes = graph.childNodes(way);
                var points = utilArrayUniq(nodes)
                    .map(function(n) { return context.projection(n.loc); });

                if (isMostlySquare(points)) {
                    _houseID = way.id;
                    return continueTo(chooseCategoryBuilding);
                } else {
                    return continueTo(retryHouse);
                }

            } else {
                return chapter.restart();
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function retryHouse() {
        var onClick = function() { continueTo(addHouse); };

        revealHouse(house, helpString('intro.buildings.retry_building'),
            { buttonText: t('intro.ok'), buttonCallback: onClick }
        );

        context.map().on('move.intro drawn.intro', function() {
            revealHouse(house, helpString('intro.buildings.retry_building'),
                { duration: 0, buttonText: t('intro.ok'), buttonCallback: onClick }
            );
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function chooseCategoryBuilding() {
        if (!_houseID || !context.hasEntity(_houseID)) {
            return addHouse();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== _houseID) {
            context.enter(modeSelect(context, [_houseID]));
        }

        // disallow scrolling
        context.container().select('.inspector-wrap').on('wheel.intro', eventCancel);

        timeout(function() {
            // reset pane, in case user somehow happened to change it..
            context.container().select('.inspector-wrap .panewrap').style('right', '-100%');

            var button = context.container().select('.preset-category-building .preset-list-button');

            reveal(button.node(),
                helpString('intro.buildings.choose_category_building', { category: buildingCatetory.name() })
            );

            button.on('click.intro', function() {
                button.on('click.intro', null);
                continueTo(choosePresetHouse);
            });

        }, 400);  // after preset list pane visible..


        context.on('enter.intro', function(mode) {
            if (!_houseID || !context.hasEntity(_houseID)) {
                return continueTo(addHouse);
            }
            var ids = context.selectedIDs();
            if (mode.id !== 'select' || !ids.length || ids[0] !== _houseID) {
                return continueTo(chooseCategoryBuilding);
            }
        });

        function continueTo(nextStep) {
            context.container().select('.inspector-wrap').on('wheel.intro', null);
            context.container().select('.preset-list-button').on('click.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function choosePresetHouse() {
        if (!_houseID || !context.hasEntity(_houseID)) {
            return addHouse();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== _houseID) {
            context.enter(modeSelect(context, [_houseID]));
        }

        // disallow scrolling
        context.container().select('.inspector-wrap').on('wheel.intro', eventCancel);

        timeout(function() {
            // reset pane, in case user somehow happened to change it..
            context.container().select('.inspector-wrap .panewrap').style('right', '-100%');

            var button = context.container().select('.preset-building-house .preset-list-button');

            reveal(button.node(),
                helpString('intro.buildings.choose_preset_house', { preset: housePreset.name() }),
                { duration: 300 }
            );

            button.on('click.intro', function() {
                button.on('click.intro', null);
                continueTo(closeEditorHouse);
            });

        }, 400);  // after preset list pane visible..

        context.on('enter.intro', function(mode) {
            if (!_houseID || !context.hasEntity(_houseID)) {
                return continueTo(addHouse);
            }
            var ids = context.selectedIDs();
            if (mode.id !== 'select' || !ids.length || ids[0] !== _houseID) {
                return continueTo(chooseCategoryBuilding);
            }
        });

        function continueTo(nextStep) {
            context.container().select('.inspector-wrap').on('wheel.intro', null);
            context.container().select('.preset-list-button').on('click.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function closeEditorHouse() {
        if (!_houseID || !context.hasEntity(_houseID)) {
            return addHouse();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== _houseID) {
            context.enter(modeSelect(context, [_houseID]));
        }

        context.history().checkpoint('hasHouse');

        context.on('exit.intro', function() {
            continueTo(rightClickHouse);
        });

        timeout(function() {
            reveal('.entity-editor-pane',
                helpString('intro.buildings.close', { button: icon('#iD-icon-close', 'pre-text') })
            );
        }, 500);

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function rightClickHouse() {
        if (!_houseID) return chapter.restart();

        context.enter(modeBrowse(context));
        context.history().reset('hasHouse');
        var zoom = context.map().zoom();
        if (zoom < 20) {
            zoom = 20;
        }
        context.map().centerZoomEase(house, zoom, 500);

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'select') return;
            var ids = context.selectedIDs();
            if (ids.length !== 1 || ids[0] !== _houseID) return;

            timeout(function() {
                var node = selectMenuItem(context, 'orthogonalize').node();
                if (!node) return;
                continueTo(clickSquare);
            }, 50);  // after menu visible
        });

        context.map().on('move.intro drawn.intro', function() {
            var rightclickString = helpString('intro.buildings.' + (context.lastPointerType() === 'mouse' ? 'rightclick_building' : 'edit_menu_building_touch'));
            revealHouse(house, rightclickString, { duration: 0 });
        });

        context.history().on('change.intro', function() {
            continueTo(rightClickHouse);
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function clickSquare() {
        if (!_houseID) return chapter.restart();
        var entity = context.hasEntity(_houseID);
        if (!entity) return continueTo(rightClickHouse);

        var node = selectMenuItem(context, 'orthogonalize').node();
        if (!node) { return continueTo(rightClickHouse); }

        var wasChanged = false;

        reveal('.edit-menu',
            helpString('intro.buildings.square_building'),
            { padding: 50 }
        );

        context.on('enter.intro', function(mode) {
            if (mode.id === 'browse') {
                continueTo(rightClickHouse);
            } else if (mode.id === 'move' || mode.id === 'rotate') {
                continueTo(retryClickSquare);
            }
        });

        context.map().on('move.intro', function() {
            var node = selectMenuItem(context, 'orthogonalize').node();
            if (!wasChanged && !node) { return continueTo(rightClickHouse); }

            reveal('.edit-menu',
                helpString('intro.buildings.square_building'),
                { duration: 0, padding: 50 }
            );
        });

        context.history().on('change.intro', function() {
            wasChanged = true;
            context.history().on('change.intro', null);

            // Something changed.  Wait for transition to complete and check undo annotation.
            timeout(function() {
                if (context.history().undoAnnotation() === t('operations.orthogonalize.annotation.feature.single')) {
                    continueTo(doneSquare);
                } else {
                    continueTo(retryClickSquare);
                }
            }, 500);  // after transitioned actions
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            context.map().on('move.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function retryClickSquare() {
        context.enter(modeBrowse(context));

        revealHouse(house, helpString('intro.buildings.retry_square'), {
            buttonText: t('intro.ok'),
            buttonCallback: function() { continueTo(rightClickHouse); }
        });

        function continueTo(nextStep) {
            nextStep();
        }
    }


    function doneSquare() {
        context.history().checkpoint('doneSquare');

        revealHouse(house, helpString('intro.buildings.done_square'), {
            buttonText: t('intro.ok'),
            buttonCallback: function() { continueTo(addTank); }
        });

        function continueTo(nextStep) {
            nextStep();
        }
    }


    function addTank() {
        context.enter(modeBrowse(context));
        context.history().reset('doneSquare');
        _tankID = null;

        var msec = transitionTime(tank, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().centerZoomEase(tank, 19.5, msec);

        timeout(function() {
            reveal('button.add-area',
                helpString('intro.buildings.add_tank')
            );

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'add-area') return;
                continueTo(startTank);
            });
        }, msec + 100);

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function startTank() {
        if (context.mode().id !== 'add-area') {
            return continueTo(addTank);
        }

        _tankID = null;

        timeout(function() {
            var startString = helpString('intro.buildings.start_tank') +
                helpString('intro.buildings.tank_edge_' + (context.lastPointerType() === 'mouse' ? 'click' : 'tap'));
            revealTank(tank, startString);

            context.map().on('move.intro drawn.intro', function() {
                revealTank(tank, startString, { duration: 0 });
            });

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'draw-area') return chapter.restart();
                continueTo(continueTank);
            });

        }, 550);  // after easing

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function continueTank() {
        if (context.mode().id !== 'draw-area') {
            return continueTo(addTank);
        }

        _tankID = null;

        var continueString = helpString('intro.buildings.continue_tank') + '{br}' +
            helpString('intro.areas.finish_area_' + (context.lastPointerType() === 'mouse' ? 'click' : 'tap')) +
            helpString('intro.buildings.finish_tank');

        revealTank(tank, continueString);

        context.map().on('move.intro drawn.intro', function() {
            revealTank(tank, continueString, { duration: 0 });
        });

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-area') {
                return;
            } else if (mode.id === 'select') {
                _tankID = context.selectedIDs()[0];
                return continueTo(searchPresetTank);
            } else {
                return continueTo(addTank);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function searchPresetTank() {
        if (!_tankID || !context.hasEntity(_tankID)) {
            return addTank();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== _tankID) {
            context.enter(modeSelect(context, [_tankID]));
        }

        // disallow scrolling
        context.container().select('.inspector-wrap').on('wheel.intro', eventCancel);

        timeout(function() {
            // reset pane, in case user somehow happened to change it..
            context.container().select('.inspector-wrap .panewrap').style('right', '-100%');

            context.container().select('.preset-search-input')
                .on('keydown.intro', null)
                .on('keyup.intro', checkPresetSearch);

            reveal('.preset-search-input',
                helpString('intro.buildings.search_tank', { preset: tankPreset.name() })
            );
        }, 400);  // after preset list pane visible..

        context.on('enter.intro', function(mode) {
            if (!_tankID || !context.hasEntity(_tankID)) {
                return continueTo(addTank);
            }

            var ids = context.selectedIDs();
            if (mode.id !== 'select' || !ids.length || ids[0] !== _tankID) {
                // keep the user's area selected..
                context.enter(modeSelect(context, [_tankID]));

                // reset pane, in case user somehow happened to change it..
                context.container().select('.inspector-wrap .panewrap').style('right', '-100%');
                // disallow scrolling
                context.container().select('.inspector-wrap').on('wheel.intro', eventCancel);

                context.container().select('.preset-search-input')
                    .on('keydown.intro', null)
                    .on('keyup.intro', checkPresetSearch);

                reveal('.preset-search-input',
                    helpString('intro.buildings.search_tank', { preset: tankPreset.name() })
                );

                context.history().on('change.intro', null);
            }
        });

        function checkPresetSearch() {
            var first = context.container().select('.preset-list-item:first-child');

            if (first.classed('preset-man_made-storage_tank')) {
                reveal(first.select('.preset-list-button').node(),
                    helpString('intro.buildings.choose_tank', { preset: tankPreset.name() }),
                    { duration: 300 }
                );

                context.container().select('.preset-search-input')
                    .on('keydown.intro', eventCancel, true)
                    .on('keyup.intro', null);

                context.history().on('change.intro', function() {
                    continueTo(closeEditorTank);
                });
            }
        }

        function continueTo(nextStep) {
            context.container().select('.inspector-wrap').on('wheel.intro', null);
            context.on('enter.intro', null);
            context.history().on('change.intro', null);
            context.container().select('.preset-search-input').on('keydown.intro keyup.intro', null);
            nextStep();
        }
    }


    function closeEditorTank() {
        if (!_tankID || !context.hasEntity(_tankID)) {
            return addTank();
        }
        var ids = context.selectedIDs();
        if (context.mode().id !== 'select' || !ids.length || ids[0] !== _tankID) {
            context.enter(modeSelect(context, [_tankID]));
        }

        context.history().checkpoint('hasTank');

        context.on('exit.intro', function() {
            continueTo(rightClickTank);
        });

        timeout(function() {
            reveal('.entity-editor-pane',
                helpString('intro.buildings.close', { button: icon('#iD-icon-close', 'pre-text') })
            );
        }, 500);

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function rightClickTank() {
        if (!_tankID) return continueTo(addTank);

        context.enter(modeBrowse(context));
        context.history().reset('hasTank');
        context.map().centerEase(tank, 500);

        timeout(function() {
            context.on('enter.intro', function(mode) {
                if (mode.id !== 'select') return;
                var ids = context.selectedIDs();
                if (ids.length !== 1 || ids[0] !== _tankID) return;

                timeout(function() {
                    var node = selectMenuItem(context, 'circularize').node();
                    if (!node) return;
                    continueTo(clickCircle);
                }, 50);  // after menu visible
            });

            var rightclickString = helpString('intro.buildings.' + (context.lastPointerType() === 'mouse' ? 'rightclick_tank' : 'edit_menu_tank_touch'));

            revealTank(tank, rightclickString);

            context.map().on('move.intro drawn.intro', function() {
                revealTank(tank, rightclickString, { duration: 0 });
            });

            context.history().on('change.intro', function() {
                continueTo(rightClickTank);
            });

        }, 600);

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function clickCircle() {
        if (!_tankID) return chapter.restart();
        var entity = context.hasEntity(_tankID);
        if (!entity) return continueTo(rightClickTank);

        var node = selectMenuItem(context, 'circularize').node();
        if (!node) { return continueTo(rightClickTank); }

        var wasChanged = false;

        reveal('.edit-menu',
            helpString('intro.buildings.circle_tank'),
            { padding: 50 }
        );

        context.on('enter.intro', function(mode) {
            if (mode.id === 'browse') {
                continueTo(rightClickTank);
            } else if (mode.id === 'move' || mode.id === 'rotate') {
                continueTo(retryClickCircle);
            }
        });

        context.map().on('move.intro', function() {
            var node = selectMenuItem(context, 'circularize').node();
            if (!wasChanged && !node) { return continueTo(rightClickTank); }

            reveal('.edit-menu',
                helpString('intro.buildings.circle_tank'),
                { duration: 0, padding: 50 }
            );
        });

        context.history().on('change.intro', function() {
            wasChanged = true;
            context.history().on('change.intro', null);

            // Something changed.  Wait for transition to complete and check undo annotation.
            timeout(function() {
                if (context.history().undoAnnotation() === t('operations.circularize.annotation.single')) {
                    continueTo(play);
                } else {
                    continueTo(retryClickCircle);
                }
            }, 500);  // after transitioned actions
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            context.map().on('move.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function retryClickCircle() {
        context.enter(modeBrowse(context));

        revealTank(tank, helpString('intro.buildings.retry_circle'), {
            buttonText: t('intro.ok'),
            buttonCallback: function() { continueTo(rightClickTank); }
        });

        function continueTo(nextStep) {
            nextStep();
        }
    }


    function play() {
        dispatch.call('done');
        reveal('.ideditor',
            helpString('intro.buildings.play', { next: t('intro.startediting.title') }), {
                tooltipBox: '.intro-nav-wrap .chapter-startEditing',
                buttonText: t('intro.ok'),
                buttonCallback: function() { reveal('.ideditor'); }
            }
        );
    }


    chapter.enter = function() {
        addHouse();
    };


    chapter.exit = function() {
        timeouts.forEach(window.clearTimeout);
        context.on('enter.intro exit.intro', null);
        context.map().on('move.intro drawn.intro', null);
        context.history().on('change.intro', null);
        context.container().select('.inspector-wrap').on('wheel.intro', null);
        context.container().select('.preset-search-input').on('keydown.intro keyup.intro', null);
        context.container().select('.more-fields .combobox-input').on('click.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
