import * as d3 from 'd3';
import _ from 'lodash';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';

import { actionAddMidpoint } from '../actions/index';

import {
    behaviorBreathe,
    behaviorCopy,
    behaviorHover,
    behaviorLasso,
    behaviorPaste,
    behaviorSelect
} from '../behavior/index';

import {
    geoExtent,
    geoChooseEdge,
    geoPointInPolygon
} from '../geo/index';

import {
    osmNode,
    osmWay
} from '../osm/index';

import { modeBrowse } from './browse';
import { modeDragNode } from './drag_node';
import * as Operations from '../operations/index';
import { uiRadialMenu, uiSelectionList } from '../ui/index';
import { uiCmd } from '../ui/cmd';
import { utilEntityOrMemberSelector, utilEntitySelector } from '../util/index';


var relatedParent;
var previousSelectedIDs;



export function modeSelect(context, selectedIDs) {
    var mode = {
        id: 'select',
        button: 'browse'
    };
    
    var nextRelatedParent;

    var keybinding = d3keybinding('select'),
        timeout = null,
        behaviors = [
            behaviorCopy(context),
            behaviorPaste(context),
            behaviorBreathe(context),
            behaviorHover(context),
            behaviorSelect(context),
            behaviorLasso(context),
            modeDragNode(context).selectedIDs(selectedIDs).behavior
        ],
        inspector,
        radialMenu,
        newFeature = false,
        suppressMenu = false,
        follow = false;

    var wrap = context.container()
        .select('.inspector-wrap');

    function singular() {
        if (selectedIDs.length === 1) {
            return context.hasEntity(selectedIDs[0]);
        }
    }

    function checkSelectedIDs() {
        var ids = [];
        if (Array.isArray(selectedIDs)) {
            ids = selectedIDs.filter(function(id) {
                return context.hasEntity(id);
            });
        }

        if (ids.length) {
            selectedIDs = ids;
        } else {
            context.enter(modeBrowse(context));
        }
        return !!ids.length;
    }

    // find the common parent ways for nextVertex, previousVertex
    function commonParentWays() {
        var graph = context.graph(),
            commonParents = [];

        for (var i = 0; i < selectedIDs.length; i++) {
            var entity = context.hasEntity(selectedIDs[i]);
            if (!entity || entity.geometry(graph) !== 'vertex') {
                return [];  // selection includes some not vertexes
            }

            var currParents = _.map(graph.parentWays(entity), 'id');
            if (!commonParents.length) {
                commonParents = currParents;
                continue;
            }

            commonParents = _.intersection(commonParents, currParents);
            if (!commonParents.length) {
                return [];
            }
        }

        return commonParents;
    }

    function updateRelatedParent() {


        function singularParent() {
            function nodeIndex(parentId, childIndex) {
                if (selectedIDs.length !== 1) return null;
                var way = context.entity(parentId);
                if (childIndex&&way.nodes[childIndex] === selectedIDs[0] ) return childIndex;
                var index = way.nodes.indexOf(selectedIDs[0]);
                if (index !== -1) return index;
                return null;
            }
            function memberIndex(parentId, childIndex) {
                var relation = context.entity(parentId);
                if (childIndex && relation.members[childIndex].id === selectedIDs[0] ) return childIndex;
                var member = relation.memberById(selectedIDs[0]);
                if (member) return member.id;
                return null;
            }
            
            if (!selectedIDs || selectedIDs.length < 1) return null;
            
            var relatedParentEntity,
                member,
                index;
            if (relatedParent) relatedParentEntity = context.hasEntity(relatedParent.id);
            // if the entity does no longer exist, related parent will be cleared
            if (!relatedParentEntity) relatedParent = null;
            
            // When a related parent has been explicitly set, we want to use it.
            if (nextRelatedParent) {
                var nextRelatedParentEntity = context.hasEntity(nextRelatedParent.id);
                // if the entity does no longer exist, related parent will be cleared
                if (!nextRelatedParentEntity) relatedParent = null;
                if (!relatedParent || nextRelatedParent.index != null || relatedParent.index == null || relatedParent.id !== nextRelatedParent.id) {
                    if (nextRelatedParent.id[0] === 'r') {
                        return {id: nextRelatedParent.id, index: memberIndex(nextRelatedParent.id, nextRelatedParent.index)};
                    } else { 
                        return {id: nextRelatedParent.id, index: nodeIndex(nextRelatedParent.id, nextRelatedParent.index)};
                    }
                } else {
                    // Don't overwrite current index when switching to the same parent without given index.
                    if (nextRelatedParent.id[0] === 'r') {
                        return {id: relatedParent.id, index: memberIndex(relatedParent.id, relatedParent.index)};
                    } else { 
                        return {id: relatedParent.id, index: nodeIndex(relatedParent.id, relatedParent.index)};
                    }
                }
            }
    
            var parentways = commonParentWays();
            if (relatedParent) {
                if (relatedParent.id[0] === 'r') {
                    // Keep the related parent relation if the first selected entity is member of the relation
                    if (selectedIDs[0] === relatedParentEntity.members[relatedParent.index].id) return relatedParent;
                    member = relatedParentEntity.memberById(selectedIDs[0]);
                    if (member) return {id: relatedParent.id, index: member.index}; 
                } else {
                    // When we visit a vertex with multiple parents, we want to remember which parent line we started on.
                    // In addition we wan't to remember the index of the vertex in case it is contained in the way more than one time.
                    // Therefore, we also use this condition when visiting a vertex with the remembered parent being the single parent.
                    // This condition is also used when the related parent has been explicitly set by virtex navigation.        
                    
                    if (parentways && parentways.indexOf(relatedParent.id) !== -1) {                    
                        return {id: relatedParent.id, index: nodeIndex(relatedParent.id, relatedParent.index)};   // prefer the previously seen parent
                    }
                }   
            }
            
            if (previousSelectedIDs && previousSelectedIDs.length === 1) {
                var id = previousSelectedIDs[0];
                var entity = context.hasEntity(id); // check if entity does still exist.
                if (entity) {
                    if (id[0] === 'r' & selectedIDs.length === 1) {
                        // When we visit a relation and one of its members afterward, we want to use this way as the related parent.
                        member = entity.memberById(selectedIDs[0]);
                        if (member) {
                            mode.follow(true);
                            return {id: id, index: member.index }; // prefer the previously selected entity as parent
                        }
                    } else {
                        // When we visit a way and one of its vertices afterward, we want to use this way as the related parent.        
                        if (parentways && parentways.indexOf(id) !== -1) {
                            if (selectedIDs.length > 1) {
                                return {id: id, index:null};
                            } else {
                                index = entity.nodes.indexOf(selectedIDs[0]);
                                if (index !== -1) {
                                    mode.follow(true);
                                    return {id: id, index: index }; // prefer the previously selected entity as parent
                                }
                            }
                        }
                    }
                }
            }
                
            // When we visit a vertex with a single parent way, it is clear which parent to use.
            if (parentways && parentways.length === 1) {
                return {id:parentways[0], index: null };
            }
           
            // If it is not clear which parent to use, we won't use any parent. 
            return null;
        }

        var parent = singularParent();
        relatedParent = parent;
    }
   
   
    function closeMenu() {
        if (radialMenu) {
            context.surface().call(radialMenu.close);
        }
    }


    function positionMenu() {
        if (suppressMenu || !radialMenu) { return; }

        var entity = singular();
        if (entity && context.geometry(entity.id) === 'relation') {
            suppressMenu = true;
        } else if (entity && entity.type === 'node') {
            radialMenu.center(context.projection(entity.loc));
        } else {
            var point = context.mouse(),
                viewport = geoExtent(context.projection.clipExtent()).polygon();
            if (geoPointInPolygon(point, viewport)) {
                radialMenu.center(point);
            } else {
                suppressMenu = true;
            }
        }
    }


    function showMenu() {
        closeMenu();
        if (!suppressMenu && radialMenu) {
            context.surface().call(radialMenu);
        }
    }


    function toggleMenu() {
        if (d3.select('.radial-menu').empty()) {
            showMenu();
        } else {
            closeMenu();
        }
    }

    mode.selectedIDs = function() {
        return selectedIDs;
    };

    
    mode.relatedParent = function(_) {
        if (!arguments.length) return relatedParent;
        nextRelatedParent = _;
        return mode;
    };
    

    mode.reselect = function() {
        if (!checkSelectedIDs()) return;

        var surfaceNode = context.surface().node();
        if (surfaceNode.focus) {   // FF doesn't support it
            surfaceNode.focus();
        }

        positionMenu();
        showMenu();
    };


    mode.newFeature = function(_) {
        if (!arguments.length) return newFeature;
        newFeature = _;
        return mode;
    };


    mode.suppressMenu = function(_) {
        if (!arguments.length) return suppressMenu;
        suppressMenu = _;
        return mode;
    };


    mode.follow = function(_) {
        if (!arguments.length) return follow;
        follow = _;
        return mode;
    };


    mode.enter = function() {

        function update() {
            closeMenu();
            checkSelectedIDs();
        }


        function dblclick() {
            var target = d3.select(d3.event.target),
                datum = target.datum();

            if (datum instanceof osmWay && !target.classed('fill')) {
                var choice = geoChooseEdge(context.childNodes(datum), context.mouse(), context.projection),
                    node = osmNode();

                var prev = datum.nodes[choice.index - 1],
                    next = datum.nodes[choice.index];

                context.perform(
                    actionAddMidpoint({loc: choice.loc, edge: [prev, next]}, node),
                    t('operations.add.annotation.vertex')
                );

                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }


        function selectElements(drawn) {
            if (!checkSelectedIDs()) return;

            var surface = context.surface(),
                entity = singular();

            if (entity && context.geometry(entity.id) === 'relation') {
                suppressMenu = true;
                return;
            }

            surface.selectAll('.related')
                .classed('related', false);

            if (relatedParent) {
                surface.selectAll(utilEntitySelector([relatedParent.id]))
                    .classed('related', true);
            }

            var selection = context.surface()
                .selectAll(utilEntityOrMemberSelector(selectedIDs, context.graph()));

            if (selection.empty()) {
                // Return to browse mode if selected DOM elements have
                // disappeared because the user moved them out of view..
                var source = d3.event && d3.event.type === 'zoom' && d3.event.sourceEvent;
                if (drawn && source && (source.type === 'mousemove' || source.type === 'touchmove')) {
                    context.enter(modeBrowse(context));
                }
            } else {
                selection
                    .classed('selected', true);
            }
            
            
           var sel=d3.selectAll('parent-way-vertex-index');
           sel.classed('parent-way-vertex-related', true);
        }

        function esc() {
            if (!context.inIntro()) {
                context.enter(modeBrowse(context));
            }
        }

        function firstVertex() {
            var id,
                child;
            d3.event.preventDefault();
            if (relatedParent) {
                id = relatedParent.id;
            } else {
                id = selectedIDs[0];
                if (selectedIDs.length !== 1||id[0] === 'n') return;
            }
            var parent = context.entity(id);

            if (id[0] === 'r') {
                child = parent.members[0].id;
            } else {
                child = parent.nodes[0];
            }
            
            context.enter(
                modeSelect(context, [child]).relatedParent({id: id, index: 0}).follow(true).suppressMenu(true)
            );
        }

        function lastVertex() {
            var id,
                child;
            d3.event.preventDefault();
            if (relatedParent) {
                id = relatedParent.id;
            } else {
                id = selectedIDs[0];
                if (selectedIDs.length !== 1||id[0] === 'n') return;
            }
            var parent = context.entity(id),
                length;
    
            if (id[0] === 'r') {
                length = parent.members.length;
                child = parent.members[length-1].id;
            } else {
                length = parent.nodes.length;
                child = parent.nodes[length-1];
            }
            
            context.enter(
                modeSelect(context, [child]).relatedParent({id: id, index: length-1}).follow(true).suppressMenu(true)
            );
        }

        function previousVertex() {
            if (!relatedParent) {
                lastVertex(); // Reuse the logic of lastVertex if the selected entity is the potential parent itself (e.g. a way).
                return;
            }
            d3.event.preventDefault();

            var parent = context.entity(relatedParent.id),
                curr = relatedParent.index,
                index = -1,
                length;
            
            if (curr == null) return;
            if (relatedParent.id[0]==='r') {
                length = parent.members.length;
                if (curr > 0) {
                    index = curr - 1;
                }
                if (index >= 0) {
                    context.enter(
                        modeSelect(context, [parent.members[index].id]).relatedParent({id: relatedParent.id, index: index}).follow(true)
                    );
                }
            } else {
                length = parent.nodes.length;
                if (curr > 0) {
                    index = curr - 1;
                } else if (parent.isClosed()) {
                    index = length - 2;
                }
                if (index >= 0) {
                    context.enter(
                        modeSelect(context, [parent.nodes[index]]).relatedParent({id: relatedParent.id, index: index}).follow(true).suppressMenu(true)
                    );
                }
            }    
        }

        function nextVertex() {
            if (!relatedParent) {
                firstVertex(); // Reuse the logic of firstVertex if the selected entity is the potential parent itself (e.g. a way). 
                return;
            }
            d3.event.preventDefault();

            var parent = context.entity(relatedParent.id),
                curr = relatedParent.index,
                index = -1,
                length;
            
            if (curr == null) return;
            if (relatedParent.id[0]==='r') {
                length = parent.members.length;
                if (curr < length - 1) {
                    index = curr + 1;
                }
                if (index >= 0) {
                    context.enter(
                        modeSelect(context, [parent.members[index].id]).relatedParent({id: relatedParent.id, index: index}).follow(true)
                    );
                }
            } else {
                length = parent.nodes.length;
                if (curr < length - 1) {
                    index = curr + 1;
                } else if (parent.isClosed()) {
                    index = 0;
                }
                if (index >= 0) {
                    context.enter(
                        modeSelect(context, [parent.nodes[index]]).relatedParent({id: relatedParent.id, index: index}).follow(true).suppressMenu(true)
                    );
                }
            }    
        }

        function nextParent() {
            d3.event.preventDefault();
            var parents = _.uniq(commonParentWays()),
                nextParent;
            if (!parents || !parents.length) return;

            var index = -1;
            if (relatedParent) index = parents.indexOf(relatedParent.id);
            if (index < 0 || index > parents.length - 2) {
                nextParent = parents[0];
            } else {
                nextParent = parents[index + 1];
            }
            if (relatedParent && relatedParent.id === nextParent ) {
                context.enter(
                    modeSelect(context, selectedIDs).relatedParent(relatedParent).follow(true)
                );
            } else {
                context.enter(
                    modeSelect(context, selectedIDs).relatedParent({id: nextParent, index: index}).follow(true)
                );
            }

        } 

        if (!checkSelectedIDs()) return;

        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        updateRelatedParent(); // update relatedParent early
        
        var operations = _.without(d3.values(Operations), Operations.operationDelete)
                .map(function(o) { return o(selectedIDs, context); })
                .filter(function(o) { return o.available(); });
        
        operations.unshift(Operations.operationDelete(selectedIDs, context));

        keybinding
            .on(['[','pgup'], previousVertex)
            .on([']', 'pgdown'], nextVertex)
            .on([uiCmd('⌘['), 'home'], firstVertex)
            .on([uiCmd('⌘]'), 'end'], lastVertex)
            .on(['\\', 'pause'], nextParent)
            .on('⎋', esc, true)
            .on('space', toggleMenu);

        operations.forEach(function(operation) {
            operation.keys.forEach(function(key) {
                keybinding.on(key, function() {
                    d3.event.preventDefault();
                    if (!(context.inIntro() || operation.disabled())) {
                        operation();
                    }
                });
            });
        });

        d3.select(document)
            .call(keybinding);

        radialMenu = uiRadialMenu(context, operations);

        context.ui().sidebar
            .select(singular() ? singular().id : null, newFeature);

        context.history()
            .on('undone.select', update)
            .on('redone.select', update);

        context.map()
            .on('move.select', closeMenu)
            .on('drawn.select', selectElements);

        selectElements();

        var show = d3.event && !suppressMenu;

        if (show) {
            positionMenu();
        }

        if (follow) {
            var extent = geoExtent(),
                graph = context.graph();
            selectedIDs.forEach(function(id) {
                var entity = context.entity(id);
                extent._extend(entity.extent(graph));
            });

            var loc = extent.center();
            context.map().centerEase(loc);
        }

        timeout = window.setTimeout(function() {
            if (show) {
                showMenu();
            }

            context.surface()
                .on('dblclick.select', dblclick);
        }, 200);

        if (selectedIDs.length > 1) {
            var entities = uiSelectionList(context, selectedIDs);
            context.ui().sidebar.show(entities);
        }
 
        if (relatedParent) {
            d3.select(document).selectAll('.rp-'+relatedParent.id+'-'+relatedParent.index)
                .classed('rp-active', true);
        }
        
    };


    mode.exit = function() {
        if (timeout) window.clearTimeout(timeout);

        if (inspector) wrap.call(inspector.close);

        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });

        keybinding.off();
        closeMenu();
        radialMenu = undefined;
        
        if (Array.isArray(selectedIDs)) previousSelectedIDs = selectedIDs.slice();
        
        context.history()
            .on('undone.select', null)
            .on('redone.select', null);

        var surface = context.surface();

        surface
            .on('dblclick.select', null);

        surface
            .selectAll('.selected')
            .classed('selected', false);

        surface
            .selectAll('.related')
            .classed('related', false);
            
        d3.select(document)
            .selectAll('.rp-active')
            .classed('rp-active', false);
            

        context.map().on('drawn.select', null);
        context.ui().sidebar.hide();
    };


    return mode;
}
