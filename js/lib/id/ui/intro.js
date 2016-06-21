(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.iD = global.iD || {}, global.iD.ui = global.iD.ui || {}, global.iD.ui.intro = global.iD.ui.intro || {})));
}(this, function (exports) { 'use strict';

    function area(context, reveal) {
        var event = d3.dispatch('done'),
            timeout;

        var step = {
            title: 'intro.areas.title'
        };

        step.enter = function() {
            var playground = [-85.63552, 41.94159],
                corner = [-85.63565411045074, 41.9417715536927];
            context.map().centerZoom(playground, 19);
            reveal('button.add-area',
                t('intro.areas.add', { button: iD.ui.intro.icon('#icon-area', 'pre-text') }),
                { tooltipClass: 'intro-areas-add' });

            context.on('enter.intro', addArea);

            function addArea(mode) {
                if (mode.id !== 'add-area') return;
                context.on('enter.intro', drawArea);

                var padding = 120 * Math.pow(2, context.map().zoom() - 19);
                var pointBox = iD.ui.intro.pad(corner, padding, context);
                reveal(pointBox, t('intro.areas.corner'));

                context.map().on('move.intro', function() {
                    padding = 120 * Math.pow(2, context.map().zoom() - 19);
                    pointBox = iD.ui.intro.pad(corner, padding, context);
                    reveal(pointBox, t('intro.areas.corner'), {duration: 0});
                });
            }

            function drawArea(mode) {
                if (mode.id !== 'draw-area') return;
                context.on('enter.intro', enterSelect);

                var padding = 150 * Math.pow(2, context.map().zoom() - 19);
                var pointBox = iD.ui.intro.pad(playground, padding, context);
                reveal(pointBox, t('intro.areas.place'));

                context.map().on('move.intro', function() {
                    padding = 150 * Math.pow(2, context.map().zoom() - 19);
                    pointBox = iD.ui.intro.pad(playground, padding, context);
                    reveal(pointBox, t('intro.areas.place'), {duration: 0});
                });
            }

            function enterSelect(mode) {
                if (mode.id !== 'select') return;
                context.map().on('move.intro', null);
                context.on('enter.intro', null);

                timeout = setTimeout(function() {
                    reveal('.preset-search-input',
                        t('intro.areas.search',
                        { name: context.presets().item('leisure/playground').name() }));
                    d3.select('.preset-search-input').on('keyup.intro', keySearch);
                }, 500);
            }

            function keySearch() {
                var first = d3.select('.preset-list-item:first-child');
                if (first.classed('preset-leisure-playground')) {
                    reveal(first.select('.preset-list-button').node(), t('intro.areas.choose'));
                    d3.selection.prototype.one.call(context.history(), 'change.intro', selectedPreset);
                    d3.select('.preset-search-input').on('keyup.intro', null);
                }
            }

            function selectedPreset() {
                reveal('.pane',
                    t('intro.areas.describe', { button: iD.ui.intro.icon('#icon-apply', 'pre-text') }));
                context.on('exit.intro', event.done);
            }
        };

        step.exit = function() {
            window.clearTimeout(timeout);
            context.on('enter.intro', null);
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            context.map().on('move.intro', null);
            d3.select('.preset-search-input').on('keyup.intro', null);
        };

        return d3.rebind(step, event, 'on');
    }

    function line(context, reveal) {
        var event = d3.dispatch('done'),
            timeouts = [];

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
            var centroid = [-85.62830, 41.95699];
            var midpoint = [-85.62975395449628, 41.95787501510204];
            var start = [-85.6297754121684, 41.95805253325314];
            var intersection = [-85.62974496187628, 41.95742515554585];

            context.map().centerZoom(start, 18);
            reveal('button.add-line',
                t('intro.lines.add', { button: iD.ui.intro.icon('#icon-line', 'pre-text') }),
                { tooltipClass: 'intro-lines-add' });

            context.on('enter.intro', addLine);

            function addLine(mode) {
                if (mode.id !== 'add-line') return;
                context.on('enter.intro', drawLine);

                var padding = 150 * Math.pow(2, context.map().zoom() - 18);
                var pointBox = iD.ui.intro.pad(start, padding, context);
                reveal(pointBox, t('intro.lines.start'));

                context.map().on('move.intro', function() {
                    padding = 150 * Math.pow(2, context.map().zoom() - 18);
                    pointBox = iD.ui.intro.pad(start, padding, context);
                    reveal(pointBox, t('intro.lines.start'), {duration: 0});
                });
            }

            function drawLine(mode) {
                if (mode.id !== 'draw-line') return;
                context.history().on('change.intro', addIntersection);
                context.on('enter.intro', retry);

                var padding = 300 * Math.pow(2, context.map().zoom() - 19);
                var pointBox = iD.ui.intro.pad(midpoint, padding, context);
                reveal(pointBox, t('intro.lines.intersect', {name: t('intro.graph.flower_st')}));

                context.map().on('move.intro', function() {
                    padding = 300 * Math.pow(2, context.map().zoom() - 19);
                    pointBox = iD.ui.intro.pad(midpoint, padding, context);
                    reveal(pointBox, t('intro.lines.intersect', {name: t('intro.graph.flower_st')}), {duration: 0});
                });
            }

            // ended line before creating intersection
            function retry(mode) {
                if (mode.id !== 'select') return;
                var pointBox = iD.ui.intro.pad(intersection, 30, context),
                    ids = mode.selectedIDs();
                reveal(pointBox, t('intro.lines.restart', {name: t('intro.graph.flower_st')}));
                d3.select(window).on('mousedown.intro', eventCancel, true);

                timeout(function() {
                    context.replace(iD.actions.DeleteMultiple(ids));
                    step.exit();
                    step.enter();
                }, 3000);
            }

            function addIntersection(changes) {
                if ( _.some(changes.created(), function(d) {
                    return d.type === 'node' && context.graph().parentWays(d).length > 1;
                })) {
                    context.history().on('change.intro', null);
                    context.on('enter.intro', enterSelect);

                    var padding = 900 * Math.pow(2, context.map().zoom() - 19);
                    var pointBox = iD.ui.intro.pad(centroid, padding, context);
                    reveal(pointBox, t('intro.lines.finish'));

                    context.map().on('move.intro', function() {
                        padding = 900 * Math.pow(2, context.map().zoom() - 19);
                        pointBox = iD.ui.intro.pad(centroid, padding, context);
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
                    road.one('click.intro', roadCategory);
                }, 500);
            }

            function roadCategory() {
                timeout(function() {
                    var grid = d3.select('.subgrid');
                    reveal(grid.node(), t('intro.lines.residential'));
                    grid.selectAll(':not(.preset-highway-residential) .preset-list-button')
                        .one('click.intro', retryPreset);
                    grid.selectAll('.preset-highway-residential .preset-list-button')
                        .one('click.intro', roadDetails);
                }, 500);
            }

            // selected wrong road type
            function retryPreset() {
                timeout(function() {
                    var preset = d3.select('.entity-editor-pane .preset-list-button');
                    reveal(preset.node(), t('intro.lines.wrong_preset'));
                    preset.one('click.intro', presetCategory);
                }, 500);
            }

            function roadDetails() {
                reveal('.pane',
                    t('intro.lines.describe', { button: iD.ui.intro.icon('#icon-apply', 'pre-text') }));
                context.on('exit.intro', event.done);
            }

        };

        step.exit = function() {
            d3.select(window).on('mousedown.intro', null, true);
            d3.select('#curtain').style('pointer-events', 'none');
            timeouts.forEach(window.clearTimeout);
            context.on('enter.intro', null);
            context.on('exit.intro', null);
            context.map().on('move.intro', null);
            context.history().on('change.intro', null);
        };

        return d3.rebind(step, event, 'on');
    }

    function navigation(context, reveal) {
        var event = d3.dispatch('done'),
            timeouts = [];

        var step = {
            title: 'intro.navigation.title'
        };

        function set(f, t) {
            timeouts.push(window.setTimeout(f, t));
        }

        function eventCancel() {
            d3.event.stopPropagation();
            d3.event.preventDefault();
        }

        step.enter = function() {
            var rect = context.surfaceRect(),
                map = {
                    left: rect.left + 10,
                    top: rect.top + 70,
                    width: rect.width - 70,
                    height: rect.height - 170
                };

            context.map().centerZoom([-85.63591, 41.94285], 19);

            reveal(map, t('intro.navigation.drag'));

            context.map().on('move.intro', _.debounce(function() {
                context.map().on('move.intro', null);
                townhall();
                context.on('enter.intro', inspectTownHall);
            }, 400));

            function townhall() {
                var hall = [-85.63645945147184, 41.942986488012565];

                var point = context.projection(hall);
                if (point[0] < 0 || point[0] > rect.width ||
                    point[1] < 0 || point[1] > rect.height) {
                    context.map().center(hall);
                }

                var box = iD.ui.intro.pointBox(hall, context);
                reveal(box, t('intro.navigation.select'));

                context.map().on('move.intro', function() {
                    var box = iD.ui.intro.pointBox(hall, context);
                    reveal(box, t('intro.navigation.select'), {duration: 0});
                });
            }

            function inspectTownHall(mode) {
                if (mode.id !== 'select') return;
                context.on('enter.intro', null);
                context.map().on('move.intro', null);
                set(function() {
                    reveal('.entity-editor-pane',
                        t('intro.navigation.pane', { button: iD.ui.intro.icon('#icon-close', 'pre-text') }));
                    context.on('exit.intro', streetSearch);
                }, 700);
            }

            function streetSearch() {
                context.on('exit.intro', null);
                reveal('.search-header input',
                    t('intro.navigation.search', { name: t('intro.graph.spring_st') }));
                d3.select('.search-header input').on('keyup.intro', searchResult);
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
                context.map().center(springSt);
                context.on('exit.intro', event.done);
                set(function() {
                    reveal('.entity-editor-pane',
                        t('intro.navigation.chosen', {
                            name: t('intro.graph.spring_st'),
                            button: iD.ui.intro.icon('#icon-close', 'pre-text')
                        }));
                }, 400);
            }
        };

        step.exit = function() {
            timeouts.forEach(window.clearTimeout);
            context.map().on('move.intro', null);
            context.on('enter.intro', null);
            context.on('exit.intro', null);
            d3.select('.search-header input')
                .on('keydown.intro', null)
                .on('keyup.intro', null);
        };

        return d3.rebind(step, event, 'on');
    }

    function point(context, reveal) {
        var event = d3.dispatch('done'),
            timeouts = [];

        var step = {
            title: 'intro.points.title'
        };

        function setTimeout(f, t) {
            timeouts.push(window.setTimeout(f, t));
        }

        function eventCancel() {
            d3.event.stopPropagation();
            d3.event.preventDefault();
        }

        step.enter = function() {
            context.map().centerZoom([-85.63279, 41.94394], 19);
            reveal('button.add-point',
                t('intro.points.add', { button: iD.ui.intro.icon('#icon-point', 'pre-text') }),
                { tooltipClass: 'intro-points-add' });

            var corner = [-85.632481,41.944094];

            context.on('enter.intro', addPoint);

            function addPoint(mode) {
                if (mode.id !== 'add-point') return;
                context.on('enter.intro', enterSelect);

                var pointBox = iD.ui.intro.pad(corner, 150, context);
                reveal(pointBox, t('intro.points.place'));

                context.map().on('move.intro', function() {
                    pointBox = iD.ui.intro.pad(corner, 150, context);
                    reveal(pointBox, t('intro.points.place'), {duration: 0});
                });
            }

            function enterSelect(mode) {
                if (mode.id !== 'select') return;
                context.map().on('move.intro', null);
                context.on('enter.intro', null);

                setTimeout(function() {
                    reveal('.preset-search-input',
                        t('intro.points.search', {name: context.presets().item('amenity/cafe').name()}));
                    d3.select('.preset-search-input').on('keyup.intro', keySearch);
                }, 500);
            }

            function keySearch() {
                var first = d3.select('.preset-list-item:first-child');
                if (first.classed('preset-amenity-cafe')) {
                    reveal(first.select('.preset-list-button').node(), t('intro.points.choose'));
                    d3.selection.prototype.one.call(context.history(), 'change.intro', selectedPreset);
                    d3.select('.preset-search-input')
                        .on('keydown.intro', eventCancel, true)
                        .on('keyup.intro', null);
                }
            }

            function selectedPreset() {
                setTimeout(function() {
                    reveal('.entity-editor-pane', t('intro.points.describe'), {tooltipClass: 'intro-points-describe'});
                    context.history().on('change.intro', closeEditor);
                    context.on('exit.intro', selectPoint);
                }, 400);
            }

            function closeEditor() {
                d3.select('.preset-search-input').on('keydown.intro', null);
                context.history().on('change.intro', null);
                reveal('.entity-editor-pane',
                    t('intro.points.close', { button: iD.ui.intro.icon('#icon-apply', 'pre-text') }));
            }

            function selectPoint() {
                context.on('exit.intro', null);
                context.history().on('change.intro', null);
                context.on('enter.intro', enterReselect);

                var pointBox = iD.ui.intro.pad(corner, 150, context);
                reveal(pointBox, t('intro.points.reselect'));

                context.map().on('move.intro', function() {
                    pointBox = iD.ui.intro.pad(corner, 150, context);
                    reveal(pointBox, t('intro.points.reselect'), {duration: 0});
                });
            }

            function enterReselect(mode) {
                if (mode.id !== 'select') return;
                context.map().on('move.intro', null);
                context.on('enter.intro', null);

                setTimeout(function() {
                    reveal('.entity-editor-pane',
                        t('intro.points.fixname', { button: iD.ui.intro.icon('#icon-apply', 'pre-text') }));
                    context.on('exit.intro', deletePoint);
                }, 500);
            }

            function deletePoint() {
                context.on('exit.intro', null);
                context.on('enter.intro', enterDelete);

                var pointBox = iD.ui.intro.pad(corner, 150, context);
                reveal(pointBox, t('intro.points.reselect_delete'));

                context.map().on('move.intro', function() {
                    pointBox = iD.ui.intro.pad(corner, 150, context);
                    reveal(pointBox, t('intro.points.reselect_delete'), {duration: 0});
                });
            }

            function enterDelete(mode) {
                if (mode.id !== 'select') return;
                context.map().on('move.intro', null);
                context.on('enter.intro', null);
                context.on('exit.intro', deletePoint);
                context.map().on('move.intro', deletePoint);
                context.history().on('change.intro', deleted);

                setTimeout(function() {
                    var node = d3.select('.radial-menu-item-delete').node();
                    var pointBox = iD.ui.intro.pad(node.getBoundingClientRect(), 50, context);
                    reveal(pointBox,
                        t('intro.points.delete', { button: iD.ui.intro.icon('#operation-delete', 'pre-text') }));
                }, 300);
            }

            function deleted(changed) {
                if (changed.deleted().length) event.done();
            }

        };

        step.exit = function() {
            timeouts.forEach(window.clearTimeout);
            context.on('exit.intro', null);
            context.on('enter.intro', null);
            context.map().on('move.intro', null);
            context.history().on('change.intro', null);
            d3.select('.preset-search-input')
                .on('keyup.intro', null)
                .on('keydown.intro', null);
        };

        return d3.rebind(step, event, 'on');
    }

    function startEditing(context, reveal) {
        var event = d3.dispatch('done', 'startEditing'),
            modal,
            timeouts = [];

        var step = {
            title: 'intro.startediting.title'
        };

        function timeout(f, t) {
            timeouts.push(window.setTimeout(f, t));
        }

        step.enter = function() {
            reveal('.map-control.help-control',
                t('intro.startediting.help', { button: iD.ui.intro.icon('#icon-help', 'pre-text') }));

            timeout(function() {
                reveal('#bar button.save', t('intro.startediting.save'));
            }, 5000);

            timeout(function() {
                reveal('#surface');
            }, 10000);

            timeout(function() {
                modal = iD.ui.modal(context.container());

                modal.select('.modal')
                    .attr('class', 'modal-splash modal col6');

                modal.selectAll('.close').remove();

                var startbutton = modal.select('.content')
                    .attr('class', 'fillL')
                        .append('button')
                            .attr('class', 'modal-section huge-modal-button')
                            .on('click', function() {
                                modal.remove();
                            });

                    startbutton.append('div')
                        .attr('class','illustration');
                    startbutton.append('h2')
                        .text(t('intro.startediting.start'));

                event.startEditing();
            }, 10500);
        };

        step.exit = function() {
            if (modal) modal.remove();
            timeouts.forEach(window.clearTimeout);
        };

        return d3.rebind(step, event, 'on');
    }

    exports.area = area;
    exports.line = line;
    exports.navigation = navigation;
    exports.point = point;
    exports.startEditing = startEditing;

    Object.defineProperty(exports, '__esModule', { value: true });

}));