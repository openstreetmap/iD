(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
   typeof define === 'function' && define.amd ? define(['exports'], factory) :
   (factory((global.iD = global.iD || {}, global.iD.behavior = global.iD.behavior || {})));
}(this, function (exports) { 'use strict';

   function Edit(context) {
       function edit() {
           context.map()
               .minzoom(context.minEditableZoom());
       }

       edit.off = function() {
           context.map()
               .minzoom(0);
       };

       return edit;
   }

   /*
      The hover behavior adds the `.hover` class on mouseover to all elements to which
      the identical datum is bound, and removes it on mouseout.

      The :hover pseudo-class is insufficient for iD's purposes because a datum's visual
      representation may consist of several elements scattered throughout the DOM hierarchy.
      Only one of these elements can have the :hover pseudo-class, but all of them will
      have the .hover class.
    */
   function Hover() {
       var dispatch = d3.dispatch('hover'),
           selection,
           altDisables,
           target;

       function keydown() {
           if (altDisables && d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
               dispatch.hover(null);
               selection.selectAll('.hover')
                   .classed('hover-suppressed', true)
                   .classed('hover', false);
           }
       }

       function keyup() {
           if (altDisables && d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
               dispatch.hover(target ? target.id : null);
               selection.selectAll('.hover-suppressed')
                   .classed('hover-suppressed', false)
                   .classed('hover', true);
           }
       }

       var hover = function(__) {
           selection = __;

           function enter(d) {
               if (d === target) return;

               target = d;

               selection.selectAll('.hover')
                   .classed('hover', false);
               selection.selectAll('.hover-suppressed')
                   .classed('hover-suppressed', false);

               if (target instanceof iD.Entity) {
                   var selector = '.' + target.id;

                   if (target.type === 'relation') {
                       target.members.forEach(function(member) {
                           selector += ', .' + member.id;
                       });
                   }

                   var suppressed = altDisables && d3.event && d3.event.altKey;

                   selection.selectAll(selector)
                       .classed(suppressed ? 'hover-suppressed' : 'hover', true);

                   dispatch.hover(target.id);
               } else {
                   dispatch.hover(null);
               }
           }

           var down;

           function mouseover() {
               if (down) return;
               var target = d3.event.target;
               enter(target ? target.__data__ : null);
           }

           function mouseout() {
               if (down) return;
               var target = d3.event.relatedTarget;
               enter(target ? target.__data__ : null);
           }

           function mousedown() {
               down = true;
               d3.select(window)
                   .on('mouseup.hover', mouseup);
           }

           function mouseup() {
               down = false;
           }

           selection
               .on('mouseover.hover', mouseover)
               .on('mouseout.hover', mouseout)
               .on('mousedown.hover', mousedown)
               .on('mouseup.hover', mouseup);

           d3.select(window)
               .on('keydown.hover', keydown)
               .on('keyup.hover', keyup);
       };

       hover.off = function(selection) {
           selection.selectAll('.hover')
               .classed('hover', false);
           selection.selectAll('.hover-suppressed')
               .classed('hover-suppressed', false);

           selection
               .on('mouseover.hover', null)
               .on('mouseout.hover', null)
               .on('mousedown.hover', null)
               .on('mouseup.hover', null);

           d3.select(window)
               .on('keydown.hover', null)
               .on('keyup.hover', null)
               .on('mouseup.hover', null);
       };

       hover.altDisables = function(_) {
           if (!arguments.length) return altDisables;
           altDisables = _;
           return hover;
       };

       return d3.rebind(hover, dispatch, 'on');
   }

   function Tail() {
       var text,
           container,
           xmargin = 25,
           tooltipSize = [0, 0],
           selectionSize = [0, 0];

       function tail(selection) {
           if (!text) return;

           d3.select(window)
               .on('resize.tail', function() { selectionSize = selection.dimensions(); });

           function show() {
               container.style('display', 'block');
               tooltipSize = container.dimensions();
           }

           function mousemove() {
               if (container.style('display') === 'none') show();
               var xoffset = ((d3.event.clientX + tooltipSize[0] + xmargin) > selectionSize[0]) ?
                   -tooltipSize[0] - xmargin : xmargin;
               container.classed('left', xoffset > 0);
               iD.util.setTransform(container, d3.event.clientX + xoffset, d3.event.clientY);
           }

           function mouseleave() {
               if (d3.event.relatedTarget !== container.node()) {
                   container.style('display', 'none');
               }
           }

           function mouseenter() {
               if (d3.event.relatedTarget !== container.node()) {
                   show();
               }
           }

           container = d3.select(document.body)
               .append('div')
               .style('display', 'none')
               .attr('class', 'tail tooltip-inner');

           container.append('div')
               .text(text);

           selection
               .on('mousemove.tail', mousemove)
               .on('mouseenter.tail', mouseenter)
               .on('mouseleave.tail', mouseleave);

           container
               .on('mousemove.tail', mousemove);

           tooltipSize = container.dimensions();
           selectionSize = selection.dimensions();
       }

       tail.off = function(selection) {
           if (!text) return;

           container
               .on('mousemove.tail', null)
               .remove();

           selection
               .on('mousemove.tail', null)
               .on('mouseenter.tail', null)
               .on('mouseleave.tail', null);

           d3.select(window)
               .on('resize.tail', null);
       };

       tail.text = function(_) {
           if (!arguments.length) return text;
           text = _;
           return tail;
       };

       return tail;
   }

   function Draw(context) {
       var event = d3.dispatch('move', 'click', 'clickWay',
               'clickNode', 'undo', 'cancel', 'finish'),
           keybinding = d3.keybinding('draw'),
           hover = Hover(context)
               .altDisables(true)
               .on('hover', context.ui().sidebar.hover),
           tail = Tail(),
           edit = Edit(context),
           closeTolerance = 4,
           tolerance = 12,
           mouseLeave = false,
           lastMouse = null,
           cached = Draw;

       function datum() {
           if (d3.event.altKey) return {};

           if (d3.event.type === 'keydown') {
               return (lastMouse && lastMouse.target.__data__) || {};
           } else {
               return d3.event.target.__data__ || {};
           }
       }

       function mousedown() {

           function point() {
               var p = context.container().node();
               return touchId !== null ? d3.touches(p).filter(function(p) {
                   return p.identifier === touchId;
               })[0] : d3.mouse(p);
           }

           var element = d3.select(this),
               touchId = d3.event.touches ? d3.event.changedTouches[0].identifier : null,
               t1 = +new Date(),
               p1 = point();

           element.on('mousemove.draw', null);

           d3.select(window).on('mouseup.draw', function() {
               var t2 = +new Date(),
                   p2 = point(),
                   dist = iD.geo.euclideanDistance(p1, p2);

               element.on('mousemove.draw', mousemove);
               d3.select(window).on('mouseup.draw', null);

               if (dist < closeTolerance || (dist < tolerance && (t2 - t1) < 500)) {
                   // Prevent a quick second click
                   d3.select(window).on('click.draw-block', function() {
                       d3.event.stopPropagation();
                   }, true);

                   context.map().dblclickEnable(false);

                   window.setTimeout(function() {
                       context.map().dblclickEnable(true);
                       d3.select(window).on('click.draw-block', null);
                   }, 500);

                   click();
               }
           });
       }

       function mousemove() {
           lastMouse = d3.event;
           event.move(datum());
       }

       function mouseenter() {
           mouseLeave = false;
       }

       function mouseleave() {
           mouseLeave = true;
       }

       function click() {
           var d = datum();
           if (d.type === 'way') {
               var dims = context.map().dimensions(),
                   mouse = context.mouse(),
                   pad = 5,
                   trySnap = mouse[0] > pad && mouse[0] < dims[0] - pad &&
                       mouse[1] > pad && mouse[1] < dims[1] - pad;

               if (trySnap) {
                   var choice = iD.geo.chooseEdge(context.childNodes(d), context.mouse(), context.projection),
                       edge = [d.nodes[choice.index - 1], d.nodes[choice.index]];
                   event.clickWay(choice.loc, edge);
               } else {
                   event.click(context.map().mouseCoordinates());
               }

           } else if (d.type === 'node') {
               event.clickNode(d);

           } else {
               event.click(context.map().mouseCoordinates());
           }
       }

       function space() {
           var currSpace = context.mouse();
           if (cached.disableSpace && cached.lastSpace) {
               var dist = iD.geo.euclideanDistance(cached.lastSpace, currSpace);
               if (dist > tolerance) {
                   cached.disableSpace = false;
               }
           }

           if (cached.disableSpace || mouseLeave || !lastMouse) return;

           // user must move mouse or release space bar to allow another click
           cached.lastSpace = currSpace;
           cached.disableSpace = true;

           d3.select(window).on('keyup.space-block', function() {
               cached.disableSpace = false;
               d3.select(window).on('keyup.space-block', null);
           });

           d3.event.preventDefault();
           click();
       }

       function backspace() {
           d3.event.preventDefault();
           event.undo();
       }

       function del() {
           d3.event.preventDefault();
           event.cancel();
       }

       function ret() {
           d3.event.preventDefault();
           event.finish();
       }

       function draw(selection) {
           context.install(hover);
           context.install(edit);

           if (!context.inIntro() && !cached.usedTails[tail.text()]) {
               context.install(tail);
           }

           keybinding
               .on('⌫', backspace)
               .on('⌦', del)
               .on('⎋', ret)
               .on('↩', ret)
               .on('space', space)
               .on('⌥space', space);

           selection
               .on('mouseenter.draw', mouseenter)
               .on('mouseleave.draw', mouseleave)
               .on('mousedown.draw', mousedown)
               .on('mousemove.draw', mousemove);

           d3.select(document)
               .call(keybinding);

           return draw;
       }

       draw.off = function(selection) {
           context.ui().sidebar.hover.cancel();
           context.uninstall(hover);
           context.uninstall(edit);

           if (!context.inIntro() && !cached.usedTails[tail.text()]) {
               context.uninstall(tail);
               cached.usedTails[tail.text()] = true;
           }

           selection
               .on('mouseenter.draw', null)
               .on('mouseleave.draw', null)
               .on('mousedown.draw', null)
               .on('mousemove.draw', null);

           d3.select(window)
               .on('mouseup.draw', null);
               // note: keyup.space-block, click.draw-block should remain

           d3.select(document)
               .call(keybinding.off);
       };

       draw.tail = function(_) {
           tail.text(_);
           return draw;
       };

       return d3.rebind(draw, event, 'on');
   }

   Draw.usedTails = {};
   Draw.disableSpace = false;
   Draw.lastSpace = null;

   function AddWay(context) {
       var event = d3.dispatch('start', 'startFromWay', 'startFromNode'),
           draw = Draw(context);

       var addWay = function(surface) {
           draw.on('click', event.start)
               .on('clickWay', event.startFromWay)
               .on('clickNode', event.startFromNode)
               .on('cancel', addWay.cancel)
               .on('finish', addWay.cancel);

           context.map()
               .dblclickEnable(false);

           surface.call(draw);
       };

       addWay.off = function(surface) {
           surface.call(draw.off);
       };

       addWay.cancel = function() {
           window.setTimeout(function() {
               context.map().dblclickEnable(true);
           }, 1000);

           context.enter(iD.modes.Browse(context));
       };

       addWay.tail = function(text) {
           draw.tail(text);
           return addWay;
       };

       return d3.rebind(addWay, event, 'on');
   }

   function Breathe(){
       var duration = 800,
           selector = '.selected.shadow, .selected .shadow',
           selected = d3.select(null),
           classed = '',
           params = {},
           done;

       function reset(selection) {
           selection
               .style('stroke-opacity', null)
               .style('stroke-width', null)
               .style('fill-opacity', null)
               .style('r', null);
       }

       function setAnimationParams(transition, fromTo) {
           transition
               .style('stroke-opacity', function(d) { return params[d.id][fromTo].opacity; })
               .style('stroke-width', function(d) { return params[d.id][fromTo].width; })
               .style('fill-opacity', function(d) { return params[d.id][fromTo].opacity; })
               .style('r', function(d) { return params[d.id][fromTo].width; });
       }

       function calcAnimationParams(selection) {
           selection
               .call(reset)
               .each(function(d) {
                   var s = d3.select(this),
                       tag = s.node().tagName,
                       p = {'from': {}, 'to': {}},
                       opacity, width;

                   // determine base opacity and width
                   if (tag === 'circle') {
                       opacity = parseFloat(s.style('fill-opacity') || 0.5);
                       width = parseFloat(s.style('r') || 15.5);
                   } else {
                       opacity = parseFloat(s.style('stroke-opacity') || 0.7);
                       width = parseFloat(s.style('stroke-width') || 10);
                   }

                   // calculate from/to interpolation params..
                   p.tag = tag;
                   p.from.opacity = opacity * 0.6;
                   p.to.opacity = opacity * 1.25;
                   p.from.width = width * 0.9;
                   p.to.width = width * (tag === 'circle' ? 1.5 : 1.25);
                   params[d.id] = p;
               });
       }

       function run(surface, fromTo) {
           var toFrom = (fromTo === 'from' ? 'to': 'from'),
               currSelected = surface.selectAll(selector),
               currClassed = surface.attr('class'),
               n = 0;

           if (done || currSelected.empty()) {
               selected.call(reset);
               return;
           }

           if (!_.isEqual(currSelected, selected) || currClassed !== classed) {
               selected.call(reset);
               classed = currClassed;
               selected = currSelected.call(calcAnimationParams);
           }

           selected
               .transition()
               .call(setAnimationParams, fromTo)
               .duration(duration)
               .each(function() { ++n; })
               .each('end', function() {
                   if (!--n) {  // call once
                       surface.call(run, toFrom);
                   }
               });
       }

       var breathe = function(surface) {
           done = false;
           d3.timer(function() {
               if (done) return true;

               var currSelected = surface.selectAll(selector);
               if (currSelected.empty()) return false;

               surface.call(run, 'from');
               return true;
           }, 200);
       };

       breathe.off = function() {
           done = true;
           d3.timer.flush();
           selected
               .transition()
               .call(reset)
               .duration(0);
       };

       return breathe;
   }

   function Copy(context) {
       var keybinding = d3.keybinding('copy');

       function groupEntities(ids, graph) {
           var entities = ids.map(function (id) { return graph.entity(id); });
           return _.extend({relation: [], way: [], node: []},
               _.groupBy(entities, function(entity) { return entity.type; }));
       }

       function getDescendants(id, graph, descendants) {
           var entity = graph.entity(id),
               i, children;

           descendants = descendants || {};

           if (entity.type === 'relation') {
               children = _.map(entity.members, 'id');
           } else if (entity.type === 'way') {
               children = entity.nodes;
           } else {
               children = [];
           }

           for (i = 0; i < children.length; i++) {
               if (!descendants[children[i]]) {
                   descendants[children[i]] = true;
                   descendants = getDescendants(children[i], graph, descendants);
               }
           }

           return descendants;
       }

       function doCopy() {
           d3.event.preventDefault();
           if (context.inIntro()) return;

           var graph = context.graph(),
               selected = groupEntities(context.selectedIDs(), graph),
               canCopy = [],
               skip = {},
               i, entity;

           for (i = 0; i < selected.relation.length; i++) {
               entity = selected.relation[i];
               if (!skip[entity.id] && entity.isComplete(graph)) {
                   canCopy.push(entity.id);
                   skip = getDescendants(entity.id, graph, skip);
               }
           }
           for (i = 0; i < selected.way.length; i++) {
               entity = selected.way[i];
               if (!skip[entity.id]) {
                   canCopy.push(entity.id);
                   skip = getDescendants(entity.id, graph, skip);
               }
           }
           for (i = 0; i < selected.node.length; i++) {
               entity = selected.node[i];
               if (!skip[entity.id]) {
                   canCopy.push(entity.id);
               }
           }

           context.copyIDs(canCopy);
       }

       function copy() {
           keybinding.on(iD.ui.cmd('⌘C'), doCopy);
           d3.select(document).call(keybinding);
           return copy;
       }

       copy.off = function() {
           d3.select(document).call(keybinding.off);
       };

       return copy;
   }

   /*
       `iD.behavior.drag` is like `d3.behavior.drag`, with the following differences:

       * The `origin` function is expected to return an [x, y] tuple rather than an
         {x, y} object.
       * The events are `start`, `move`, and `end`.
         (https://github.com/mbostock/d3/issues/563)
       * The `start` event is not dispatched until the first cursor movement occurs.
         (https://github.com/mbostock/d3/pull/368)
       * The `move` event has a `point` and `delta` [x, y] tuple properties rather
         than `x`, `y`, `dx`, and `dy` properties.
       * The `end` event is not dispatched if no movement occurs.
       * An `off` function is available that unbinds the drag's internal event handlers.
       * Delegation is supported via the `delegate` function.

    */
   function drag() {
       function d3_eventCancel() {
         d3.event.stopPropagation();
         d3.event.preventDefault();
       }

       var event = d3.dispatch('start', 'move', 'end'),
           origin = null,
           selector = '',
           filter = null,
           event_, target, surface;

       event.of = function(thiz, argumentz) {
         return function(e1) {
           var e0 = e1.sourceEvent = d3.event;
           e1.target = drag;
           d3.event = e1;
           try {
             event[e1.type].apply(thiz, argumentz);
           } finally {
             d3.event = e0;
           }
         };
       };

       var d3_event_userSelectProperty = iD.util.prefixCSSProperty('UserSelect'),
           d3_event_userSelectSuppress = d3_event_userSelectProperty ?
               function () {
                   var selection = d3.selection(),
                       select = selection.style(d3_event_userSelectProperty);
                   selection.style(d3_event_userSelectProperty, 'none');
                   return function () {
                       selection.style(d3_event_userSelectProperty, select);
                   };
               } :
               function (type) {
                   var w = d3.select(window).on('selectstart.' + type, d3_eventCancel);
                   return function () {
                       w.on('selectstart.' + type, null);
                   };
               };

       function mousedown() {
           target = this;
           event_ = event.of(target, arguments);
           var eventTarget = d3.event.target,
               touchId = d3.event.touches ? d3.event.changedTouches[0].identifier : null,
               offset,
               origin_ = point(),
               started = false,
               selectEnable = d3_event_userSelectSuppress(touchId !== null ? 'drag-' + touchId : 'drag');

           var w = d3.select(window)
               .on(touchId !== null ? 'touchmove.drag-' + touchId : 'mousemove.drag', dragmove)
               .on(touchId !== null ? 'touchend.drag-' + touchId : 'mouseup.drag', dragend, true);

           if (origin) {
               offset = origin.apply(target, arguments);
               offset = [offset[0] - origin_[0], offset[1] - origin_[1]];
           } else {
               offset = [0, 0];
           }

           if (touchId === null) d3.event.stopPropagation();

           function point() {
               var p = target.parentNode || surface;
               return touchId !== null ? d3.touches(p).filter(function(p) {
                   return p.identifier === touchId;
               })[0] : d3.mouse(p);
           }

           function dragmove() {

               var p = point(),
                   dx = p[0] - origin_[0],
                   dy = p[1] - origin_[1];

               if (dx === 0 && dy === 0)
                   return;

               if (!started) {
                   started = true;
                   event_({
                       type: 'start'
                   });
               }

               origin_ = p;
               d3_eventCancel();

               event_({
                   type: 'move',
                   point: [p[0] + offset[0],  p[1] + offset[1]],
                   delta: [dx, dy]
               });
           }

           function dragend() {
               if (started) {
                   event_({
                       type: 'end'
                   });

                   d3_eventCancel();
                   if (d3.event.target === eventTarget) w.on('click.drag', click, true);
               }

               w.on(touchId !== null ? 'touchmove.drag-' + touchId : 'mousemove.drag', null)
                   .on(touchId !== null ? 'touchend.drag-' + touchId : 'mouseup.drag', null);
               selectEnable();
           }

           function click() {
               d3_eventCancel();
               w.on('click.drag', null);
           }
       }

       function drag(selection) {
           var matchesSelector = iD.util.prefixDOMProperty('matchesSelector'),
               delegate = mousedown;

           if (selector) {
               delegate = function() {
                   var root = this,
                       target = d3.event.target;
                   for (; target && target !== root; target = target.parentNode) {
                       if (target[matchesSelector](selector) &&
                               (!filter || filter(target.__data__))) {
                           return mousedown.call(target, target.__data__);
                       }
                   }
               };
           }

           selection.on('mousedown.drag' + selector, delegate)
               .on('touchstart.drag' + selector, delegate);
       }

       drag.off = function(selection) {
           selection.on('mousedown.drag' + selector, null)
               .on('touchstart.drag' + selector, null);
       };

       drag.delegate = function(_) {
           if (!arguments.length) return selector;
           selector = _;
           return drag;
       };

       drag.filter = function(_) {
           if (!arguments.length) return origin;
           filter = _;
           return drag;
       };

       drag.origin = function (_) {
           if (!arguments.length) return origin;
           origin = _;
           return drag;
       };

       drag.cancel = function() {
           d3.select(window)
               .on('mousemove.drag', null)
               .on('mouseup.drag', null);
           return drag;
       };

       drag.target = function() {
           if (!arguments.length) return target;
           target = arguments[0];
           event_ = event.of(target, Array.prototype.slice.call(arguments, 1));
           return drag;
       };

       drag.surface = function() {
           if (!arguments.length) return surface;
           surface = arguments[0];
           return drag;
       };

       return d3.rebind(drag, event, 'on');
   }

   function DrawWay(context, wayId, index, mode, baseGraph) {
       var way = context.entity(wayId),
           isArea = context.geometry(wayId) === 'area',
           finished = false,
           annotation = t((way.isDegenerate() ?
               'operations.start.annotation.' :
               'operations.continue.annotation.') + context.geometry(wayId)),
           draw = Draw(context);

       var startIndex = typeof index === 'undefined' ? way.nodes.length - 1 : 0,
           start = iD.Node({loc: context.graph().entity(way.nodes[startIndex]).loc}),
           end = iD.Node({loc: context.map().mouseCoordinates()}),
           segment = iD.Way({
               nodes: typeof index === 'undefined' ? [start.id, end.id] : [end.id, start.id],
               tags: _.clone(way.tags)
           });

       var f = context[way.isDegenerate() ? 'replace' : 'perform'];
       if (isArea) {
           f(iD.actions.AddEntity(end),
               iD.actions.AddVertex(wayId, end.id, index));
       } else {
           f(iD.actions.AddEntity(start),
               iD.actions.AddEntity(end),
               iD.actions.AddEntity(segment));
       }

       function move(datum) {
           var loc;

           if (datum.type === 'node' && datum.id !== end.id) {
               loc = datum.loc;

           } else if (datum.type === 'way' && datum.id !== segment.id) {
               var dims = context.map().dimensions(),
                   mouse = context.mouse(),
                   pad = 5,
                   trySnap = mouse[0] > pad && mouse[0] < dims[0] - pad &&
                       mouse[1] > pad && mouse[1] < dims[1] - pad;

               if (trySnap) {
                   loc = iD.geo.chooseEdge(context.childNodes(datum), context.mouse(), context.projection).loc;
               }
           }

           if (!loc) {
               loc = context.map().mouseCoordinates();
           }

           context.replace(iD.actions.MoveNode(end.id, loc));
       }

       function undone() {
           finished = true;
           context.enter(iD.modes.Browse(context));
       }

       function setActiveElements() {
           var active = isArea ? [wayId, end.id] : [segment.id, start.id, end.id];
           context.surface().selectAll(iD.util.entitySelector(active))
               .classed('active', true);
       }

       var drawWay = function(surface) {
           draw.on('move', move)
               .on('click', drawWay.add)
               .on('clickWay', drawWay.addWay)
               .on('clickNode', drawWay.addNode)
               .on('undo', context.undo)
               .on('cancel', drawWay.cancel)
               .on('finish', drawWay.finish);

           context.map()
               .dblclickEnable(false)
               .on('drawn.draw', setActiveElements);

           setActiveElements();

           surface.call(draw);

           context.history()
               .on('undone.draw', undone);
       };

       drawWay.off = function(surface) {
           if (!finished)
               context.pop();

           context.map()
               .on('drawn.draw', null);

           surface.call(draw.off)
               .selectAll('.active')
               .classed('active', false);

           context.history()
               .on('undone.draw', null);
       };

       function ReplaceTemporaryNode(newNode) {
           return function(graph) {
               if (isArea) {
                   return graph
                       .replace(way.addNode(newNode.id, index))
                       .remove(end);

               } else {
                   return graph
                       .replace(graph.entity(wayId).addNode(newNode.id, index))
                       .remove(end)
                       .remove(segment)
                       .remove(start);
               }
           };
       }

       // Accept the current position of the temporary node and continue drawing.
       drawWay.add = function(loc) {

           // prevent duplicate nodes
           var last = context.hasEntity(way.nodes[way.nodes.length - (isArea ? 2 : 1)]);
           if (last && last.loc[0] === loc[0] && last.loc[1] === loc[1]) return;

           var newNode = iD.Node({loc: loc});

           context.replace(
               iD.actions.AddEntity(newNode),
               ReplaceTemporaryNode(newNode),
               annotation);

           finished = true;
           context.enter(mode);
       };

       // Connect the way to an existing way.
       drawWay.addWay = function(loc, edge) {
           var previousEdge = startIndex ?
               [way.nodes[startIndex], way.nodes[startIndex - 1]] :
               [way.nodes[0], way.nodes[1]];

           // Avoid creating duplicate segments
           if (!isArea && iD.geo.edgeEqual(edge, previousEdge))
               return;

           var newNode = iD.Node({ loc: loc });

           context.perform(
               iD.actions.AddMidpoint({ loc: loc, edge: edge}, newNode),
               ReplaceTemporaryNode(newNode),
               annotation);

           finished = true;
           context.enter(mode);
       };

       // Connect the way to an existing node and continue drawing.
       drawWay.addNode = function(node) {

           // Avoid creating duplicate segments
           if (way.areAdjacent(node.id, way.nodes[way.nodes.length - 1])) return;

           context.perform(
               ReplaceTemporaryNode(node),
               annotation);

           finished = true;
           context.enter(mode);
       };

       // Finish the draw operation, removing the temporary node. If the way has enough
       // nodes to be valid, it's selected. Otherwise, return to browse mode.
       drawWay.finish = function() {
           context.pop();
           finished = true;

           window.setTimeout(function() {
               context.map().dblclickEnable(true);
           }, 1000);

           if (context.hasEntity(wayId)) {
               context.enter(
                   iD.modes.Select(context, [wayId])
                       .suppressMenu(true)
                       .newFeature(true));
           } else {
               context.enter(iD.modes.Browse(context));
           }
       };

       // Cancel the draw operation and return to browse, deleting everything drawn.
       drawWay.cancel = function() {
           context.perform(
               d3.functor(baseGraph),
               t('operations.cancel_draw.annotation'));

           window.setTimeout(function() {
               context.map().dblclickEnable(true);
           }, 1000);

           finished = true;
           context.enter(iD.modes.Browse(context));
       };

       drawWay.tail = function(text) {
           draw.tail(text);
           return drawWay;
       };

       return drawWay;
   }

   function Hash(context) {
       var s0 = null, // cached location.hash
           lat = 90 - 1e-8; // allowable latitude range

       var parser = function(map, s) {
           var q = iD.util.stringQs(s);
           var args = (q.map || '').split('/').map(Number);
           if (args.length < 3 || args.some(isNaN)) {
               return true; // replace bogus hash
           } else if (s !== formatter(map).slice(1)) {
               map.centerZoom([args[1],
                   Math.min(lat, Math.max(-lat, args[2]))], args[0]);
           }
       };

       var formatter = function(map) {
           var mode = context.mode(),
               center = map.center(),
               zoom = map.zoom(),
               precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2)),
               q = _.omit(iD.util.stringQs(location.hash.substring(1)), 'comment'),
               newParams = {};

           if (mode && mode.id === 'browse') {
               delete q.id;
           } else {
               var selected = context.selectedIDs().filter(function(id) {
                   return !context.entity(id).isNew();
               });
               if (selected.length) {
                   newParams.id = selected.join(',');
               }
           }

           newParams.map = zoom.toFixed(2) +
                   '/' + center[0].toFixed(precision) +
                   '/' + center[1].toFixed(precision);

           return '#' + iD.util.qsString(_.assign(q, newParams), true);
       };

       function update() {
           if (context.inIntro()) return;
           var s1 = formatter(context.map());
           if (s0 !== s1) location.replace(s0 = s1); // don't recenter the map!
       }

       var throttledUpdate = _.throttle(update, 500);

       function hashchange() {
           if (location.hash === s0) return; // ignore spurious hashchange events
           if (parser(context.map(), (s0 = location.hash).substring(1))) {
               update(); // replace bogus hash
           }
       }

       function hash() {
           context.map()
               .on('move.hash', throttledUpdate);

           context
               .on('enter.hash', throttledUpdate);

           d3.select(window)
               .on('hashchange.hash', hashchange);

           if (location.hash) {
               var q = iD.util.stringQs(location.hash.substring(1));
               if (q.id) context.zoomToEntity(q.id.split(',')[0], !q.map);
               if (q.comment) context.storage('comment', q.comment);
               hashchange();
               if (q.map) hash.hadHash = true;
           }
       }

       hash.off = function() {
           throttledUpdate.cancel();

           context.map()
               .on('move.hash', null);

           context
               .on('enter.hash', null);

           d3.select(window)
               .on('hashchange.hash', null);

           location.hash = '';
       };

       return hash;
   }

   function Lasso(context) {

       var behavior = function(selection) {
           var lasso;

           function mousedown() {
               var button = 0;  // left
               if (d3.event.button === button && d3.event.shiftKey === true) {
                   lasso = null;

                   selection
                       .on('mousemove.lasso', mousemove)
                       .on('mouseup.lasso', mouseup);

                   d3.event.stopPropagation();
               }
           }

           function mousemove() {
               if (!lasso) {
                   lasso = iD.ui.Lasso(context);
                   context.surface().call(lasso);
               }

               lasso.p(context.mouse());
           }

           function normalize(a, b) {
               return [
                   [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
                   [Math.max(a[0], b[0]), Math.max(a[1], b[1])]];
           }

           function lassoed() {
               if (!lasso) return [];

               var graph = context.graph(),
                   bounds = lasso.extent().map(context.projection.invert),
                   extent = iD.geo.Extent(normalize(bounds[0], bounds[1]));

               return _.map(context.intersects(extent).filter(function(entity) {
                   return entity.type === 'node' &&
                       iD.geo.pointInPolygon(context.projection(entity.loc), lasso.coordinates) &&
                       !context.features().isHidden(entity, graph, entity.geometry(graph));
               }), 'id');
           }

           function mouseup() {
               selection
                   .on('mousemove.lasso', null)
                   .on('mouseup.lasso', null);

               if (!lasso) return;

               var ids = lassoed();
               lasso.close();

               if (ids.length) {
                   context.enter(iD.modes.Select(context, ids));
               }
           }

           selection
               .on('mousedown.lasso', mousedown);
       };

       behavior.off = function(selection) {
           selection.on('mousedown.lasso', null);
       };

       return behavior;
   }

   function Paste(context) {
       var keybinding = d3.keybinding('paste');

       function omitTag(v, k) {
           return (
               k === 'phone' ||
               k === 'fax' ||
               k === 'email' ||
               k === 'website' ||
               k === 'url' ||
               k === 'note' ||
               k === 'description' ||
               k.indexOf('name') !== -1 ||
               k.indexOf('wiki') === 0 ||
               k.indexOf('addr:') === 0 ||
               k.indexOf('contact:') === 0
           );
       }

       function doPaste() {
           d3.event.preventDefault();
           if (context.inIntro()) return;

           var baseGraph = context.graph(),
               mouse = context.mouse(),
               projection = context.projection,
               viewport = iD.geo.Extent(projection.clipExtent()).polygon();

           if (!iD.geo.pointInPolygon(mouse, viewport)) return;

           var extent = iD.geo.Extent(),
               oldIDs = context.copyIDs(),
               oldGraph = context.copyGraph(),
               newIDs = [];

           if (!oldIDs.length) return;

           var action = iD.actions.CopyEntities(oldIDs, oldGraph);
           context.perform(action);

           var copies = action.copies();
           for (var id in copies) {
               var oldEntity = oldGraph.entity(id),
                   newEntity = copies[id];

               extent._extend(oldEntity.extent(oldGraph));
               newIDs.push(newEntity.id);
               context.perform(iD.actions.ChangeTags(newEntity.id, _.omit(newEntity.tags, omitTag)));
           }

           // Put pasted objects where mouse pointer is..
           var center = projection(extent.center()),
               delta = [ mouse[0] - center[0], mouse[1] - center[1] ];

           context.perform(iD.actions.Move(newIDs, delta, projection));
           context.enter(iD.modes.Move(context, newIDs, baseGraph));
       }

       function paste() {
           keybinding.on(iD.ui.cmd('⌘V'), doPaste);
           d3.select(document).call(keybinding);
           return paste;
       }

       paste.off = function() {
           d3.select(document).call(keybinding.off);
       };

       return paste;
   }

   function Select(context) {
       function keydown() {
           if (d3.event && d3.event.shiftKey) {
               context.surface()
                   .classed('behavior-multiselect', true);
           }
       }

       function keyup() {
           if (!d3.event || !d3.event.shiftKey) {
               context.surface()
                   .classed('behavior-multiselect', false);
           }
       }

       function click() {
           var datum = d3.event.target.__data__,
               lasso = d3.select('#surface .lasso').node(),
               mode = context.mode();

           if (!(datum instanceof iD.Entity)) {
               if (!d3.event.shiftKey && !lasso && mode.id !== 'browse')
                   context.enter(iD.modes.Browse(context));

           } else if (!d3.event.shiftKey && !lasso) {
               // Avoid re-entering Select mode with same entity.
               if (context.selectedIDs().length !== 1 || context.selectedIDs()[0] !== datum.id) {
                   context.enter(iD.modes.Select(context, [datum.id]));
               } else {
                   mode.suppressMenu(false).reselect();
               }
           } else if (context.selectedIDs().indexOf(datum.id) >= 0) {
               var selectedIDs = _.without(context.selectedIDs(), datum.id);
               context.enter(selectedIDs.length ?
                   iD.modes.Select(context, selectedIDs) :
                   iD.modes.Browse(context));

           } else {
               context.enter(iD.modes.Select(context, context.selectedIDs().concat([datum.id])));
           }
       }

       var behavior = function(selection) {
           d3.select(window)
               .on('keydown.select', keydown)
               .on('keyup.select', keyup);

           selection.on('click.select', click);

           keydown();
       };

       behavior.off = function(selection) {
           d3.select(window)
               .on('keydown.select', null)
               .on('keyup.select', null);

           selection.on('click.select', null);

           keyup();
       };

       return behavior;
   }

   exports.AddWay = AddWay;
   exports.Breathe = Breathe;
   exports.Copy = Copy;
   exports.drag = drag;
   exports.DrawWay = DrawWay;
   exports.Draw = Draw;
   exports.Edit = Edit;
   exports.Hash = Hash;
   exports.Hover = Hover;
   exports.Lasso = Lasso;
   exports.Paste = Paste;
   exports.Select = Select;
   exports.Tail = Tail;

   Object.defineProperty(exports, '__esModule', { value: true });

}));