import _some from 'lodash-es/some';

import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t, textDirection } from '../../util/locale';
import { geoSphericalDistance } from '../../geo';
import { modeBrowse, modeSelect } from '../../modes';
import { utilRebind } from '../../util/rebind';
import { icon, pad, selectMenuItem, transitionTime } from './helper';


export function uiIntroLine(context, reveal) {
    var dispatch = d3_dispatch('done');
    var timeouts = [];
    var _tulipRoadID = null;
    var flowerRoadID = 'w646';
    var tulipRoadStart = [-85.6297754121684, 41.95805253325314];
    var tulipRoadMidpoint = [-85.62975395449628, 41.95787501510204];
    var tulipRoadIntersection = [-85.62974496187628, 41.95742515554585];
    var roadCategory = context.presets().item('category-road');
    var residentialPreset = context.presets().item('highway/residential');
    var woodRoadID = 'w525';
    var woodRoadEndID = 'n2862';
    var woodRoadAddNode = [-85.62390110349587, 41.95397111462291];
    var woodRoadDragEndpoint = [-85.623867390213, 41.95466987786487];
    var woodRoadDragMidpoint = [-85.62386254803509, 41.95430395953872];
    var washingtonStreetID = 'w522';
    var twelfthAvenueID = 'w1';
    var eleventhAvenueEndID = 'n3550';
    var twelfthAvenueEndID = 'n5';
    var _washingtonSegmentID = null;
    var eleventhAvenueEnd = context.entity(eleventhAvenueEndID).loc;
    var twelfthAvenueEnd = context.entity(twelfthAvenueEndID).loc;
    var deleteLinesLoc = [-85.6219395542764, 41.95228033922477];
    var twelfthAvenue = [-85.62219310052491, 41.952505413152956];


    var chapter = {
        title: 'intro.lines.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel() {
        d3_event.stopPropagation();
        d3_event.preventDefault();
    }


    function revealEditMenu(loc, text, options) {
        var rect = context.surfaceRect();
        var point = context.curtainProjection(loc);
        var pad = 40;
        var width = 250 + (2 * pad);
        var height = 350;
        var startX = rect.left + point[0];
        var left = (textDirection === 'rtl') ? (startX - width + pad) : (startX - pad);
        var box = {
            left: left,
            top: point[1] + rect.top - 60,
            width: width,
            height: height
        };
        reveal(box, text, options);
    }


    function addLine() {
        context.enter(modeBrowse(context));
        context.history().reset('initial');

        var msec = transitionTime(tulipRoadStart, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().zoom(18.5).centerEase(tulipRoadStart, msec);

        timeout(function() {
            var tooltip = reveal('button.add-line',
                t('intro.lines.add_line', { button: icon('#iD-icon-line', 'pre-text') }));

            tooltip.selectAll('.tooltip-inner')
                .insert('svg', 'span')
                .attr('class', 'tooltip-illustration')
                .append('use')
                .attr('xlink:href', '#iD-graphic-lines');

            context.on('enter.intro', function(mode) {
                if (mode.id !== 'add-line') return;
                continueTo(startLine);
            });
        }, msec + 100);

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function startLine() {
        if (context.mode().id !== 'add-line') return chapter.restart();

        _tulipRoadID = null;

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
        if (context.mode().id !== 'draw-line') return chapter.restart();

        _tulipRoadID = context.mode().selectedIDs()[0];
        context.map().centerEase(tulipRoadMidpoint, 500);

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
        }, 550);  // after easing..

        context.history().on('change.intro', function() {
            if (isLineConnected()) {
                continueTo(continueLine);
            }
        });

        context.on('enter.intro', function(mode) {
            if (mode.id === 'draw-line') {
                return;
            } else if (mode.id === 'select') {
                continueTo(retryIntersect);
                return;
            } else {
                return chapter.restart();
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            context.on('enter.intro', null);
            nextStep();
        }
    }


    function isLineConnected() {
        var entity = _tulipRoadID && context.hasEntity(_tulipRoadID);
        if (!entity) return false;

        var drawNodes = context.graph().childNodes(entity);
        return _some(drawNodes, function(node) {
            return _some(context.graph().parentWays(node), function(parent) {
                return parent.id === flowerRoadID;
            });
        });
    }


    function retryIntersect() {
        d3_select(window).on('mousedown.intro', eventCancel, true);

        var box = pad(tulipRoadIntersection, 80, context);
        reveal(box,
            t('intro.lines.retry_intersect', { name: t('intro.graph.name.flower-street') })
        );

        timeout(chapter.restart, 3000);
    }


    function continueLine() {
        if (context.mode().id !== 'draw-line') return chapter.restart();
        var entity = _tulipRoadID && context.hasEntity(_tulipRoadID);
        if (!entity) return chapter.restart();

        context.map().centerEase(tulipRoadIntersection, 500);

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
        if (context.mode().id !== 'select') return chapter.restart();

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        var button = d3_select('.preset-category-road .preset-list-button');
        if (button.empty()) return chapter.restart();

        // disallow scrolling
        d3_select('.inspector-wrap').on('wheel.intro', eventCancel);

        timeout(function() {
            // reset pane, in case user somehow happened to change it..
            d3_select('.inspector-wrap .panewrap').style('right', '-100%');

            reveal(button.node(),
                t('intro.lines.choose_category_road', { category: roadCategory.name() })
            );

            button.on('click.intro', function() {
                continueTo(choosePresetResidential);
            });

        }, 400);  // after editor pane visible

        function continueTo(nextStep) {
            d3_select('.inspector-wrap').on('wheel.intro', null);
            d3_select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function choosePresetResidential() {
        if (context.mode().id !== 'select') return chapter.restart();

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        var subgrid = d3_select('.preset-category-road .subgrid');
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
                t('intro.lines.choose_preset_residential', { preset: residentialPreset.name() }),
                { tooltipBox: '.preset-highway-residential .preset-list-button', duration: 300 }
            );
        }, 300);

        function continueTo(nextStep) {
            d3_select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    // selected wrong road type
    function retryPresetResidential() {
        if (context.mode().id !== 'select') return chapter.restart();

        context.on('exit.intro', function() {
            return chapter.restart();
        });

        // disallow scrolling
        d3_select('.inspector-wrap').on('wheel.intro', eventCancel);

        timeout(function() {
            var button = d3_select('.entity-editor-pane .preset-list-button');

            reveal(button.node(),
                t('intro.lines.retry_preset_residential', { preset: residentialPreset.name() })
            );

            button.on('click.intro', function() {
                continueTo(chooseCategoryRoad);
            });

        }, 500);

        function continueTo(nextStep) {
            d3_select('.inspector-wrap').on('wheel.intro', null);
            d3_select('.preset-list-button').on('click.intro', null);
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function nameRoad() {
        context.on('exit.intro', function() {
            continueTo(didNameRoad);
        });

        timeout(function() {
            reveal('.entity-editor-pane',
                t('intro.lines.name_road', { button: icon('#iD-icon-apply', 'pre-text') }),
                { tooltipClass: 'intro-lines-name_road' }
            );
        }, 500);

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function didNameRoad() {
        context.history().checkpoint('doneAddLine');

        timeout(function() {
            reveal('#surface', t('intro.lines.did_name_road'), {
                buttonText: t('intro.ok'),
                buttonCallback: function() { continueTo(updateLine); }
            });
        }, 500);

        function continueTo(nextStep) {
            nextStep();
        }
    }


    function updateLine() {
        context.history().reset('doneAddLine');
        if (!context.hasEntity(woodRoadID) || !context.hasEntity(woodRoadEndID)) {
            return chapter.restart();
        }

        var msec = transitionTime(woodRoadDragMidpoint, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().zoom(19).centerEase(woodRoadDragMidpoint, msec);

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
        }, msec + 100);

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function addNode() {
        context.history().reset('doneAddLine');
        if (!context.hasEntity(woodRoadID) || !context.hasEntity(woodRoadEndID)) {
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
            if (!context.hasEntity(woodRoadID) || !context.hasEntity(woodRoadEndID)) {
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
        if (!context.hasEntity(woodRoadID) || !context.hasEntity(woodRoadEndID)) {
            return continueTo(updateLine);
        }
        var padding = 100 * Math.pow(2, context.map().zoom() - 19);
        var box = pad(woodRoadDragEndpoint, padding, context);
        reveal(box, t('intro.lines.start_drag_endpoint'));

        context.map().on('move.intro drawn.intro', function() {
            if (!context.hasEntity(woodRoadID) || !context.hasEntity(woodRoadEndID)) {
                return continueTo(updateLine);
            }
            var padding = 100 * Math.pow(2, context.map().zoom() - 19);
            var box = pad(woodRoadDragEndpoint, padding, context);
            reveal(box, t('intro.lines.start_drag_endpoint'), { duration: 0 });

            var entity = context.entity(woodRoadEndID);
            if (geoSphericalDistance(entity.loc, woodRoadDragEndpoint) <= 4) {
                continueTo(finishDragEndpoint);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function finishDragEndpoint() {
        if (!context.hasEntity(woodRoadID) || !context.hasEntity(woodRoadEndID)) {
            return continueTo(updateLine);
        }

        var padding = 100 * Math.pow(2, context.map().zoom() - 19);
        var box = pad(woodRoadDragEndpoint, padding, context);
        reveal(box, t('intro.lines.finish_drag_endpoint'));

        context.map().on('move.intro drawn.intro', function() {
            if (!context.hasEntity(woodRoadID) || !context.hasEntity(woodRoadEndID)) {
                return continueTo(updateLine);
            }
            var padding = 100 * Math.pow(2, context.map().zoom() - 19);
            var box = pad(woodRoadDragEndpoint, padding, context);
            reveal(box, t('intro.lines.finish_drag_endpoint'), { duration: 0 });

            var entity = context.entity(woodRoadEndID);
            if (geoSphericalDistance(entity.loc, woodRoadDragEndpoint) > 4) {
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
        if (!context.hasEntity(woodRoadID) || !context.hasEntity(woodRoadEndID)) {
            return continueTo(updateLine);
        }
        if (context.selectedIDs().indexOf(woodRoadID) === -1) {
            context.enter(modeSelect(context, [woodRoadID]));
        }

        var padding = 80 * Math.pow(2, context.map().zoom() - 19);
        var box = pad(woodRoadDragMidpoint, padding, context);
        reveal(box, t('intro.lines.start_drag_midpoint'));

        context.map().on('move.intro drawn.intro', function() {
            if (!context.hasEntity(woodRoadID) || !context.hasEntity(woodRoadEndID)) {
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
                context.enter(modeSelect(context, [woodRoadID]));
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
        if (!context.hasEntity(woodRoadID) || !context.hasEntity(woodRoadEndID)) {
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
            if (!context.hasEntity(woodRoadID) || !context.hasEntity(woodRoadEndID)) {
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

        if (!context.hasEntity(washingtonStreetID) ||
            !context.hasEntity(twelfthAvenueID) ||
            !context.hasEntity(eleventhAvenueEndID)) {
            return chapter.restart();
        }

        var msec = transitionTime(deleteLinesLoc, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().zoom(18).centerEase(deleteLinesLoc, msec);

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

        }, msec + 100);

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
                if (ids.length !== 1 || ids[0] !== eleventhAvenueEndID) return;

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

        }, 600);

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function splitIntersection() {
        if (!context.hasEntity(washingtonStreetID) ||
            !context.hasEntity(twelfthAvenueID) ||
            !context.hasEntity(eleventhAvenueEndID)) {
            return continueTo(deleteLines);
        }

        var node = selectMenuItem('split').node();
        if (!node) { return continueTo(rightClickIntersection); }

        var wasChanged = false;
        var menuCoords = context.map().mouseCoordinates();
        _washingtonSegmentID = null;

        revealEditMenu(menuCoords, t('intro.lines.split_intersection',
            { button: icon('#iD-operation-split', 'pre-text'), street: t('intro.graph.name.washington-street') })
        );

        context.map().on('move.intro drawn.intro', function() {
            var node = selectMenuItem('split').node();
            if (!wasChanged && !node) { return continueTo(rightClickIntersection); }

            revealEditMenu(menuCoords, t('intro.lines.split_intersection',
                { button: icon('#iD-operation-split', 'pre-text'), street: t('intro.graph.name.washington-street') }),
                { duration: 0 }
            );
        });

        context.history().on('change.intro', function(changed) {
            wasChanged = true;
            timeout(function() {
                if (context.history().undoAnnotation() === t('operations.split.annotation.line')) {
                    _washingtonSegmentID = changed.created()[0].id;
                    continueTo(didSplit);
                } else {
                    _washingtonSegmentID = null;
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
        if (!_washingtonSegmentID ||
            !context.hasEntity(_washingtonSegmentID) ||
            !context.hasEntity(washingtonStreetID) ||
            !context.hasEntity(twelfthAvenueID) ||
            !context.hasEntity(eleventhAvenueEndID)) {
            return continueTo(rightClickIntersection);
        }

        var ids = context.selectedIDs();
        var string = 'intro.lines.did_split_' + (ids.length > 1 ? 'multi' : 'single');
        var street = t('intro.graph.name.washington-street');

        var padding = 200 * Math.pow(2, context.map().zoom() - 18);
        var box = pad(twelfthAvenue, padding, context);
        box.width = box.width / 2;
        reveal(box, t(string, { street1: street, street2: street }),
            { duration: 500 }
        );

        timeout(function() {
            context.map().zoom(18).centerEase(twelfthAvenue, 500);

            context.map().on('move.intro drawn.intro', function() {
                var padding = 200 * Math.pow(2, context.map().zoom() - 18);
                var box = pad(twelfthAvenue, padding, context);
                box.width = box.width / 2;
                reveal(box, t(string, { street1: street, street2: street }),
                    { duration: 0 }
                );
            });
        }, 600);  // after initial reveal and curtain cut

        context.on('enter.intro', function() {
            var ids = context.selectedIDs();
            if (ids.length === 1 && ids[0] === _washingtonSegmentID) {
                continueTo(multiSelect);
            }
        });

        context.history().on('change.intro', function() {
            if (!_washingtonSegmentID ||
                !context.hasEntity(_washingtonSegmentID) ||
                !context.hasEntity(washingtonStreetID) ||
                !context.hasEntity(twelfthAvenueID) ||
                !context.hasEntity(eleventhAvenueEndID)) {
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
        if (!_washingtonSegmentID ||
            !context.hasEntity(_washingtonSegmentID) ||
            !context.hasEntity(washingtonStreetID) ||
            !context.hasEntity(twelfthAvenueID) ||
            !context.hasEntity(eleventhAvenueEndID)) {
            return continueTo(rightClickIntersection);
        }

        var ids = context.selectedIDs();
        var hasWashington = ids.indexOf(_washingtonSegmentID) !== -1;
        var hasTwelfth = ids.indexOf(twelfthAvenueID) !== -1;

        if (hasWashington && hasTwelfth) {
            return continueTo(multiRightClick);
        } else if (!hasWashington && !hasTwelfth) {
            return continueTo(didSplit);
        }

        context.map().zoom(18).centerEase(twelfthAvenue, 500);

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
                if (!_washingtonSegmentID ||
                    !context.hasEntity(_washingtonSegmentID) ||
                    !context.hasEntity(washingtonStreetID) ||
                    !context.hasEntity(twelfthAvenueID) ||
                    !context.hasEntity(eleventhAvenueEndID)) {
                    return continueTo(rightClickIntersection);
                }
            });
        }, 600);

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function multiRightClick() {
        if (!_washingtonSegmentID ||
            !context.hasEntity(_washingtonSegmentID) ||
            !context.hasEntity(washingtonStreetID) ||
            !context.hasEntity(twelfthAvenueID) ||
            !context.hasEntity(eleventhAvenueEndID)) {
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

        d3_select(window).on('click.intro contextmenu.intro', function() {
            timeout(function() {
                var ids = context.selectedIDs();
                if (ids.length === 2 &&
                    ids.indexOf(twelfthAvenueID) !== -1 &&
                    ids.indexOf(_washingtonSegmentID) !== -1) {
                        var node = selectMenuItem('delete').node();
                        if (!node) return;
                        continueTo(multiDelete);
                } else if (ids.length === 1 &&
                    ids.indexOf(_washingtonSegmentID) !== -1) {
                    return continueTo(multiSelect);
                } else {
                    return continueTo(didSplit);
                }
            }, 300);  // after edit menu visible
        }, true);

        context.history().on('change.intro', function() {
            if (!_washingtonSegmentID ||
                !context.hasEntity(_washingtonSegmentID) ||
                !context.hasEntity(washingtonStreetID) ||
                !context.hasEntity(twelfthAvenueID) ||
                !context.hasEntity(eleventhAvenueEndID)) {
                return continueTo(rightClickIntersection);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            d3_select(window).on('click.intro contextmenu.intro', null, true);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function multiDelete() {
        if (!_washingtonSegmentID ||
            !context.hasEntity(_washingtonSegmentID) ||
            !context.hasEntity(washingtonStreetID) ||
            !context.hasEntity(twelfthAvenueID) ||
            !context.hasEntity(eleventhAvenueEndID)) {
            return continueTo(rightClickIntersection);
        }

        var node = selectMenuItem('delete').node();
        if (!node) return continueTo(multiRightClick);

        var menuCoords = context.map().mouseCoordinates();
        revealEditMenu(menuCoords,
            t('intro.lines.multi_delete', { button: icon('#iD-operation-delete', 'pre-text') })
        );

        context.map().on('move.intro drawn.intro', function() {
            revealEditMenu(menuCoords,
                t('intro.lines.multi_delete', { button: icon('#iD-operation-delete', 'pre-text') }),
                { duration: 0 }
            );
        });

        context.on('exit.intro', function() {
            if (context.hasEntity(_washingtonSegmentID) || context.hasEntity(twelfthAvenueID)) {
                return continueTo(multiSelect);  // left select mode but roads still exist
            }
        });

        context.history().on('change.intro', function() {
            if (context.hasEntity(_washingtonSegmentID) || context.hasEntity(twelfthAvenueID)) {
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
        reveal('#id-container',
            t('intro.lines.play', { next: t('intro.buildings.title') }), {
                tooltipBox: '.intro-nav-wrap .chapter-building',
                buttonText: t('intro.ok'),
                buttonCallback: function() { reveal('#id-container'); }
            }
        );
   }


    chapter.enter = function() {
        addLine();
    };


    chapter.exit = function() {
        timeouts.forEach(window.clearTimeout);
        d3_select(window).on('mousedown.intro', null, true);
        context.on('enter.intro exit.intro', null);
        context.map().on('move.intro drawn.intro', null);
        context.history().on('change.intro', null);
        d3_select('.inspector-wrap').on('wheel.intro', null);
        d3_select('.preset-list-button').on('click.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
