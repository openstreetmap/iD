import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../../util/locale';
import { geoSphericalDistance } from '../../geo';
import { modeBrowse, modeSelect } from '../../modes';
import { utilRebind } from '../../util/rebind';
import { icon, pad, selectMenuItem } from './helper';


export function uiIntroLine(context, reveal) {
    var dispatch = d3.dispatch('done'),
        timeouts = [],
        tulipRoadId = null,
        flowerRoadId = 'w646',
        tulipRoadStart = [-85.6297754121684, 41.95805253325314],
        tulipRoadMidpoint = [-85.62975395449628, 41.95787501510204],
        tulipRoadIntersection = [-85.62974496187628, 41.95742515554585],
        roadCategory = context.presets().item('category-road'),
        residentialPreset = context.presets().item('highway/residential'),
        woodRoadId = 'w525',
        woodRoadEndId = 'n2862',
        woodRoadAddNode = [-85.62390110349587, 41.95397111462291],
        woodRoadDragEndpoint = [-85.62383958913921, 41.9546607846611],
        woodRoadDragMidpoint = [-85.62386254803509, 41.95430395953872],
        washingtonStreetId = 'w522',
        twelfthAvenueId = 'w1',
        eleventhAvenueEndId = 'n3550',
        twelfthAvenueEndId = 'n5',
        washingtonSegmentId = null,
        eleventhAvenueEnd = context.entity(eleventhAvenueEndId).loc,
        twelfthAvenueEnd = context.entity(twelfthAvenueEndId).loc,
        deleteLinesLoc = [-85.6219395542764, 41.95228033922477],
        twelfthAvenue = [-85.62219310052491, 41.952505413152956];


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
            context.history().checkpoint('doneAddLine');
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
        context.history().reset('doneAddLine');
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
                var padding = 250 * Math.pow(2, context.map().zoom() - 19);
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
        context.history().reset('doneAddLine');
        if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
            return chapter.restart();
        }

        var padding = 40 * Math.pow(2, context.map().zoom() - 19);
        var box = pad(woodRoadAddNode, padding, context);
        reveal(box, t('intro.lines.add_node'));

        context.map().on('move.intro drawn.intro', function() {
            var padding = 40 * Math.pow(2, context.map().zoom() - 19);
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
        if (context.selectedIDs().indexOf(woodRoadId) === -1) {
            context.enter(modeSelect(context, [woodRoadId]));
        }

        var padding = 100 * Math.pow(2, context.map().zoom() - 19);
        var box = pad(woodRoadDragEndpoint, padding, context);
        reveal(box, t('intro.lines.start_drag_endpoint'));

        context.map().on('move.intro drawn.intro', function() {
            if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
                return continueTo(updateLine);
            }
            var padding = 100 * Math.pow(2, context.map().zoom() - 19);
            var box = pad(woodRoadDragEndpoint, padding, context);
            reveal(box, t('intro.lines.start_drag_endpoint'), { duration: 0 });

            var entity = context.entity(woodRoadEndId);
            if (geoSphericalDistance(entity.loc, woodRoadDragEndpoint) <= 2) {
                continueTo(finishDragEndpoint);
            }
        });

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'select') {
                // keep Wood Road selected so endpoint stays draggable..
                context.enter(modeSelect(context, [woodRoadId]));
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
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
            var padding = 100 * Math.pow(2, context.map().zoom() - 19);
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
        if (context.selectedIDs().indexOf(woodRoadId) === -1) {
            context.enter(modeSelect(context, [woodRoadId]));
        }

        var padding = 80 * Math.pow(2, context.map().zoom() - 19);
        var box = pad(woodRoadDragMidpoint, padding, context);
        reveal(box, t('intro.lines.start_drag_midpoint'));

        context.map().on('move.intro drawn.intro', function() {
            if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
                return continueTo(updateLine);
            }
            var padding = 80 * Math.pow(2, context.map().zoom() - 19);
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

        var advance = function() {
            context.history().checkpoint('doneUpdateLine');
            continueTo(deleteLines);
        };

        reveal(box, t('intro.lines.continue_drag_midpoint'),
            { buttonText: t('intro.ok'), buttonCallback: advance }
        );

        context.map().on('move.intro drawn.intro', function() {
            if (!context.hasEntity(woodRoadId) || !context.hasEntity(woodRoadEndId)) {
                return continueTo(updateLine);
            }
            var padding = 100 * Math.pow(2, context.map().zoom() - 19);
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


    function deleteLines() {
        context.history().reset('doneUpdateLine');
        context.enter(modeBrowse(context));

        if (!context.hasEntity(washingtonStreetId) ||
            !context.hasEntity(twelfthAvenueId) ||
            !context.hasEntity(eleventhAvenueEndId)) {
            return chapter.restart();
        }

        context.map().zoom(18).centerEase(deleteLinesLoc, 500);

        timeout(function() {
            var padding = 200 * Math.pow(2, context.map().zoom() - 18);
            var box = pad(deleteLinesLoc, padding, context);
            box.top -= 200;
            box.height += 400;
            var advance = function() { continueTo(rightClickIntersection); };

            reveal(box, t('intro.lines.delete_lines', { street: t('intro.graph.name.12th-avenue') }),
                { buttonText: t('intro.ok'), buttonCallback: advance }
            );

            context.map().on('move.intro drawn.intro', function() {
                var padding = 200 * Math.pow(2, context.map().zoom() - 18);
                var box = pad(deleteLinesLoc, padding, context);
                box.top -= 200;
                box.height += 400;
                reveal(box, t('intro.lines.delete_lines', { street: t('intro.graph.name.12th-avenue') }),
                    { duration: 0, buttonText: t('intro.ok'), buttonCallback: advance }
                );
            });

            context.history().on('change.intro', function() {
                timeout(function() {
                    continueTo(deleteLines);
                }, 500);  // after any transition (e.g. if user deleted intersection)
            });

        }, 550);

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function rightClickIntersection() {
        context.history().reset('doneUpdateLine');
        context.enter(modeBrowse(context));
        context.map().zoom(18).centerEase(eleventhAvenueEnd, 500);

        timeout(function() {
            var padding = 60 * Math.pow(2, context.map().zoom() - 18);
            var box = pad(eleventhAvenueEnd, padding, context);
            reveal(box, t('intro.lines.rightclick_intersection',
                { street1: t('intro.graph.name.11th-avenue'), street2: t('intro.graph.name.washington-street') })
            );

            context.map().on('move.intro drawn.intro', function() {
                var padding = 60 * Math.pow(2, context.map().zoom() - 18);
                var box = pad(eleventhAvenueEnd, padding, context);
                reveal(box, t('intro.lines.rightclick_intersection',
                    { street1: t('intro.graph.name.11th-avenue'), street2: t('intro.graph.name.washington-street') }),
                    { duration: 0 }
                );
            });

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'select') return;
                var ids = context.selectedIDs();
                if (ids.length !== 1 || ids[0] !== eleventhAvenueEndId) return;

                timeout(function() {
                    var node = selectMenuItem('split').node();
                    if (!node) return;
                    continueTo(splitIntersection);
                }, 300);  // after menu visible
            });

            context.history().on('change.intro', function() {
                timeout(function() {
                    continueTo(deleteLines);
                }, 300);  // after any transition (e.g. if user deleted intersection)
            });

        }, 550);

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function splitIntersection() {
        if (!context.hasEntity(washingtonStreetId) ||
            !context.hasEntity(twelfthAvenueId) ||
            !context.hasEntity(eleventhAvenueEndId)) {
            return continueTo(deleteLines);
        }

        var node = selectMenuItem('split').node();
        if (!node) { return continueTo(rightClickIntersection); }

        var wasChanged = false;
        washingtonSegmentId = null;

        var padding = 60 * Math.pow(2, context.map().zoom() - 18);
        var box = pad(eleventhAvenueEnd, padding, context);
        box.width += 100;
        box.height += 120;

        reveal(box, t('intro.lines.split_intersection',
            { button: icon('#operation-split', 'pre-text'), street: t('intro.graph.name.washington-street') })
        );

        context.map().on('move.intro drawn.intro', function() {
            var node = selectMenuItem('split').node();
            if (!wasChanged && !node) { return continueTo(rightClickIntersection); }

            var padding = 60 * Math.pow(2, context.map().zoom() - 18);
            var box = pad(eleventhAvenueEnd, padding, context);
            box.width += 100;
            box.height += 120;
            reveal(box, t('intro.lines.split_intersection',
                { button: icon('#operation-split', 'pre-text'), street: t('intro.graph.name.washington-street') }),
                { duration: 0 }
            );
        });

        context.history().on('change.intro', function(changed) {
            wasChanged = true;
            timeout(function() {
                if (context.history().undoAnnotation() === t('operations.split.annotation.line')) {
                    washingtonSegmentId = changed.created()[0].id;
                    continueTo(didSplit);
                } else {
                    washingtonSegmentId = null;
                    continueTo(retrySplit);
                }
            }, 300);  // after any transition (e.g. if user deleted intersection)
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function retrySplit() {
        context.enter(modeBrowse(context));
        context.map().zoom(18).centerEase(eleventhAvenueEnd, 500);
        var advance = function() { continueTo(rightClickIntersection); };

        var padding = 60 * Math.pow(2, context.map().zoom() - 18);
        var box = pad(eleventhAvenueEnd, padding, context);
        reveal(box, t('intro.lines.retry_split'),
            { buttonText: t('intro.ok'), buttonCallback: advance }
        );

        context.map().on('move.intro drawn.intro', function() {
            var padding = 60 * Math.pow(2, context.map().zoom() - 18);
            var box = pad(eleventhAvenueEnd, padding, context);
            reveal(box, t('intro.lines.retry_split'),
                { duration: 0, buttonText: t('intro.ok'), buttonCallback: advance }
            );
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function didSplit() {
        if (!washingtonSegmentId ||
            !context.hasEntity(washingtonSegmentId) ||
            !context.hasEntity(washingtonStreetId) ||
            !context.hasEntity(twelfthAvenueId) ||
            !context.hasEntity(eleventhAvenueEndId)) {
            return continueTo(rightClickIntersection);
        }

        context.map().zoom(18).centerEase(twelfthAvenue, 400);

        var ids = context.selectedIDs();
        var string = 'intro.lines.did_split_' + (ids.length > 1 ? 'multi' : 'single');

        var street = t('intro.graph.name.washington-street');
        var padding = 200 * Math.pow(2, context.map().zoom() - 18);
        var box = pad(twelfthAvenue, padding, context);
        box.width = box.width / 2;
        reveal(box, t(string, { street1: street, street2: street }));

        context.map().on('move.intro drawn.intro', function() {
            var padding = 200 * Math.pow(2, context.map().zoom() - 18);
            var box = pad(twelfthAvenue, padding, context);
            box.width = box.width / 2;
            reveal(box, t(string, { street1: street, street2: street }),
                { duration: 0 }
            );
        });

        context.on('enter.intro', function() {
            var ids = context.selectedIDs();
            if (ids.length === 1 && ids[0] === washingtonSegmentId) {
                continueTo(multiSelect);
            }
        });

        context.history().on('change.intro', function() {
            if (!washingtonSegmentId ||
                !context.hasEntity(washingtonSegmentId) ||
                !context.hasEntity(washingtonStreetId) ||
                !context.hasEntity(twelfthAvenueId) ||
                !context.hasEntity(eleventhAvenueEndId)) {
                return continueTo(rightClickIntersection);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function multiSelect() {
        if (!washingtonSegmentId ||
            !context.hasEntity(washingtonSegmentId) ||
            !context.hasEntity(washingtonStreetId) ||
            !context.hasEntity(twelfthAvenueId) ||
            !context.hasEntity(eleventhAvenueEndId)) {
            return continueTo(rightClickIntersection);
        }

        var ids = context.selectedIDs();
        var hasWashington = ids.indexOf(washingtonSegmentId) !== -1;
        var hasTwelfth = ids.indexOf(twelfthAvenueId) !== -1;

        if (hasWashington && hasTwelfth) {
            return continueTo(multiRightClick);
        } else if (!hasWashington && !hasTwelfth) {
            return continueTo(didSplit);
        }

        context.map().zoom(18).centerEase(twelfthAvenue, 400);

        timeout(function() {
            var selected, other, padding, box;
            if (hasWashington) {
                selected = t('intro.graph.name.washington-street');
                other = t('intro.graph.name.12th-avenue');
                padding = 60 * Math.pow(2, context.map().zoom() - 18);
                box = pad(twelfthAvenueEnd, padding, context);
                box.width *= 3;
            } else {
                selected = t('intro.graph.name.12th-avenue');
                other = t('intro.graph.name.washington-street');
                padding = 200 * Math.pow(2, context.map().zoom() - 18);
                box = pad(twelfthAvenue, padding, context);
                box.width /= 2;
            }

            reveal(box,
                t('intro.lines.multi_select', { selected: selected, other1: other, other2: other })
            );

            context.map().on('move.intro drawn.intro', function() {
                if (hasWashington) {
                    selected = t('intro.graph.name.washington-street');
                    other = t('intro.graph.name.12th-avenue');
                    padding = 60 * Math.pow(2, context.map().zoom() - 18);
                    box = pad(twelfthAvenueEnd, padding, context);
                    box.width *= 3;
                } else {
                    selected = t('intro.graph.name.12th-avenue');
                    other = t('intro.graph.name.washington-street');
                    padding = 200 * Math.pow(2, context.map().zoom() - 18);
                    box = pad(twelfthAvenue, padding, context);
                    box.width /= 2;
                }

                reveal(box,
                    t('intro.lines.multi_select', { selected: selected, other1: other, other2: other }),
                    { duration: 0 }
                );
            });

            context.on('enter.intro', function() {
                continueTo(multiSelect);
            });

            context.history().on('change.intro', function() {
                if (!washingtonSegmentId ||
                    !context.hasEntity(washingtonSegmentId) ||
                    !context.hasEntity(washingtonStreetId) ||
                    !context.hasEntity(twelfthAvenueId) ||
                    !context.hasEntity(eleventhAvenueEndId)) {
                    return continueTo(rightClickIntersection);
                }
            });
        }, 450);

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function multiRightClick() {
        if (!washingtonSegmentId ||
            !context.hasEntity(washingtonSegmentId) ||
            !context.hasEntity(washingtonStreetId) ||
            !context.hasEntity(twelfthAvenueId) ||
            !context.hasEntity(eleventhAvenueEndId)) {
            return continueTo(rightClickIntersection);
        }

        var padding = 200 * Math.pow(2, context.map().zoom() - 18);
        var box = pad(twelfthAvenue, padding, context);
        reveal(box, t('intro.lines.multi_rightclick'));

        context.map().on('move.intro drawn.intro', function() {
            var padding = 200 * Math.pow(2, context.map().zoom() - 18);
            var box = pad(twelfthAvenue, padding, context);
            reveal(box, t('intro.lines.multi_rightclick'), { duration: 0 });
        });

        d3.select(window).on('click.intro contextmenu.intro', function() {
            timeout(function() {
                var ids = context.selectedIDs();
                if (ids.length === 2 &&
                    ids.indexOf(twelfthAvenueId) !== -1 &&
                    ids.indexOf(washingtonSegmentId) !== -1) {
                        var node = selectMenuItem('delete').node();
                        if (!node) return;
                        continueTo(multiDelete);
                } else if (ids.length === 1 &&
                    ids.indexOf(washingtonSegmentId) !== -1) {
                    return continueTo(multiSelect);
                } else {
                    return continueTo(didSplit);
                }
            }, 300);  // after edit menu visible
        }, true);

        context.history().on('change.intro', function() {
            if (!washingtonSegmentId ||
                !context.hasEntity(washingtonSegmentId) ||
                !context.hasEntity(washingtonStreetId) ||
                !context.hasEntity(twelfthAvenueId) ||
                !context.hasEntity(eleventhAvenueEndId)) {
                return continueTo(rightClickIntersection);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            d3.select(window).on('click.intro contextmenu.intro', null, true);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function multiDelete() {
        if (!washingtonSegmentId ||
            !context.hasEntity(washingtonSegmentId) ||
            !context.hasEntity(washingtonStreetId) ||
            !context.hasEntity(twelfthAvenueId) ||
            !context.hasEntity(eleventhAvenueEndId)) {
            return continueTo(rightClickIntersection);
        }

        var node = selectMenuItem('delete').node();
        if (!node) return continueTo(multiRightClick);

        var padding = 200 * Math.pow(2, context.map().zoom() - 18);
        var box = pad(twelfthAvenue, padding, context);
        reveal(box,
            t('intro.lines.multi_delete', { button: icon('#operation-delete', 'pre-text') })
        );

        context.map().on('move.intro drawn.intro', function() {
            var padding = 200 * Math.pow(2, context.map().zoom() - 18);
            var box = pad(twelfthAvenue, padding, context);
            reveal(box,
                t('intro.lines.multi_delete', { button: icon('#operation-delete', 'pre-text') }),
                { duration: 0 }
            );
        });

        context.on('exit.intro', function() {
            if (context.hasEntity(washingtonSegmentId) || context.hasEntity(twelfthAvenueId)) {
                return continueTo(multiSelect);  // left select mode but roads still exist
            }
        });

        context.history().on('change.intro', function() {
            if (context.hasEntity(washingtonSegmentId) || context.hasEntity(twelfthAvenueId)) {
                continueTo(retryDelete);         // changed something but roads still exist
            } else {
                continueTo(play);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function retryDelete() {
        context.enter(modeBrowse(context));

        var padding = 200 * Math.pow(2, context.map().zoom() - 18);
        var box = pad(twelfthAvenue, padding, context);
        reveal(box, t('intro.lines.retry_delete'), {
            buttonText: t('intro.ok'),
            buttonCallback: function() { continueTo(multiSelect); }
        });

        function continueTo(nextStep) {
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
