import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../../util/locale';
import { actionDeleteMultiple } from '../../actions/index';
import { utilRebind } from '../../util/rebind';
import { utilBindOnce } from '../../util/bind_once';
import { icon, pad } from './helper';


export function uiIntroLine(context, reveal) {
    var dispatch = d3.dispatch('done'),
        timeouts = [],
        centroid = [-85.62830, 41.95699],
        midpoint = [-85.62975395449628, 41.95787501510204],
        start = [-85.6297754121684, 41.95805253325314],
        intersection = [-85.62974496187628, 41.95742515554585],
        targetId = 'w17965351',
        drawId = null;


    var step = {
        title: 'intro.lines.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }


    step.enter = function() {
        context.map().centerZoom(start, 18);
        reveal('button.add-line',
            t('intro.lines.add', { button: icon('#icon-line', 'pre-text') }),
            { tooltipClass: 'intro-lines-add' });

        context.on('enter.intro', addLine);


        function addLine(mode) {
            if (mode.id !== 'add-line') return;
            drawId = null;
            context.on('enter.intro', drawLine);

            var padding = 150 * Math.pow(2, context.map().zoom() - 18);
            var pointBox = pad(start, padding, context);
            reveal(pointBox, t('intro.lines.start'));

            context.map().on('move.intro', function() {
                padding = 150 * Math.pow(2, context.map().zoom() - 18);
                pointBox = pad(start, padding, context);
                reveal(pointBox, t('intro.lines.start'), {duration: 0});
            });
        }


        function drawLine(mode) {
            if (mode.id !== 'draw-line') return;
            drawId = mode.selectedIDs()[0];
            context.history().on('change.intro', checkIntersection);
            context.on('enter.intro', retry);

            var padding = 300 * Math.pow(2, context.map().zoom() - 19);
            var pointBox = pad(midpoint, padding, context);
            reveal(pointBox, t('intro.lines.intersect', {name: t('intro.graph.flower_st')}));

            context.map().on('move.intro', function() {
                padding = 300 * Math.pow(2, context.map().zoom() - 19);
                pointBox = pad(midpoint, padding, context);
                reveal(pointBox, t('intro.lines.intersect', {name: t('intro.graph.flower_st')}), {duration: 0});
            });
        }


        // ended line before creating intersection
        function retry(mode) {
            if (mode.id !== 'select') return;
            context.history().on('change.intro', null);
            var pointBox = pad(intersection, 30, context);
            reveal(pointBox, t('intro.lines.restart', {name: t('intro.graph.flower_st')}));
            d3.select(window).on('mousedown.intro', eventCancel, true);

            timeout(step.restart, 3000);
        }


        function checkIntersection() {

            function joinedTargetWay() {
                var drawEntity = drawId && context.hasEntity(drawId);
                if (!drawEntity) {
                    step.restart();
                    return false;
                }

                var drawNodes = context.graph().childNodes(drawEntity);
                return _.some(drawNodes, function(node) {
                    return _.some(context.graph().parentWays(node), function(parent) {
                        return parent.id === targetId;
                    });
                });
            }

            if (joinedTargetWay()) {
                context.history().on('change.intro', null);
                context.on('enter.intro', enterSelect);

                var padding = 900 * Math.pow(2, context.map().zoom() - 19);
                var pointBox = pad(centroid, padding, context);
                reveal(pointBox, t('intro.lines.finish'));

                context.map().on('move.intro', function() {
                    padding = 900 * Math.pow(2, context.map().zoom() - 19);
                    pointBox = pad(centroid, padding, context);
                    reveal(pointBox, t('intro.lines.finish'), {duration: 0});
                });
            }
        }


        function enterSelect(mode) {
            if (mode.id !== 'select') return;
            context.map().on('move.intro', null);
            context.on('enter.intro', null);
            d3.select('#curtain').style('pointer-events', 'all');
            presetCategory();
        }


        function presetCategory() {
            timeout(function() {
                d3.select('#curtain').style('pointer-events', 'none');
                var road = d3.select('.preset-category-road .preset-list-button');
                reveal(road.node(), t('intro.lines.road'));
                utilBindOnce(road, 'click.intro', roadCategory);
            }, 500);
        }


        function roadCategory() {
            timeout(function() {
                var grid = d3.select('.subgrid');
                reveal(grid.node(), t('intro.lines.residential'));
                utilBindOnce(grid.selectAll(':not(.preset-highway-residential) .preset-list-button'),
                    'click.intro', retryPreset);
                utilBindOnce(grid.selectAll('.preset-highway-residential .preset-list-button'),
                    'click.intro', roadDetails);
            }, 500);
        }


        // selected wrong road type
        function retryPreset() {
            timeout(function() {
                var preset = d3.select('.entity-editor-pane .preset-list-button');
                reveal(preset.node(), t('intro.lines.wrong_preset'));
                utilBindOnce(preset, 'click.intro', presetCategory);
            }, 500);
        }


        function roadDetails() {
            reveal('.pane',
                t('intro.lines.describe', { button: icon('#icon-apply', 'pre-text') }));
            context.on('exit.intro', function() {
                dispatch.call('done');
            });
        }
    };


    step.restart = function() {
        step.exit();
        step.enter();
    };


    step.exit = function() {
        d3.select(window).on('mousedown.intro', null, true);
        d3.select('#curtain').style('pointer-events', 'none');
        timeouts.forEach(window.clearTimeout);
        context.on('enter.intro', null);
        context.on('exit.intro', null);
        context.map().on('move.intro', null);
        context.history().on('change.intro', null);
        if (drawId) {
            context.replace(actionDeleteMultiple([drawId]));
            drawId = null;
        }
    };

    return utilRebind(step, dispatch, 'on');
}
