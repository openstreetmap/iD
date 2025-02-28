import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';

import { actionAddMidpoint } from '../actions/add_midpoint';
import { actionDeleteRelation } from '../actions/delete_relation';
import { actionMove } from '../actions/move';
import { actionScale } from '../actions/scale';

import { behaviorBreathe } from '../behavior/breathe';
import { behaviorHover } from '../behavior/hover';
import { behaviorLasso } from '../behavior/lasso';
import { behaviorPaste } from '../behavior/paste';
import { behaviorSelect } from '../behavior/select';

import { operationMove } from '../operations/move';

import { geoExtent, geoChooseEdge, geoMetersToLat, geoMetersToLon } from '../geo';
import { modeBrowse } from './browse';
import { modeDragNode } from './drag_node';
import { modeDragNote } from './drag_note';
import { osmNode, osmWay } from '../osm';
import * as Operations from '../operations/index';
import { uiCmd } from '../ui/cmd';
import {
    utilArrayIntersection, utilArrayUnion, utilDeepMemberSelector, utilEntityOrDeepMemberSelector,
    utilEntitySelector, utilKeybinding, utilTotalExtent, utilGetAllNodes
} from '../util';


export function modeSelect(context, selectedIDs) {
    const mode = {
        id: 'select',
        button: 'browse'
    };

    const keybinding = utilKeybinding('select');

    const _breatheBehavior = behaviorBreathe(context);
    const _modeDragNode = modeDragNode(context);
    let _selectBehavior;
    let _behaviors = [];

    let _operations = [];
    let _newFeature = false;
    let _follow = false;

    // `_focusedParentWayId` is used when we visit a vertex with multiple
    // parents, and we want to remember which parent line we started on.
    let _focusedParentWayId;
    let _focusedVertexIds;


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
        let ids = [];
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


    // find the parent ways for nextVertex, previousVertex, and selectParent
    function parentWaysIdsOfSelection(onlyCommonParents) {
        const graph = context.graph();
        let parents = [];

        for (let i = 0; i < selectedIDs.length; i++) {
            const entity = context.hasEntity(selectedIDs[i]);
            if (!entity || entity.geometry(graph) !== 'vertex') {
                return [];  // selection includes some non-vertices
            }

            const currParents = graph.parentWays(entity).map(function(w) { return w.id; });
            if (!parents.length) {
                parents = currParents;
                continue;
            }

            parents = (onlyCommonParents ? utilArrayIntersection : utilArrayUnion)(parents, currParents);
            if (!parents.length) {
                return [];
            }
        }

        return parents;
    }

    // find the child nodes for selected ways
    function childNodeIdsOfSelection(onlyCommon) {
        const graph = context.graph();
        let childs = [];

        for (let i = 0; i < selectedIDs.length; i++) {
            const entity = context.hasEntity(selectedIDs[i]);

            if (!entity || !['area', 'line'].includes(entity.geometry(graph))){
                return [];  // selection includes non-area/non-line
            }
            const currChilds = graph.childNodes(entity).map(function(node) { return node.id; });
            if (!childs.length) {
                childs = currChilds;
                continue;
            }

            childs = (onlyCommon ? utilArrayIntersection : utilArrayUnion)(childs, currChilds);
            if (!childs.length) {
                return [];
            }
        }

        return childs;
    }

    function checkFocusedParent() {
        if (_focusedParentWayId) {
            const parents = parentWaysIdsOfSelection(true);
            if (parents.indexOf(_focusedParentWayId) === -1) _focusedParentWayId = null;
        }
    }


    function parentWayIdForVertexNavigation() {
        const parentIds = parentWaysIdsOfSelection(true);

        if (_focusedParentWayId && parentIds.indexOf(_focusedParentWayId) !== -1) {
            // prefer the previously seen parent
            return _focusedParentWayId;
        }

        return parentIds.length ? parentIds[0] : null;
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
            .filter(function(o) { return o.id !== 'delete' && o.id !== 'downgrade' && o.id !== 'copy'; })
            .concat([
                // group copy/downgrade/delete operation together at the end of the list
                Operations.operationCopy(context, selectedIDs),
                Operations.operationDowngrade(context, selectedIDs),
                Operations.operationDelete(context, selectedIDs)
            ]).filter(function(operation) {
                return operation.available();
            });

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
            .on(uiCmd('⇧⌥←'), nudgeSelection([-100, 0]))
            .on(uiCmd('⇧⌥↑'), nudgeSelection([0, -100]))
            .on(uiCmd('⇧⌥→'), nudgeSelection([100, 0]))
            .on(uiCmd('⇧⌥↓'), nudgeSelection([0, 100]))
            .on(utilKeybinding.plusKeys.map((key) => uiCmd('⇧' + key)), scaleSelection(1.05))
            .on(utilKeybinding.plusKeys.map((key) => uiCmd('⇧⌥' + key)), scaleSelection(Math.pow(1.05, 5)))
            .on(utilKeybinding.minusKeys.map((key) => uiCmd('⇧' + key)), scaleSelection(1/1.05))
            .on(utilKeybinding.minusKeys.map((key) => uiCmd('⇧⌥' + key)), scaleSelection(1/Math.pow(1.05, 5)))
            .on(['\\', 'pause'], focusNextParent)
            .on(uiCmd('⌘↑'), selectParent)
            .on(uiCmd('⌘↓'), selectChild)
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
            const extent = geoExtent();
            const graph = context.graph();
            selectedIDs.forEach(function(id) {
                const entity = context.entity(id);
                extent._extend(entity.extent(graph));
            });

            const loc = extent.center();
            context.map().centerEase(loc);
            // we could enter the mode multiple times, so reset follow for next time
            _follow = false;
        }


        function nudgeSelection(delta) {
            return function() {
                // prevent nudging during low zoom selection
                if (!context.map().withinEditableZoom()) return;

                const moveOp = operationMove(context, selectedIDs);
                if (moveOp.disabled()) {
                    context.ui().flash
                        .duration(4000)
                        .iconName('#iD-operation-' + moveOp.id)
                        .iconClass('operation disabled')
                        .label(moveOp.tooltip())();
                } else {
                    context.perform(actionMove(selectedIDs, delta, context.projection), moveOp.annotation());
                    context.validator().validate();
                }
            };
        }

        function scaleSelection(factor) {
            return function() {
                // prevent scaling during low zoom selection
                if (!context.map().withinEditableZoom()) return;

                const nodes = utilGetAllNodes(selectedIDs, context.graph());

                const isUp = factor > 1;

                // can only scale if multiple nodes are selected
                if (nodes.length <= 1) return;

                const extent = utilTotalExtent(selectedIDs, context.graph());

                // These disabled checks would normally be handled by an operation
                // object, but we don't want an actual scale operation at this point.
                function scalingDisabled() {

                    if (tooSmall()) {
                        return 'too_small';
                    } else if (extent.percentContainedIn(context.map().extent()) < 0.8) {
                        return 'too_large';
                    } else if (someMissing() || selectedIDs.some(incompleteRelation)) {
                        return 'not_downloaded';
                    } else if (selectedIDs.some(context.hasHiddenConnections)) {
                        return 'connected_to_hidden';
                    }

                    return false;

                    function tooSmall() {
                        if (isUp) return false;
                        const dLon = Math.abs(extent[1][0] - extent[0][0]);
                        const dLat = Math.abs(extent[1][1] - extent[0][1]);
                        return dLon < geoMetersToLon(1, extent[1][1]) &&
                            dLat < geoMetersToLat(1);
                    }

                    function someMissing() {
                        if (context.inIntro()) return false;
                        const osm = context.connection();
                        if (osm) {
                            const missing = nodes.filter(function(n) { return !osm.isDataLoaded(n.loc); });
                            if (missing.length) {
                                missing.forEach(function(loc) { context.loadTileAtLoc(loc); });
                                return true;
                            }
                        }
                        return false;
                    }

                    function incompleteRelation(id) {
                        const entity = context.entity(id);
                        return entity.type === 'relation' && !entity.isComplete(context.graph());
                    }
                }

                const disabled = scalingDisabled();

                if (disabled) {
                    const multi = (selectedIDs.length === 1 ? 'single' : 'multiple');
                    context.ui().flash
                        .duration(4000)
                        .iconName('#iD-icon-no')
                        .iconClass('operation disabled')
                        .label(t.append('operations.scale.' + disabled + '.' + multi))();
                } else {
                    const pivot = context.projection(extent.center());
                    const annotation = t('operations.scale.annotation.' + (isUp ? 'up' : 'down') + '.feature', { n: selectedIDs.length });
                    context.perform(actionScale(selectedIDs, pivot, factor, context.projection), annotation);
                    context.validator().validate();
                }
            };
        }


        function didDoubleUp(d3_event, loc) {
            if (!context.map().withinEditableZoom()) return;

            const target = d3_select(d3_event.target);

            const datum = target.datum();
            const entity = datum && datum.properties && datum.properties.entity;
            if (!entity) return;

            if (entity instanceof osmWay && target.classed('target')) {
                const choice = geoChooseEdge(context.graph().childNodes(entity), loc, context.projection);
                const prev = entity.nodes[choice.index - 1];
                const next = entity.nodes[choice.index];

                context.perform(
                    actionAddMidpoint({ loc: choice.loc, edge: [prev, next] }, osmNode()),
                    t('operations.add.annotation.vertex')
                );
                context.validator().validate();

            } else if (entity.type === 'midpoint') {
                context.perform(
                    actionAddMidpoint({ loc: entity.loc, edge: entity.edge }, osmNode()),
                    t('operations.add.annotation.vertex')
                );
                context.validator().validate();
            }
        }


        function selectElements() {
            if (!checkSelectedIDs()) return;

            const surface = context.surface();

            surface.selectAll('.selected-member')
                .classed('selected-member', false);

            surface.selectAll('.selected')
                .classed('selected', false);

            surface.selectAll('.related')
                .classed('related', false);

            // reload `_focusedParentWayId` based on the current selection
            checkFocusedParent();
            if (_focusedParentWayId) {
                surface.selectAll(utilEntitySelector([_focusedParentWayId]))
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


        function firstVertex(d3_event) {
            d3_event.preventDefault();
            const entity = singular();
            const parentId = parentWayIdForVertexNavigation();
            let way;

            if (entity && entity.type === 'way') {
                way = entity;
            } else if (parentId) {
                way = context.entity(parentId);
            }
            _focusedParentWayId = way && way.id;

            if (way) {
                context.enter(
                    mode.selectedIDs([way.first()])
                        .follow(true)
                );
            }
        }


        function lastVertex(d3_event) {
            d3_event.preventDefault();
            const entity = singular();
            const parentId = parentWayIdForVertexNavigation();
            let way;

            if (entity && entity.type === 'way') {
                way = entity;
            } else if (parentId) {
                way = context.entity(parentId);
            }
            _focusedParentWayId = way && way.id;

            if (way) {
                context.enter(
                    mode.selectedIDs([way.last()])
                        .follow(true)
                );
            }
        }


        function previousVertex(d3_event) {
            d3_event.preventDefault();
            const parentId = parentWayIdForVertexNavigation();
            _focusedParentWayId = parentId;
            if (!parentId) return;

            const way = context.entity(parentId);
            const length = way.nodes.length;
            const curr = way.nodes.indexOf(selectedIDs[0]);
            let index = -1;

            if (curr > 0) {
                index = curr - 1;
            } else if (way.isClosed()) {
                index = length - 2;
            }

            if (index !== -1) {
                context.enter(
                    mode.selectedIDs([way.nodes[index]])
                        .follow(true)
                );
            }
        }


        function nextVertex(d3_event) {
            d3_event.preventDefault();
            const parentId = parentWayIdForVertexNavigation();
            _focusedParentWayId = parentId;
            if (!parentId) return;

            const way = context.entity(parentId);
            const length = way.nodes.length;
            const curr = way.nodes.indexOf(selectedIDs[0]);
            let index = -1;

            if (curr < length - 1) {
                index = curr + 1;
            } else if (way.isClosed()) {
                index = 0;
            }

            if (index !== -1) {
                context.enter(
                    mode.selectedIDs([way.nodes[index]])
                        .follow(true)
                );
            }
        }


        function focusNextParent(d3_event) {
            d3_event.preventDefault();
            const parents = parentWaysIdsOfSelection(true);
            if (!parents || parents.length < 2) return;

            const index = parents.indexOf(_focusedParentWayId);
            if (index < 0 || index > parents.length - 2) {
                _focusedParentWayId = parents[0];
            } else {
                _focusedParentWayId = parents[index + 1];
            }

            const surface = context.surface();
            surface.selectAll('.related')
                .classed('related', false);

            if (_focusedParentWayId) {
                surface.selectAll(utilEntitySelector([_focusedParentWayId]))
                    .classed('related', true);
            }
        }

        function selectParent(d3_event) {
            d3_event.preventDefault();

            const currentSelectedIds = mode.selectedIDs();
            const parentIds = _focusedParentWayId ? [_focusedParentWayId] : parentWaysIdsOfSelection(false);
            if (!parentIds.length) return;

            context.enter(
                mode.selectedIDs(parentIds)
            );
            // set this after re-entering the selection since we normally want it cleared on exit
            _focusedVertexIds = currentSelectedIds;
        }

        function selectChild(d3_event) {
            d3_event.preventDefault();

            const currentSelectedIds = mode.selectedIDs();

            const childIds = _focusedVertexIds ? _focusedVertexIds.filter(id => context.hasEntity(id)) : childNodeIdsOfSelection(true);
            if (!childIds || !childIds.length) return;

            if (currentSelectedIds.length === 1) _focusedParentWayId = currentSelectedIds[0];

            context.enter(
                mode.selectedIDs(childIds)
            );
        }
    };


    mode.exit = function() {

        // we could enter the mode multiple times but it's only new the first time
        _newFeature = false;

        _focusedVertexIds = null;

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

        const surface = context.surface();

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

        const entity = singular();
        if (_newFeature && entity && entity.type === 'relation' &&
            // no tags
            Object.keys(entity.tags).length === 0 &&
            // no parent relations
            context.graph().parentRelations(entity).length === 0 &&
            // no members or one member with no role
            (entity.members.length === 0 || (entity.members.length === 1 && !entity.members[0].role))
        ) {
            // the user added this relation but didn't edit it at all, so just delete it
            const deleteAction = actionDeleteRelation(entity.id, true /* don't delete untagged members */);
            context.perform(deleteAction, t('operations.delete.annotation.relation'));
            context.validator().validate();
        }
    };


    return mode;
}
