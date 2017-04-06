import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../../util/locale';
import { geoSphericalDistance } from '../../geo/index';
import { modeSelect } from '../../modes/select';
import { utilRebind } from '../../util/rebind';
import { icon, pad } from './helper';


export function uiIntroLine(context, reveal) {
    var dispatch = d3.dispatch('done'),
        timeouts = [],
        tulipRoadId = null,
        flowerRoadId = 'w646',
        tulipRoadStart = [-85.6297754121684, 41.95805253325314],
        tulipRoadMidpoint = [-85.62975395449628, 41.95787501510204],
        tulipRoadIntersection = [-85.62974496187628, 41.95742515554585],
        woodRoadId = 'w525',
        woodRoadEndId = 'n2862',
        woodRoadAddNode = [-85.62390110349587, 41.95397111462291],
        woodRoadDragEndpoint = [-85.62383958913921, 41.9546607846611],
        woodRoadDragMidpoint = [-85.62386254803509, 41.95430395953872],
        roadCategory = context.presets().item('category-road'),
        residentialPreset = context.presets().item('highway/residential');


    var chapter = {
        title: 'intro.lines.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }


    function addLine() {
        var tooltip = reveal('button.add-line',
            t('intro.lines.add_line', { button: icon('#icon-line', 'pre-text') }));

        tooltip.selectAll('.tooltip-inner')
            .insert('svg', 'span')
            .attr('class', 'tooltip-illustration')
            .append('use')
            .attr('xlink:href', '#feature-images');

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'add-line') return;
            continueTo(startLine);
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function startLine() {
        if (context.mode().id !== 'add-line') {
            return chapter.restart();
        }

        tulipRoadId = null;

        var padding = 70 * Math.pow(2, context.map().zoom() - 18);
        var box = pad(tulipRoadStart, padding, context);
        box.height = box.height + 100;
        reveal(box, t('intro.lines.start_line'));

        context.map().on('move.intro drawn.intro', function() {
            padding = 70 * Math.pow(2, context.map().zoom() - 18);
            box = pad(tulipRoadStart, padding, context);
            box.height = box.height + 100;
            reveal(box, t('intro.lines.start_line'), { duration: 0 });
        });

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'draw-line') return chapter.restart();
            continueTo(drawLine);
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function drawLine() {
        if (context.mode().id !== 'draw-line') {
            return chapter.restart();
        }

        tulipRoadId = context.mode().selectedIDs()[0];
        context.map().centerEase(tulipRoadMidpoint);

        timeout(function() {
            var padding = 200 * Math.pow(2, context.map().zoom() - 18.5);
            var box = pad(tulipRoadMidpoint, padding, context);
            box.height = box.height * 2;
            reveal(box,
                t('intro.lines.intersect', { name: t('intro.graph.name.flower-street') })
            );

            context.map().on('move.intro drawn.intro', function() {
                padding = 200 * Math.pow(2, context.map().zoom() - 18.5);
                box = pad(tulipRoadMidpoint, padding, context);
                box.height = box.height * 2;
                reveal(box,
                    t('intro.lines.intersect', { name: t('intro.graph.name.flower-street') }),
                    { duration: 0 }
                );
            });
        }, 260);  // after easing..

        context.history().on('change.intro', function() {
            var entity = tulipRoadId && context.hasEntity(tulipRoadId);
            if (!entity) return chapter.restart();

            if (isLineConnected()) {
                continueTo(continueLine);
            }
        });

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-line')
                return;
            else if (mode.id === 'select') {
                continueTo(retryIntersect);
                return;
            }
            else
                return chapter.restart();
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function isLineConnected() {
        var entity = tulipRoadId && context.hasEntity(tulipRoadId);
        if (!entity) return false;

        var drawNodes = context.graph().childNodes(entity);
        return _.some(drawNodes, function(node) {
            return _.some(context.graph().parentWays(node), function(parent) {
                return parent.id === flowerRoadId;
            });
        });
    }


    function retryIntersect() {
        d3.select(window).on('mousedown.intro', eventCancel, true);

        var box = pad(tulipRoadIntersection, 80, context);
        reveal(box,
            t('intro.lines.retry_intersect', { name: t('intro.graph.name.flower-street') })
        );

        timeout(chapter.restart, 3000);
    }


    function continueLine() {
        if (context.mode().id !== 'draw-line') return chapter.restart();
        var entity = tulipRoadId && context.hasEntity(tulipRoadId);
        if (!entity) return chapter.restart();

        context.map().centerEase(tulipRoadIntersection);

        reveal('#surface', t('intro.lines.continue_line'));

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-line')
                return;
            else if (mode.id === 'select')
                return continueTo(chooseCategoryRoad);
            else
                return chapter.restart();
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function chooseCategoryRoad() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        var button = d3.select('.preset-category-road .preset-list-button');
        if (button.empty()) return chapter.restart();

        timeout(function() {
            reveal(button.node(),
                t('intro.lines.choose_category_road', { name: roadCategory.name() })
            );
            button.on('click.intro', function() { continueTo(choosePresetResidential); });
        }, 500);

        function continueTo(nextStep) {
            d3.select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function choosePresetResidential() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        var subgrid = d3.select('.preset-category-road .subgrid');
        if (subgrid.empty()) return chapter.restart();

        subgrid.selectAll(':not(.preset-highway-residential) .preset-list-button')
            .on('click.intro', function() {
                continueTo(retryPresetResidential);
            });

        subgrid.selectAll('.preset-highway-residential .preset-list-button')
            .on('click.intro', function() {
                continueTo(nameRoad);
            });

        timeout(function() {
            reveal(subgrid.node(),
                t('intro.lines.choose_preset_residential', { name: residentialPreset.name() }),
                { duration: 300 }
            );
        }, 300);

        function continueTo(nextStep) {
            d3.select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    // selected wrong road type
    function retryPresetResidential() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        timeout(function() {
            var button = d3.select('.entity-editor-pane .preset-list-button');
            reveal(button.node(),
                t('intro.lines.retry_preset_residential', { name: residentialPreset.name() })
            );
            button.on('click.intro', function() {
                continueTo(chooseCategoryRoad);
            });
        }, 500);

        function continueTo(nextStep) {
            d3.select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function nameRoad() {
        context.on('exit.intro', function() {
            context.history().checkpoint('doneAddRoad');
            continueTo(updateLine);
        });

        timeout(function() {
            reveal('.entity-editor-pane',
                t('intro.lines.name_road', { button: icon('#icon-apply', 'pre-text') })
            );
        }, 500);

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function updateLine() {
        context.history().reset('doneAddRoad');
        if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
            return chapter.restart();
        }

        context.map().zoom(19).centerEase(woodRoadDragMidpoint, 500);

        timeout(function() {
            var padding = 250 * Math.pow(2, context.map().zoom() - 19);
            var box = pad(woodRoadDragMidpoint, padding, context);
            var advance = function() { continueTo(addNode); };

            reveal(box, t('intro.lines.update_line'),
                { buttonText: t('intro.ok'), buttonCallback: advance }
            );

            context.map().on('move.intro drawn.intro', function() {
                var box = pad(woodRoadDragMidpoint, padding, context);
                reveal(box, t('intro.lines.update_line'),
                    { duration: 0, buttonText: t('intro.ok'), buttonCallback: advance }
                );
            });
        }, 550);

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function addNode() {
        context.history().reset('doneAddRoad');
        if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
            return chapter.restart();
        }

        var padding = 40 * Math.pow(2, context.map().zoom() - 19);

        var box = pad(woodRoadAddNode, padding, context);
        reveal(box, t('intro.lines.add_node'));

        context.map().on('move.intro drawn.intro', function() {
            var box = pad(woodRoadAddNode, padding, context);
            reveal(box, t('intro.lines.add_node'), { duration: 0 });
        });

        context.history().on('change.intro', function(changed) {
            if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
                return continueTo(updateLine);
            }
            if (changed.created().length === 1) {
                timeout(function() { continueTo(startDragEndpoint); }, 500);
            }
        });

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'select') {
                continueTo(updateLine);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function startDragEndpoint() {
        if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
            return continueTo(updateLine);
        }

        var padding = 100 * Math.pow(2, context.map().zoom() - 19);

        var box = pad(woodRoadDragEndpoint, padding, context);
        reveal(box, t('intro.lines.start_drag_endpoint'));

        context.map().on('move.intro drawn.intro', function() {
            if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
                return continueTo(updateLine);
            }

            var box = pad(woodRoadDragEndpoint, padding, context);
            reveal(box, t('intro.lines.start_drag_endpoint'), { duration: 0 });

            var entity = context.entity(woodRoadEndId);
            if (geoSphericalDistance(entity.loc, woodRoadDragEndpoint) <= 2) {
                continueTo(finishDragEndpoint);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function finishDragEndpoint() {
        if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
            return continueTo(updateLine);
        }

        var padding = 100 * Math.pow(2, context.map().zoom() - 19);

        var box = pad(woodRoadDragEndpoint, padding, context);
        reveal(box, t('intro.lines.finish_drag_endpoint'));

        context.map().on('move.intro drawn.intro', function() {
            if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
                return continueTo(updateLine);
            }
            var box = pad(woodRoadDragEndpoint, padding, context);
            reveal(box, t('intro.lines.finish_drag_endpoint'), { duration: 0 });

            var entity = context.entity(woodRoadEndId);
            if (geoSphericalDistance(entity.loc, woodRoadDragEndpoint) > 2.5) {
                continueTo(startDragEndpoint);
            }
        });

        context.on('enter.intro', function() {
            continueTo(startDragMidpoint);
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function startDragMidpoint() {
        if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
            return continueTo(updateLine);
        }

        var padding = 80 * Math.pow(2, context.map().zoom() - 19);

        var box = pad(woodRoadDragMidpoint, padding, context);
        reveal(box, t('intro.lines.start_drag_midpoint'));

        context.map().on('move.intro drawn.intro', function() {
            if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
                return continueTo(updateLine);
            }
            var box = pad(woodRoadDragMidpoint, padding, context);
            reveal(box, t('intro.lines.start_drag_midpoint'), { duration: 0 });
        });

        context.history().on('change.intro', function(changed) {
            if (changed.created().length === 1) {
                continueTo(continueDragMidpoint);
            }
        });

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'select') {
                // keep Wood Road selected so midpoint triangles are drawn..
                context.enter(modeSelect(context, [woodRoadId]));
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function continueDragMidpoint() {
        if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
            return continueTo(updateLine);
        }

        var padding = 100 * Math.pow(2, context.map().zoom() - 19);

        var box = pad(woodRoadDragEndpoint, padding, context);
        box.height += 400;
        var advance = function() { continueTo(play); };

        reveal(box, t('intro.lines.continue_drag_midpoint'),
            { buttonText: t('intro.ok'), buttonCallback: advance }
        );

        context.map().on('move.intro drawn.intro', function() {
            if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
                return continueTo(updateLine);
            }
            var box = pad(woodRoadDragEndpoint, padding, context);
            box.height += 400;
            reveal(box, t('intro.lines.continue_drag_midpoint'),
                { duration: 0, buttonText: t('intro.ok'), buttonCallback: advance }
            );
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function play() {
        dispatch.call('done');
        reveal('.intro-nav-wrap .chapter-building',
            t('intro.lines.play', { next: t('intro.buildings.title') }), {
                buttonText: t('intro.ok'),
                buttonCallback: function() { reveal('#id-container'); }
            }
        );
    }


    chapter.enter = function() {
        context.history().reset('initial');
        context.map().zoom(18.5).centerEase(tulipRoadStart);
        addLine();
    };


    chapter.exit = function() {
        timeouts.forEach(window.clearTimeout);
        d3.select(window).on('mousedown.intro', null, true);
        context.on('enter.intro', null);
        context.on('exit.intro', null);
        context.map().on('move.intro drawn.intro', null);
        context.history().on('change.intro', null);
        d3.select('.preset-list-button').on('click.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
