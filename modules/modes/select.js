import { event as d3_event, select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';

import { actionAddMidpoint } from '../actions/add_midpoint';
import { actionDeleteRelation } from '../actions/delete_relation';
import { actionMove } from '../actions/move';

import { behaviorBreathe } from '../behavior/breathe';
import { behaviorHover } from '../behavior/hover';
import { behaviorLasso } from '../behavior/lasso';
import { behaviorPaste } from '../behavior/paste';
import { behaviorSelect } from '../behavior/select';

import { operationMove } from '../operations/move';

import { geoExtent, geoChooseEdge } from '../geo';
import { modeBrowse } from './browse';
import { modeDragNode } from './drag_node';
import { modeDragNote } from './drag_note';
import { osmNode, osmWay } from '../osm';
import * as Operations from '../operations/index';
import { uiCmd } from '../ui/cmd';
import {
    utilArrayIntersection, utilDeepMemberSelector, utilEntityOrDeepMemberSelector,
    utilEntitySelector, utilKeybinding
} from '../util';


var _relatedParent;


export function modeSelect(context, selectedIDs) {
    var mode = {
        id: 'select',
        button: 'browse'
    };

    var keybinding = utilKeybinding('select');

    var _breatheBehavior = behaviorBreathe(context);
    var _modeDragNode = modeDragNode(context);
    var _selectBehavior;
    var _behaviors = [];

    var _operations = [];
    var _newFeature = false;
    var _follow = false;


    function singular() {
        if (selectedIDs && selectedIDs.length === 1) {
            return context.hasEntity(selectedIDs[0]);
        }
    }

    function selectedEntities() {
        return selectedIDs.map(function(id) {
            return context.hasEntity(id);
        }).filter(Boolean);
    }


    function checkSelectedIDs() {
        var ids = [];
        if (Array.isArray(selectedIDs)) {
            ids = selectedIDs.filter(function(id) {
                return context.hasEntity(id);
            });
        }

        if (!ids.length) {
            context.enter(modeBrowse(context));
            return false;
        } else if ((selectedIDs.length > 1 && ids.length === 1) ||
            (selectedIDs.length === 1 && ids.length > 1)) {
            // switch between single- and multi-select UI
            context.enter(modeSelect(context, ids));
            return false;
        }

        selectedIDs = ids;
        return true;
    }


    // find the common parent ways for nextVertex, previousVertex
    function commonParents() {
        var graph = context.graph();
        var commonParents = [];

        for (var i = 0; i < selectedIDs.length; i++) {
            var entity = context.hasEntity(selectedIDs[i]);
            if (!entity || entity.geometry(graph) !== 'vertex') {
                return [];  // selection includes some not vertices
            }

            var currParents = graph.parentWays(entity).map(function(w) { return w.id; });
            if (!commonParents.length) {
                commonParents = currParents;
                continue;
            }

            commonParents = utilArrayIntersection(commonParents, currParents);
            if (!commonParents.length) {
                return [];
            }
        }

        return commonParents;
    }


    function singularParent() {
        var parents = commonParents();
        if (!parents || parents.length === 0) {
            _relatedParent = null;
            return null;
        }

        // relatedParent is used when we visit a vertex with multiple
        // parents, and we want to remember which parent line we started on.

        if (parents.length === 1) {
            _relatedParent = parents[0];  // remember this parent for later
            return _relatedParent;
        }

        if (parents.indexOf(_relatedParent) !== -1) {
            return _relatedParent;   // prefer the previously seen parent
        }

        return parents[0];
    }


    mode.selectedIDs = function(val) {
        if (!arguments.length) return selectedIDs;
        selectedIDs = val;
        return mode;
    };


    mode.zoomToSelected = function() {
        context.map().zoomToEase(selectedEntities());
    };


    mode.newFeature = function(val) {
        if (!arguments.length) return _newFeature;
        _newFeature = val;
        return mode;
    };


    mode.selectBehavior = function(val) {
        if (!arguments.length) return _selectBehavior;
        _selectBehavior = val;
        return mode;
    };


    mode.follow = function(val) {
        if (!arguments.length) return _follow;
        _follow = val;
        return mode;
    };

    function loadOperations() {

        _operations.forEach(function(operation) {
            if (operation.behavior) {
                context.uninstall(operation.behavior);
            }
        });

        _operations = Object.values(Operations)
            .map(function(o) { return o(context, selectedIDs); })
            .filter(function(o) { return o.available() && o.id !== 'delete' && o.id !== 'downgrade' && o.id !== 'copy'; });

        var copyOperation = Operations.operationCopy(context, selectedIDs);
        if (copyOperation.available()) {
            // group copy operation with delete/downgrade
            _operations.push(copyOperation);
        }

        var downgradeOperation = Operations.operationDowngrade(context, selectedIDs);
        // don't allow delete if downgrade is available
        var lastOperation = !context.inIntro() && downgradeOperation.available() ? downgradeOperation : Operations.operationDelete(context, selectedIDs);

        _operations.push(lastOperation);

        _operations.forEach(function(operation) {
            if (operation.behavior) {
                context.install(operation.behavior);
            }
        });

        // remove any displayed menu
        context.ui().closeEditMenu();
    }

    mode.operations = function() {
        return _operations;
    };


    mode.enter = function() {
        if (!checkSelectedIDs()) return;

        context.features().forceVisible(selectedIDs);

        _modeDragNode.restoreSelectedIDs(selectedIDs);

        loadOperations();

        if (!_behaviors.length) {
            if (!_selectBehavior) _selectBehavior = behaviorSelect(context);

            _behaviors = [
                behaviorPaste(context),
                _breatheBehavior,
                behaviorHover(context).on('hover', context.ui().sidebar.hoverModeSelect),
                _selectBehavior,
                behaviorLasso(context),
                _modeDragNode.behavior,
                modeDragNote(context).behavior
            ];
        }
        _behaviors.forEach(context.install);

        keybinding
            .on(t('inspector.zoom_to.key'), mode.zoomToSelected)
            .on(['[', 'pgup'], previousVertex)
            .on([']', 'pgdown'], nextVertex)
            .on(['{', uiCmd('⌘['), 'home'], firstVertex)
            .on(['}', uiCmd('⌘]'), 'end'], lastVertex)
            .on(uiCmd('⇧←'), nudgeSelection([-10, 0]))
            .on(uiCmd('⇧↑'), nudgeSelection([0, -10]))
            .on(uiCmd('⇧→'), nudgeSelection([10, 0]))
            .on(uiCmd('⇧↓'), nudgeSelection([0, 10]))
            .on(uiCmd('⇧⌘←'), nudgeSelection([-100, 0]))
            .on(uiCmd('⇧⌘↑'), nudgeSelection([0, -100]))
            .on(uiCmd('⇧⌘→'), nudgeSelection([100, 0]))
            .on(uiCmd('⇧⌘↓'), nudgeSelection([0, 100]))
            .on(['\\', 'pause'], nextParent)
            .on('⎋', esc, true);

        d3_select(document)
            .call(keybinding);

        context.ui().sidebar
            .select(selectedIDs, _newFeature);

        context.history()
            .on('change.select', function() {
                loadOperations();
                // reselect after change in case relation members were removed or added
                selectElements();
            })
            .on('undone.select', checkSelectedIDs)
            .on('redone.select', checkSelectedIDs);

        context.map()
            .on('drawn.select', selectElements)
            .on('crossEditableZoom.select', function() {
                selectElements();
                _breatheBehavior.restartIfNeeded(context.surface());
            });

        context.map().doubleUpHandler()
            .on('doubleUp.modeSelect', didDoubleUp);


        selectElements();

        if (_follow) {
            var extent = geoExtent();
            var graph = context.graph();
            selectedIDs.forEach(function(id) {
                var entity = context.entity(id);
                extent._extend(entity.extent(graph));
            });

            var loc = extent.center();
            context.map().centerEase(loc);
            // we could enter the mode multiple times, so reset follow for next time
            _follow = false;
        }


        function nudgeSelection(delta) {
            return function() {
                // prevent nudging during low zoom selection
                if (!context.map().withinEditableZoom()) return;

                var moveOp = operationMove(context, selectedIDs);
                if (moveOp.disabled()) {
                    context.ui().flash
                        .duration(4000)
                        .iconName('#iD-operation-' + moveOp.id)
                        .iconClass('operation disabled')
                        .text(moveOp.tooltip)();
                } else {
                    context.perform(actionMove(selectedIDs, delta, context.projection), moveOp.annotation());
                }
            };
        }


        function didDoubleUp(loc) {
            if (!context.map().withinEditableZoom()) return;

            var target = d3_select(d3_event.target);

            var datum = target.datum();
            var entity = datum && datum.properties && datum.properties.entity;
            if (!entity) return;

            if (entity instanceof osmWay && target.classed('target')) {
                var choice = geoChooseEdge(context.graph().childNodes(entity), loc, context.projection);
                var prev = entity.nodes[choice.index - 1];
                var next = entity.nodes[choice.index];

                context.perform(
                    actionAddMidpoint({ loc: choice.loc, edge: [prev, next] }, osmNode()),
                    t('operations.add.annotation.vertex')
                );

            } else if (entity.type === 'midpoint') {
                context.perform(
                    actionAddMidpoint({ loc: entity.loc, edge: entity.edge }, osmNode()),
                    t('operations.add.annotation.vertex'));
            }
        }


        function selectElements() {
            if (!checkSelectedIDs()) return;

            var surface = context.surface();

            surface.selectAll('.selected-member')
                .classed('selected-member', false);

            surface.selectAll('.selected')
                .classed('selected', false);

            surface.selectAll('.related')
                .classed('related', false);

            singularParent();
            if (_relatedParent) {
                surface.selectAll(utilEntitySelector([_relatedParent]))
                    .classed('related', true);
            }

            if (context.map().withinEditableZoom()) {
                // Apply selection styling if not in wide selection

                surface
                    .selectAll(utilDeepMemberSelector(selectedIDs, context.graph(), true /* skipMultipolgonMembers */))
                    .classed('selected-member', true);
                surface
                    .selectAll(utilEntityOrDeepMemberSelector(selectedIDs, context.graph()))
                    .classed('selected', true);
            }

        }


        function esc() {
            if (context.container().select('.combobox').size()) return;
            context.enter(modeBrowse(context));
        }


        function firstVertex() {
            d3_event.preventDefault();
            var entity = singular();
            var parent = singularParent();
            var way;

            if (entity && entity.type === 'way') {
                way = entity;
            } else if (parent) {
                way = context.entity(parent);
            }

            if (way) {
                context.enter(
                    modeSelect(context, [way.first()]).follow(true)
                );
            }
        }


        function lastVertex() {
            d3_event.preventDefault();
            var entity = singular();
            var parent = singularParent();
            var way;

            if (entity && entity.type === 'way') {
                way = entity;
            } else if (parent) {
                way = context.entity(parent);
            }

            if (way) {
                context.enter(
                    modeSelect(context, [way.last()]).follow(true)
                );
            }
        }


        function previousVertex() {
            d3_event.preventDefault();
            var parent = singularParent();
            if (!parent) return;

            var way = context.entity(parent);
            var length = way.nodes.length;
            var curr = way.nodes.indexOf(selectedIDs[0]);
            var index = -1;

            if (curr > 0) {
                index = curr - 1;
            } else if (way.isClosed()) {
                index = length - 2;
            }

            if (index !== -1) {
                context.enter(
                    modeSelect(context, [way.nodes[index]]).follow(true)
                );
            }
        }


        function nextVertex() {
            d3_event.preventDefault();
            var parent = singularParent();
            if (!parent) return;

            var way = context.entity(parent);
            var length = way.nodes.length;
            var curr = way.nodes.indexOf(selectedIDs[0]);
            var index = -1;

            if (curr < length - 1) {
                index = curr + 1;
            } else if (way.isClosed()) {
                index = 0;
            }

            if (index !== -1) {
                context.enter(
                    modeSelect(context, [way.nodes[index]]).follow(true)
                );
            }
        }


        function nextParent() {
            d3_event.preventDefault();
            var parents = commonParents();
            if (!parents || parents.length < 2) return;

            var index = parents.indexOf(_relatedParent);
            if (index < 0 || index > parents.length - 2) {
                _relatedParent = parents[0];
            } else {
                _relatedParent = parents[index + 1];
            }

            var surface = context.surface();
            surface.selectAll('.related')
                .classed('related', false);

            if (_relatedParent) {
                surface.selectAll(utilEntitySelector([_relatedParent]))
                    .classed('related', true);
            }
        }
    };


    mode.exit = function() {

        _newFeature = false;

        _operations.forEach(function(operation) {
            if (operation.behavior) {
                context.uninstall(operation.behavior);
            }
        });
        _operations = [];

        _behaviors.forEach(context.uninstall);

        d3_select(document)
            .call(keybinding.unbind);

        context.ui().closeEditMenu();

        context.history()
            .on('change.select', null)
            .on('undone.select', null)
            .on('redone.select', null);

        var surface = context.surface();

        surface
            .selectAll('.selected-member')
            .classed('selected-member', false);

        surface
            .selectAll('.selected')
            .classed('selected', false);

        surface
            .selectAll('.highlighted')
            .classed('highlighted', false);

        surface
            .selectAll('.related')
            .classed('related', false);

        context.map().on('drawn.select', null);
        context.ui().sidebar.hide();
        context.features().forceVisible([]);

        var entity = singular();
        if (_newFeature && entity && entity.type === 'relation' &&
            // no tags
            Object.keys(entity.tags).length === 0 &&
            // no parent relations
            context.graph().parentRelations(entity).length === 0 &&
            // no members or one member with no role
            (entity.members.length === 0 || (entity.members.length === 1 && !entity.members[0].role))
        ) {
            // the user added this relation but didn't edit it at all, so just delete it
            var deleteAction = actionDeleteRelation(entity.id, true /* don't delete untagged members */);
            context.perform(deleteAction, t('operations.delete.annotation.relation'));
        }
    };


    return mode;
}
