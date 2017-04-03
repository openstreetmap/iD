import * as d3 from 'd3';
import { t } from '../../util/locale';
import { modeBrowse } from '../../modes/browse';
import { utilRebind } from '../../util/rebind';
import { icon, pad } from './helper';


export function uiIntroBuilding(context, reveal) {
    var dispatch = d3.dispatch('done'),
        house = [-85.62815, 41.95638],
        tank = [-85.62732, 41.95347],
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


    function revealBuilding(center, text, options) {
        var padding = 160 * Math.pow(2, context.map().zoom() - 20);
        var box = pad(center, padding, context);
        reveal(box, text, options);
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
            revealBuilding(house, t('intro.buildings.start_building'));

            context.map().on('move.intro drawn.intro', function() {
                revealBuilding(house, t('intro.buildings.start_building'), { duration: 0 });
            });

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'draw-area') return chapter.restart();
                continueTo(drawBuilding);
            });

        }, 550);  // after easing

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

        revealBuilding(house, t('intro.buildings.continue_building'));

        context.map().on('move.intro drawn.intro', function() {
            revealBuilding(house, t('intro.buildings.continue_building'), { duration: 0 });
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
            button.on('click.intro', function() { continueTo(closeEditorHouse); });
        }, 500);

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
                var node = d3.select('.edit-menu-item-orthogonalize, .radial-menu-item-orthogonalize').node();
                if (!node) return;
                continueTo(clickSquare);
            }, 300);  // after menu visible
        });

        context.map().on('move.intro drawn.intro', function() {
            revealBuilding(house, t('intro.buildings.rightclick_building'), { duration: 0 });
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

        var node = d3.select('.edit-menu-item-orthogonalize, .radial-menu-item-orthogonalize').node();
        if (!node) { return continueTo(rightClickHouse); }

        var wasChanged = false;

        revealBuilding(house,
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
            var node = d3.select('.edit-menu-item-orthogonalize, .radial-menu-item-orthogonalize').node();
            if (!wasChanged && !node) { return continueTo(rightClickHouse); }

            revealBuilding(house,
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

        revealBuilding(house, t('intro.buildings.retry_square'), {
            buttonText: t('intro.ok'),
            buttonCallback: function() { continueTo(rightClickHouse); }
        });

        function continueTo(nextStep) {
            nextStep();
        }
    }


    function doneSquare() {
        revealBuilding(house, t('intro.buildings.done_square'), {
            buttonText: t('intro.ok'),
            buttonCallback: function() { continueTo(play); }
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
