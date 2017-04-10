import * as d3 from 'd3';
import { t } from '../../util/locale';
import { modeBrowse } from '../../modes/browse';
import { utilRebind } from '../../util/rebind';
import { icon, pad, selectMenuItem } from './helper';


export function uiIntroBuilding(context, reveal) {
    var dispatch = d3.dispatch('done'),
        house = [-85.62815, 41.95638],
        tank = [-85.62732, 41.95347],
        buildingCatetory = context.presets().item('category-building'),
        housePreset = context.presets().item('building/house'),
        tankPreset = context.presets().item('man_made/storage_tank'),
        timeouts = [],
        houseId = null,
        tankId = null;


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
        var tooltip = reveal('button.add-area',
            t('intro.buildings.add_building', { button: icon('#icon-area', 'pre-text') }));

        tooltip.selectAll('.tooltip-inner')
            .insert('svg', 'span')
            .attr('class', 'tooltip-illustration')
            .append('use')
            .attr('xlink:href', '#building-images');

        houseId = null;
        context.history().reset('initial');

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'add-area') return;
            continueTo(startHouse);
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function startHouse() {
        if (context.mode().id !== 'add-area') {
            return chapter.restart();
        }

        houseId = null;
        context.map().zoomEase(20, 500);

        timeout(function() {
            revealHouse(house, t('intro.buildings.start_building'));

            context.map().on('move.intro drawn.intro', function() {
                revealHouse(house, t('intro.buildings.start_building'), { duration: 0 });
            });

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'draw-area') return chapter.restart();
                continueTo(drawHouse);
            });

        }, 550);  // after easing

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function drawHouse() {
        if (context.mode().id !== 'draw-area') {
            return chapter.restart();
        }

        houseId = null;
        revealHouse(house, t('intro.buildings.continue_building'));

        context.map().on('move.intro drawn.intro', function() {
            revealHouse(house, t('intro.buildings.continue_building'), { duration: 0 });
        });

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-area')
                return;
            else if (mode.id === 'select')
                return continueTo(chooseCategoryBuilding);
            else
                return chapter.restart();
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function chooseCategoryBuilding() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        var button = d3.select('.preset-category-building .preset-list-button');
        if (button.empty()) return chapter.restart();

        timeout(function() {
            reveal(button.node(),
                t('intro.buildings.choose_category_building', { name: buildingCatetory.name() })
            );
            button.on('click.intro', function() { continueTo(choosePresetHouse); });
        }, 500);

        function continueTo(nextStep) {
            d3.select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function choosePresetHouse() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        var button = d3.select('.preset-building-house .preset-list-button');
        if (button.empty()) return chapter.restart();

        timeout(function() {
            reveal(button.node(),
                t('intro.buildings.choose_preset_house', { name: housePreset.name() }),
                { duration: 300 }
            );
            button.on('click.intro', function() { continueTo(closeEditorHouse); });
        }, 300);

        function continueTo(nextStep) {
            d3.select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function closeEditorHouse() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        houseId = context.mode().selectedIDs()[0];
        context.history().checkpoint('hasHouse');

        context.on('exit.intro', function() {
            continueTo(rightClickHouse);
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


    function rightClickHouse() {
        if (!houseId) return chapter.restart();

        context.enter(modeBrowse(context));
        context.history().reset('hasHouse');
        context.map().centerEase(house, 500);

        timeout(function() {
            if (context.map().zoom() < 20) {
                context.map().zoomEase(20, 500);
            }
        }, 520);

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'select') return;
            var ids = context.selectedIDs();
            if (ids.length !== 1 || ids[0] !== houseId) return;

            timeout(function() {
                var node = selectMenuItem('orthogonalize').node();
                if (!node) return;
                continueTo(clickSquare);
            }, 300);  // after menu visible
        });

        context.map().on('move.intro drawn.intro', function() {
            revealHouse(house, t('intro.buildings.rightclick_building'), { duration: 0 });
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
        if (!houseId) return chapter.restart();
        var entity = context.hasEntity(houseId);
        if (!entity) return continueTo(rightClickHouse);

        var node = selectMenuItem('orthogonalize').node();
        if (!node) { return continueTo(rightClickHouse); }

        var wasChanged = false;

        revealHouse(house,
            t('intro.buildings.square_building', { button: icon('#operation-orthogonalize', 'pre-text') })
        );

        context.on('enter.intro', function(mode) {
            if (mode.id === 'browse') {
                continueTo(rightClickHouse);
            } else if (mode.id === 'move' || mode.id === 'rotate') {
                continueTo(retryClickSquare);
            }
        });

        context.map().on('move.intro drawn.intro', function() {
            var node = selectMenuItem('orthogonalize').node();
            if (!wasChanged && !node) { return continueTo(rightClickHouse); }

            revealHouse(house,
                t('intro.buildings.square_building', { button: icon('#operation-orthogonalize', 'pre-text') }),
                { duration: 0 }
            );
        });

        context.history().on('change.intro', function() {
            wasChanged = true;
            context.history().on('change.intro', null);

            // Something changed.  Wait for transition to complete and check undo annotation.
            timeout(function() {
                if (context.history().undoAnnotation() === t('operations.orthogonalize.annotation.area')) {
                    continueTo(doneSquare);
                } else {
                    continueTo(retryClickSquare);
                }
            }, 500);  // after transitioned actions
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function retryClickSquare() {
        context.enter(modeBrowse(context));

        revealHouse(house, t('intro.buildings.retry_square'), {
            buttonText: t('intro.ok'),
            buttonCallback: function() { continueTo(rightClickHouse); }
        });

        function continueTo(nextStep) {
            nextStep();
        }
    }


    function doneSquare() {
        context.history().checkpoint('doneSquare');

        revealHouse(house, t('intro.buildings.done_square'), {
            buttonText: t('intro.ok'),
            buttonCallback: function() { continueTo(addTank); }
        });

        function continueTo(nextStep) {
            nextStep();
        }
    }


    function addTank() {
        reveal('button.add-area',
            t('intro.buildings.add_tank', { button: icon('#icon-area', 'pre-text') })
        );

        tankId = null;
        context.history().reset('doneSquare');
        context.map().zoom(19.5).centerEase(tank, 500);

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'add-area') return;
            continueTo(startTank);
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function startTank() {
        if (context.mode().id !== 'add-area') {
            return continueTo(addTank);
        }

        tankId = null;

        timeout(function() {
            revealTank(tank, t('intro.buildings.start_tank'));

            context.map().on('move.intro drawn.intro', function() {
                revealTank(tank, t('intro.buildings.start_tank'), { duration: 0 });
            });

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'draw-area') return chapter.restart();
                continueTo(drawTank);
            });

        }, 550);  // after easing

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function drawTank() {
        if (context.mode().id !== 'draw-area') {
            return continueTo(addTank);
        }

        revealTank(tank, t('intro.buildings.continue_tank'));

        context.map().on('move.intro drawn.intro', function() {
            revealTank(tank, t('intro.buildings.continue_tank'), { duration: 0 });
        });

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-area')
                return;
            else if (mode.id === 'select')
                return continueTo(searchPresetTank);
            else
                return continueTo(addTank);
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function searchPresetTank() {
        if (context.mode().id !== 'select') {
            return continueTo(addTank);
        }

        context.on('exit.intro', function() {
            return continueTo(addTank);
        });

        d3.select('.preset-search-input')
            .on('keyup.intro', checkPresetSearch);

        timeout(function() {
            reveal('.preset-search-input',
                t('intro.buildings.search_tank', { name: tankPreset.name() })
            );
        }, 500);

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            d3.select('.preset-search-input').on('keyup.intro', null);
            nextStep();
        }
    }


    function checkPresetSearch() {
        var first = d3.select('.preset-list-item:first-child');

        if (first.classed('preset-man_made-storage_tank')) {
            reveal(first.select('.preset-list-button').node(),
                t('intro.buildings.choose_tank', { name: tankPreset.name() }),
                { duration: 300 }
            );

            d3.select('.preset-search-input')
                .on('keydown.intro', eventCancel, true)
                .on('keyup.intro', null);

            context.history().on('change.intro', function() {
                continueTo(closeEditorTank);
            });
        }

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            d3.select('.preset-search-input').on('keydown.intro', null);
            nextStep();
        }
    }


    function closeEditorTank() {
        if (context.mode().id !== 'select') {
            return continueTo(addTank);
        }

        tankId = context.mode().selectedIDs()[0];
        context.history().checkpoint('hasTank');

        context.on('exit.intro', function() {
            continueTo(rightClickTank);
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


    function rightClickTank() {
        if (!tankId) return continueTo(addTank);

        context.enter(modeBrowse(context));
        context.history().reset('hasTank');
        context.map().centerEase(tank, 500);

        timeout(function() {
            if (context.map().zoom() < 19.5) {
                context.map().zoomEase(19.5, 500);
            }
        }, 520);

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'select') return;
            var ids = context.selectedIDs();
            if (ids.length !== 1 || ids[0] !== tankId) return;

            timeout(function() {
                var node = selectMenuItem('circularize').node();
                if (!node) return;
                continueTo(clickCircle);
            }, 300);  // after menu visible
        });

        context.map().on('move.intro drawn.intro', function() {
            revealTank(tank, t('intro.buildings.rightclick_tank'), { duration: 0 });
        });

        context.history().on('change.intro', function() {
            continueTo(rightClickTank);
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function clickCircle() {
        if (!tankId) return chapter.restart();
        var entity = context.hasEntity(tankId);
        if (!entity) return continueTo(rightClickTank);

        var node = selectMenuItem('circularize').node();
        if (!node) { return continueTo(rightClickTank); }

        var wasChanged = false;

        revealTank(tank,
            t('intro.buildings.circle_tank', { button: icon('#operation-circularize', 'pre-text') })
        );

        context.on('enter.intro', function(mode) {
            if (mode.id === 'browse') {
                continueTo(rightClickTank);
            } else if (mode.id === 'move' || mode.id === 'rotate') {
                continueTo(retryClickCircle);
            }
        });

        context.map().on('move.intro drawn.intro', function() {
            var node = selectMenuItem('circularize').node();
            if (!wasChanged && !node) { return continueTo(rightClickTank); }

            revealTank(tank,
                t('intro.buildings.circle_tank', { button: icon('#operation-circularize', 'pre-text') }),
                { duration: 0 }
            );
        });

        context.history().on('change.intro', function() {
            wasChanged = true;
            context.history().on('change.intro', null);

            // Something changed.  Wait for transition to complete and check undo annotation.
            timeout(function() {
                if (context.history().undoAnnotation() === t('operations.circularize.annotation.area')) {
                    continueTo(play);
                } else {
                    continueTo(retryClickCircle);
                }
            }, 500);  // after transitioned actions
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function retryClickCircle() {
        context.enter(modeBrowse(context));

        revealTank(tank, t('intro.buildings.retry_circle'), {
            buttonText: t('intro.ok'),
            buttonCallback: function() { continueTo(rightClickTank); }
        });

        function continueTo(nextStep) {
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
        houseId = null;
        tankId = null;
        context.history().reset('initial');
        context.map().zoom(19).centerEase(house, 500);
        timeout(addHouse, 520);
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
