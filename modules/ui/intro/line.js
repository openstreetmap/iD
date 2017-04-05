import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../../util/locale';
import { utilRebind } from '../../util/rebind';
import { icon, pad } from './helper';


export function uiIntroLine(context, reveal) {
    var dispatch = d3.dispatch('done'),
        timeouts = [],
        midpoint = [-85.62975395449628, 41.95787501510204],
        start = [-85.6297754121684, 41.95805253325314],
        intersection = [-85.62974496187628, 41.95742515554585],
        targetId = 'w646',
        lineId = null;


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
            t('intro.lines.add', { button: icon('#icon-line', 'pre-text') }));

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

        lineId = null;

        var padding = 70 * Math.pow(2, context.map().zoom() - 18);
        var box = pad(start, padding, context);
        box.height = box.height + 100;
        reveal(box, t('intro.lines.start'));

        context.map().on('move.intro drawn.intro', function() {
            padding = 70 * Math.pow(2, context.map().zoom() - 18);
            box = pad(start, padding, context);
            box.height = box.height + 100;
            reveal(box, t('intro.lines.start'), { duration: 0 });
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

        lineId = context.mode().selectedIDs()[0];
        context.map().centerEase(midpoint);

        timeout(function() {
            var padding = 200 * Math.pow(2, context.map().zoom() - 18.5);
            var box = pad(midpoint, padding, context);
            box.height = box.height * 2;
            reveal(box,
                t('intro.lines.intersect', { name: t('intro.graph.name.flower-street') })
            );

            context.map().on('move.intro drawn.intro', function() {
                padding = 200 * Math.pow(2, context.map().zoom() - 18.5);
                box = pad(midpoint, padding, context);
                box.height = box.height * 2;
                reveal(box,
                    t('intro.lines.intersect', { name: t('intro.graph.name.flower-street') }),
                    { duration: 0 }
                );
            });
        }, 260);  // after easing..

        context.history().on('change.intro', function() {
            var entity = lineId && context.hasEntity(lineId);
            if (!entity) return chapter.restart();

            if (isLineConnected()) {
                continueTo(finishLine);
            }
        });

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-line')
                return;
            else if (mode.id === 'select') {
                var box = pad(intersection, 80, context);
                reveal(box, t('intro.lines.restart', { name: t('intro.graph.name.flower-street') }));
                d3.select(window).on('mousedown.intro', eventCancel, true);
                timeout(chapter.restart, 3000);
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
        var entity = lineId && context.hasEntity(lineId);
        if (!entity) return false;

        var drawNodes = context.graph().childNodes(entity);
        return _.some(drawNodes, function(node) {
            return _.some(context.graph().parentWays(node), function(parent) {
                return parent.id === targetId;
            });
        });
    }


    function finishLine() {
        if (context.mode().id !== 'draw-line') return chapter.restart();
        var entity = lineId && context.hasEntity(lineId);
        if (!entity) return chapter.restart();

        context.map().centerEase(intersection);

        reveal('#surface', t('intro.lines.finish'));

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-line')
                return;
            else if (mode.id === 'select')
                return continueTo(enterSelect);
            else
                return chapter.restart();
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function enterSelect() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        var button = d3.select('.preset-category-road .preset-list-button');
        if (button.empty()) return chapter.restart();

        timeout(function() {
            reveal(button.node(), t('intro.lines.road'));
            button.on('click.intro', function() { continueTo(roadCategory); });
        }, 500);

        function continueTo(nextStep) {
            d3.select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function roadCategory() {
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
                continueTo(retryPreset);
            });

        subgrid.selectAll('.preset-highway-residential .preset-list-button')
            .on('click.intro', function() {
                continueTo(roadDetails);
            });

        timeout(function() {
            reveal(subgrid.node(), t('intro.lines.residential'));
        }, 500);

        function continueTo(nextStep) {
            d3.select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    // selected wrong road type
    function retryPreset() {
        if (context.mode().id !== 'select') {
            return chapter.restart();
        }

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        timeout(function() {
            var button = d3.select('.entity-editor-pane .preset-list-button');
            reveal(button.node(), t('intro.lines.wrong_preset'));
            button.on('click.intro', function() {
                continueTo(enterSelect);
            });
        }, 500);

        function continueTo(nextStep) {
            d3.select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function roadDetails() {
        context.on('exit.intro', function() {
            continueTo(play);
        });

        timeout(function() {
            reveal('.entity-editor-pane',
                t('intro.lines.describe', { button: icon('#icon-apply', 'pre-text') })
            );
        }, 500);

        function continueTo(nextStep) {
            context.on('exit.intro', null);
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
        context.map().zoom(18.5).centerEase(start);
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
