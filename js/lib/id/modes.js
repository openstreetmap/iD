(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.iD = global.iD || {}, global.iD.modes = global.iD.modes || {})));
}(this, function (exports) { 'use strict';

    function AddArea(context) {
        var mode = {
            id: 'add-area',
            button: 'area',
            title: t('modes.add_area.title'),
            description: t('modes.add_area.description'),
            key: '3'
        };

        var behavior = iD.behavior.AddWay(context)
                .tail(t('modes.add_area.tail'))
                .on('start', start)
                .on('startFromWay', startFromWay)
                .on('startFromNode', startFromNode),
            defaultTags = {area: 'yes'};

        function start(loc) {
            var graph = context.graph(),
                node = iD.Node({loc: loc}),
                way = iD.Way({tags: defaultTags});

            context.perform(
                iD.actions.AddEntity(node),
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id),
                iD.actions.AddVertex(way.id, node.id));

            context.enter(iD.modes.DrawArea(context, way.id, graph));
        }

        function startFromWay(loc, edge) {
            var graph = context.graph(),
                node = iD.Node({loc: loc}),
                way = iD.Way({tags: defaultTags});

            context.perform(
                iD.actions.AddEntity(node),
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id),
                iD.actions.AddVertex(way.id, node.id),
                iD.actions.AddMidpoint({ loc: loc, edge: edge }, node));

            context.enter(iD.modes.DrawArea(context, way.id, graph));
        }

        function startFromNode(node) {
            var graph = context.graph(),
                way = iD.Way({tags: defaultTags});

            context.perform(
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id),
                iD.actions.AddVertex(way.id, node.id));

            context.enter(iD.modes.DrawArea(context, way.id, graph));
        }

        mode.enter = function() {
            context.install(behavior);
        };

        mode.exit = function() {
            context.uninstall(behavior);
        };

        return mode;
    }

    function AddLine(context) {
        var mode = {
            id: 'add-line',
            button: 'line',
            title: t('modes.add_line.title'),
            description: t('modes.add_line.description'),
            key: '2'
        };

        var behavior = iD.behavior.AddWay(context)
            .tail(t('modes.add_line.tail'))
            .on('start', start)
            .on('startFromWay', startFromWay)
            .on('startFromNode', startFromNode);

        function start(loc) {
            var baseGraph = context.graph(),
                node = iD.Node({loc: loc}),
                way = iD.Way();

            context.perform(
                iD.actions.AddEntity(node),
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id));

            context.enter(iD.modes.DrawLine(context, way.id, baseGraph));
        }

        function startFromWay(loc, edge) {
            var baseGraph = context.graph(),
                node = iD.Node({loc: loc}),
                way = iD.Way();

            context.perform(
                iD.actions.AddEntity(node),
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id),
                iD.actions.AddMidpoint({ loc: loc, edge: edge }, node));

            context.enter(iD.modes.DrawLine(context, way.id, baseGraph));
        }

        function startFromNode(node) {
            var baseGraph = context.graph(),
                way = iD.Way();

            context.perform(
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id));

            context.enter(iD.modes.DrawLine(context, way.id, baseGraph));
        }

        mode.enter = function() {
            context.install(behavior);
        };

        mode.exit = function() {
            context.uninstall(behavior);
        };

        return mode;
    }

    function AddPoint(context) {
        var mode = {
            id: 'add-point',
            button: 'point',
            title: t('modes.add_point.title'),
            description: t('modes.add_point.description'),
            key: '1'
        };

        var behavior = iD.behavior.Draw(context)
            .tail(t('modes.add_point.tail'))
            .on('click', add)
            .on('clickWay', addWay)
            .on('clickNode', addNode)
            .on('cancel', cancel)
            .on('finish', cancel);

        function add(loc) {
            var node = iD.Node({loc: loc});

            context.perform(
                iD.actions.AddEntity(node),
                t('operations.add.annotation.point'));

            context.enter(
                iD.modes.Select(context, [node.id])
                    .suppressMenu(true)
                    .newFeature(true));
        }

        function addWay(loc) {
            add(loc);
        }

        function addNode(node) {
            add(node.loc);
        }

        function cancel() {
            context.enter(iD.modes.Browse(context));
        }

        mode.enter = function() {
            context.install(behavior);
        };

        mode.exit = function() {
            context.uninstall(behavior);
        };

        return mode;
    }

    function Browse(context) {
        var mode = {
            button: 'browse',
            id: 'browse',
            title: t('modes.browse.title'),
            description: t('modes.browse.description')
        }, sidebar;

        var behaviors = [
            iD.behavior.Paste(context),
            iD.behavior.Hover(context)
                .on('hover', context.ui().sidebar.hover),
            iD.behavior.Select(context),
            iD.behavior.Lasso(context),
            iD.modes.DragNode(context).behavior];

        mode.enter = function() {
            behaviors.forEach(function(behavior) {
                context.install(behavior);
            });

            // Get focus on the body.
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
            }

            if (sidebar) {
                context.ui().sidebar.show(sidebar);
            } else {
                context.ui().sidebar.select(null);
            }
        };

        mode.exit = function() {
            context.ui().sidebar.hover.cancel();
            behaviors.forEach(function(behavior) {
                context.uninstall(behavior);
            });

            if (sidebar) {
                context.ui().sidebar.hide();
            }
        };

        mode.sidebar = function(_) {
            if (!arguments.length) return sidebar;
            sidebar = _;
            return mode;
        };

        return mode;
    }

    function DragNode(context) {
        var mode = {
            id: 'drag-node',
            button: 'browse'
        };

        var nudgeInterval,
            activeIDs,
            wasMidpoint,
            cancelled,
            selectedIDs = [],
            hover = iD.behavior.Hover(context)
                .altDisables(true)
                .on('hover', context.ui().sidebar.hover),
            edit = iD.behavior.Edit(context);

        function edge(point, size) {
            var pad = [30, 100, 30, 100];
            if (point[0] > size[0] - pad[0]) return [-10, 0];
            else if (point[0] < pad[2]) return [10, 0];
            else if (point[1] > size[1] - pad[1]) return [0, -10];
            else if (point[1] < pad[3]) return [0, 10];
            return null;
        }

        function startNudge(nudge) {
            if (nudgeInterval) window.clearInterval(nudgeInterval);
            nudgeInterval = window.setInterval(function() {
                context.pan(nudge);
            }, 50);
        }

        function stopNudge() {
            if (nudgeInterval) window.clearInterval(nudgeInterval);
            nudgeInterval = null;
        }

        function moveAnnotation(entity) {
            return t('operations.move.annotation.' + entity.geometry(context.graph()));
        }

        function connectAnnotation(entity) {
            return t('operations.connect.annotation.' + entity.geometry(context.graph()));
        }

        function origin(entity) {
            return context.projection(entity.loc);
        }

        function start(entity) {
            cancelled = d3.event.sourceEvent.shiftKey ||
                context.features().hasHiddenConnections(entity, context.graph());

            if (cancelled) return behavior.cancel();

            wasMidpoint = entity.type === 'midpoint';
            if (wasMidpoint) {
                var midpoint = entity;
                entity = iD.Node();
                context.perform(iD.actions.AddMidpoint(midpoint, entity));

                 var vertex = context.surface()
                    .selectAll('.' + entity.id);
                 behavior.target(vertex.node(), entity);

            } else {
                context.perform(
                    iD.actions.Noop());
            }

            activeIDs = _.map(context.graph().parentWays(entity), 'id');
            activeIDs.push(entity.id);

            context.enter(mode);
        }

        function datum() {
            if (d3.event.sourceEvent.altKey) {
                return {};
            }

            return d3.event.sourceEvent.target.__data__ || {};
        }

        // via https://gist.github.com/shawnbot/4166283
        function childOf(p, c) {
            if (p === c) return false;
            while (c && c !== p) c = c.parentNode;
            return c === p;
        }

        function move(entity) {
            if (cancelled) return;
            d3.event.sourceEvent.stopPropagation();

            var nudge = childOf(context.container().node(),
                d3.event.sourceEvent.toElement) &&
                edge(d3.event.point, context.map().dimensions());

            if (nudge) startNudge(nudge);
            else stopNudge();

            var loc = context.projection.invert(d3.event.point);

            var d = datum();
            if (d.type === 'node' && d.id !== entity.id) {
                loc = d.loc;
            } else if (d.type === 'way' && !d3.select(d3.event.sourceEvent.target).classed('fill')) {
                loc = iD.geo.chooseEdge(context.childNodes(d), context.mouse(), context.projection).loc;
            }

            context.replace(
                iD.actions.MoveNode(entity.id, loc),
                moveAnnotation(entity));
        }

        function end(entity) {
            if (cancelled) return;

            var d = datum();

            if (d.type === 'way') {
                var choice = iD.geo.chooseEdge(context.childNodes(d), context.mouse(), context.projection);
                context.replace(
                    iD.actions.AddMidpoint({ loc: choice.loc, edge: [d.nodes[choice.index - 1], d.nodes[choice.index]] }, entity),
                    connectAnnotation(d));

            } else if (d.type === 'node' && d.id !== entity.id) {
                context.replace(
                    iD.actions.Connect([d.id, entity.id]),
                    connectAnnotation(d));

            } else if (wasMidpoint) {
                context.replace(
                    iD.actions.Noop(),
                    t('operations.add.annotation.vertex'));

            } else {
                context.replace(
                    iD.actions.Noop(),
                    moveAnnotation(entity));
            }

            var reselection = selectedIDs.filter(function(id) {
                return context.graph().hasEntity(id);
            });

            if (reselection.length) {
                context.enter(
                    iD.modes.Select(context, reselection)
                        .suppressMenu(true));
            } else {
                context.enter(iD.modes.Browse(context));
            }
        }

        function cancel() {
            behavior.cancel();
            context.enter(iD.modes.Browse(context));
        }

        function setActiveElements() {
            context.surface().selectAll(iD.util.entitySelector(activeIDs))
                .classed('active', true);
        }

        var behavior = iD.behavior.drag()
            .delegate('g.node, g.point, g.midpoint')
            .surface(context.surface().node())
            .origin(origin)
            .on('start', start)
            .on('move', move)
            .on('end', end);

        mode.enter = function() {
            context.install(hover);
            context.install(edit);

            context.history()
                .on('undone.drag-node', cancel);

            context.map()
                .on('drawn.drag-node', setActiveElements);

            setActiveElements();
        };

        mode.exit = function() {
            context.ui().sidebar.hover.cancel();
            context.uninstall(hover);
            context.uninstall(edit);

            context.history()
                .on('undone.drag-node', null);

            context.map()
                .on('drawn.drag-node', null);

            context.surface()
                .selectAll('.active')
                .classed('active', false);

            stopNudge();
        };

        mode.selectedIDs = function(_) {
            if (!arguments.length) return selectedIDs;
            selectedIDs = _;
            return mode;
        };

        mode.behavior = behavior;

        return mode;
    }

    function DrawArea(context, wayId, baseGraph) {
        var mode = {
            button: 'area',
            id: 'draw-area'
        };

        var behavior;

        mode.enter = function() {
            var way = context.entity(wayId),
                headId = way.nodes[way.nodes.length - 2],
                tailId = way.first();

            behavior = iD.behavior.DrawWay(context, wayId, -1, mode, baseGraph)
                .tail(t('modes.draw_area.tail'));

            var addNode = behavior.addNode;

            behavior.addNode = function(node) {
                if (node.id === headId || node.id === tailId) {
                    behavior.finish();
                } else {
                    addNode(node);
                }
            };

            context.install(behavior);
        };

        mode.exit = function() {
            context.uninstall(behavior);
        };

        mode.selectedIDs = function() {
            return [wayId];
        };

        return mode;
    }

    function DrawLine(context, wayId, baseGraph, affix) {
        var mode = {
            button: 'line',
            id: 'draw-line'
        };

        var behavior;

        mode.enter = function() {
            var way = context.entity(wayId),
                index = (affix === 'prefix') ? 0 : undefined,
                headId = (affix === 'prefix') ? way.first() : way.last();

            behavior = iD.behavior.DrawWay(context, wayId, index, mode, baseGraph)
                .tail(t('modes.draw_line.tail'));

            var addNode = behavior.addNode;

            behavior.addNode = function(node) {
                if (node.id === headId) {
                    behavior.finish();
                } else {
                    addNode(node);
                }
            };

            context.install(behavior);
        };

        mode.exit = function() {
            context.uninstall(behavior);
        };

        mode.selectedIDs = function() {
            return [wayId];
        };

        return mode;
    }

    function Move(context, entityIDs, baseGraph) {
        var mode = {
            id: 'move',
            button: 'browse'
        };

        var keybinding = d3.keybinding('move'),
            edit = iD.behavior.Edit(context),
            annotation = entityIDs.length === 1 ?
                t('operations.move.annotation.' + context.geometry(entityIDs[0])) :
                t('operations.move.annotation.multiple'),
            cache,
            origin,
            nudgeInterval;

        function vecSub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }

        function edge(point, size) {
            var pad = [30, 100, 30, 100];
            if (point[0] > size[0] - pad[0]) return [-10, 0];
            else if (point[0] < pad[2]) return [10, 0];
            else if (point[1] > size[1] - pad[1]) return [0, -10];
            else if (point[1] < pad[3]) return [0, 10];
            return null;
        }

        function startNudge(nudge) {
            if (nudgeInterval) window.clearInterval(nudgeInterval);
            nudgeInterval = window.setInterval(function() {
                context.pan(nudge);

                var currMouse = context.mouse(),
                    origMouse = context.projection(origin),
                    delta = vecSub(vecSub(currMouse, origMouse), nudge),
                    action = iD.actions.Move(entityIDs, delta, context.projection, cache);

                context.overwrite(action, annotation);

            }, 50);
        }

        function stopNudge() {
            if (nudgeInterval) window.clearInterval(nudgeInterval);
            nudgeInterval = null;
        }

        function move() {
            var currMouse = context.mouse(),
                origMouse = context.projection(origin),
                delta = vecSub(currMouse, origMouse),
                action = iD.actions.Move(entityIDs, delta, context.projection, cache);

            context.overwrite(action, annotation);

            var nudge = edge(currMouse, context.map().dimensions());
            if (nudge) startNudge(nudge);
            else stopNudge();
        }

        function finish() {
            d3.event.stopPropagation();
            context.enter(iD.modes.Select(context, entityIDs).suppressMenu(true));
            stopNudge();
        }

        function cancel() {
            if (baseGraph) {
                while (context.graph() !== baseGraph) context.pop();
                context.enter(iD.modes.Browse(context));
            } else {
                context.pop();
                context.enter(iD.modes.Select(context, entityIDs).suppressMenu(true));
            }
            stopNudge();
        }

        function undone() {
            context.enter(iD.modes.Browse(context));
        }

        mode.enter = function() {
            origin = context.map().mouseCoordinates();
            cache = {};

            context.install(edit);

            context.perform(
                iD.actions.Noop(),
                annotation);

            context.surface()
                .on('mousemove.move', move)
                .on('click.move', finish);

            context.history()
                .on('undone.move', undone);

            keybinding
                .on('⎋', cancel)
                .on('↩', finish);

            d3.select(document)
                .call(keybinding);
        };

        mode.exit = function() {
            stopNudge();

            context.uninstall(edit);

            context.surface()
                .on('mousemove.move', null)
                .on('click.move', null);

            context.history()
                .on('undone.move', null);

            keybinding.off();
        };

        return mode;
    }

    function RotateWay(context, wayId) {
        var mode = {
            id: 'rotate-way',
            button: 'browse'
        };

        var keybinding = d3.keybinding('rotate-way'),
            edit = iD.behavior.Edit(context);

        mode.enter = function() {
            context.install(edit);

            var annotation = t('operations.rotate.annotation.' + context.geometry(wayId)),
                way = context.graph().entity(wayId),
                nodes = _.uniq(context.graph().childNodes(way)),
                points = nodes.map(function(n) { return context.projection(n.loc); }),
                pivot = d3.geom.polygon(points).centroid(),
                angle;

            context.perform(
                iD.actions.Noop(),
                annotation);

            function rotate() {

                var mousePoint = context.mouse(),
                    newAngle = Math.atan2(mousePoint[1] - pivot[1], mousePoint[0] - pivot[0]);

                if (typeof angle === 'undefined') angle = newAngle;

                context.replace(
                    iD.actions.RotateWay(wayId, pivot, newAngle - angle, context.projection),
                    annotation);

                angle = newAngle;
            }

            function finish() {
                d3.event.stopPropagation();
                context.enter(iD.modes.Select(context, [wayId])
                    .suppressMenu(true));
            }

            function cancel() {
                context.pop();
                context.enter(iD.modes.Select(context, [wayId])
                    .suppressMenu(true));
            }

            function undone() {
                context.enter(iD.modes.Browse(context));
            }

            context.surface()
                .on('mousemove.rotate-way', rotate)
                .on('click.rotate-way', finish);

            context.history()
                .on('undone.rotate-way', undone);

            keybinding
                .on('⎋', cancel)
                .on('↩', finish);

            d3.select(document)
                .call(keybinding);
        };

        mode.exit = function() {
            context.uninstall(edit);

            context.surface()
                .on('mousemove.rotate-way', null)
                .on('click.rotate-way', null);

            context.history()
                .on('undone.rotate-way', null);

            keybinding.off();
        };

        return mode;
    }

    function Save(context) {
        var ui = iD.ui.Commit(context)
                .on('cancel', cancel)
                .on('save', save);

        function cancel() {
            context.enter(iD.modes.Browse(context));
        }

        function save(e, tryAgain) {
            function withChildNodes(ids, graph) {
                return _.uniq(_.reduce(ids, function(result, id) {
                    var e = graph.entity(id);
                    if (e.type === 'way') {
                        try {
                            var cn = graph.childNodes(e);
                            result.push.apply(result, _.map(_.filter(cn, 'version'), 'id'));
                        } catch (err) {
                            /* eslint-disable no-console */
                            if (typeof console !== 'undefined') console.error(err);
                            /* eslint-enable no-console */
                        }
                    }
                    return result;
                }, _.clone(ids)));
            }

            var loading = iD.ui.Loading(context).message(t('save.uploading')).blocking(true),
                history = context.history(),
                origChanges = history.changes(iD.actions.DiscardTags(history.difference())),
                localGraph = context.graph(),
                remoteGraph = iD.Graph(history.base(), true),
                modified = _.filter(history.difference().summary(), {changeType: 'modified'}),
                toCheck = _.map(_.map(modified, 'entity'), 'id'),
                toLoad = withChildNodes(toCheck, localGraph),
                conflicts = [],
                errors = [];

            if (!tryAgain) history.perform(iD.actions.Noop());  // checkpoint
            context.container().call(loading);

            if (toCheck.length) {
                context.connection().loadMultiple(toLoad, loaded);
            } else {
                finalize();
            }


            // Reload modified entities into an alternate graph and check for conflicts..
            function loaded(err, result) {
                if (errors.length) return;

                if (err) {
                    errors.push({
                        msg: err.responseText,
                        details: [ t('save.status_code', { code: err.status }) ]
                    });
                    showErrors();

                } else {
                    var loadMore = [];
                    _.each(result.data, function(entity) {
                        remoteGraph.replace(entity);
                        toLoad = _.without(toLoad, entity.id);

                        // Because loadMultiple doesn't download /full like loadEntity,
                        // need to also load children that aren't already being checked..
                        if (!entity.visible) return;
                        if (entity.type === 'way') {
                            loadMore.push.apply(loadMore,
                                _.difference(entity.nodes, toCheck, toLoad, loadMore));
                        } else if (entity.type === 'relation' && entity.isMultipolygon()) {
                            loadMore.push.apply(loadMore,
                                _.difference(_.map(entity.members, 'id'), toCheck, toLoad, loadMore));
                        }
                    });

                    if (loadMore.length) {
                        toLoad.push.apply(toLoad, loadMore);
                        context.connection().loadMultiple(loadMore, loaded);
                    }

                    if (!toLoad.length) {
                        checkConflicts();
                    }
                }
            }


            function checkConflicts() {
                function choice(id, text, action) {
                    return { id: id, text: text, action: function() { history.replace(action); } };
                }
                function formatUser(d) {
                    return '<a href="' + context.connection().userURL(d) + '" target="_blank">' + d + '</a>';
                }
                function entityName(entity) {
                    return iD.util.displayName(entity) || (iD.util.displayType(entity.id) + ' ' + entity.id);
                }

                function compareVersions(local, remote) {
                    if (local.version !== remote.version) return false;

                    if (local.type === 'way') {
                        var children = _.union(local.nodes, remote.nodes);

                        for (var i = 0; i < children.length; i++) {
                            var a = localGraph.hasEntity(children[i]),
                                b = remoteGraph.hasEntity(children[i]);

                            if (a && b && a.version !== b.version) return false;
                        }
                    }

                    return true;
                }

                _.each(toCheck, function(id) {
                    var local = localGraph.entity(id),
                        remote = remoteGraph.entity(id);

                    if (compareVersions(local, remote)) return;

                    var action = iD.actions.MergeRemoteChanges,
                        merge = action(id, localGraph, remoteGraph, formatUser);

                    history.replace(merge);

                    var mergeConflicts = merge.conflicts();
                    if (!mergeConflicts.length) return;  // merged safely

                    var forceLocal = action(id, localGraph, remoteGraph).withOption('force_local'),
                        forceRemote = action(id, localGraph, remoteGraph).withOption('force_remote'),
                        keepMine = t('save.conflict.' + (remote.visible ? 'keep_local' : 'restore')),
                        keepTheirs = t('save.conflict.' + (remote.visible ? 'keep_remote' : 'delete'));

                    conflicts.push({
                        id: id,
                        name: entityName(local),
                        details: mergeConflicts,
                        chosen: 1,
                        choices: [
                            choice(id, keepMine, forceLocal),
                            choice(id, keepTheirs, forceRemote)
                        ]
                    });
                });

                finalize();
            }


            function finalize() {
                if (conflicts.length) {
                    conflicts.sort(function(a,b) { return b.id.localeCompare(a.id); });
                    showConflicts();
                } else if (errors.length) {
                    showErrors();
                } else {
                    var changes = history.changes(iD.actions.DiscardTags(history.difference()));
                    if (changes.modified.length || changes.created.length || changes.deleted.length) {
                        context.connection().putChangeset(
                            changes,
                            e.comment,
                            history.imageryUsed(),
                            function(err, changeset_id) {
                                if (err) {
                                    errors.push({
                                        msg: err.responseText,
                                        details: [ t('save.status_code', { code: err.status }) ]
                                    });
                                    showErrors();
                                } else {
                                    history.clearSaved();
                                    success(e, changeset_id);
                                    // Add delay to allow for postgres replication #1646 #2678
                                    window.setTimeout(function() {
                                        loading.close();
                                        context.flush();
                                    }, 2500);
                                }
                            });
                    } else {        // changes were insignificant or reverted by user
                        loading.close();
                        context.flush();
                        cancel();
                    }
                }
            }


            function showConflicts() {
                var selection = context.container()
                    .select('#sidebar')
                    .append('div')
                    .attr('class','sidebar-component');

                loading.close();

                selection.call(iD.ui.Conflicts(context)
                    .list(conflicts)
                    .on('download', function() {
                        var data = JXON.stringify(context.connection().osmChangeJXON('CHANGEME', origChanges)),
                            win = window.open('data:text/xml,' + encodeURIComponent(data), '_blank');
                        win.focus();
                    })
                    .on('cancel', function() {
                        history.pop();
                        selection.remove();
                    })
                    .on('save', function() {
                        for (var i = 0; i < conflicts.length; i++) {
                            if (conflicts[i].chosen === 1) {  // user chose "keep theirs"
                                var entity = context.hasEntity(conflicts[i].id);
                                if (entity && entity.type === 'way') {
                                    var children = _.uniq(entity.nodes);
                                    for (var j = 0; j < children.length; j++) {
                                        history.replace(iD.actions.Revert(children[j]));
                                    }
                                }
                                history.replace(iD.actions.Revert(conflicts[i].id));
                            }
                        }

                        selection.remove();
                        save(e, true);
                    })
                );
            }


            function showErrors() {
                var selection = iD.ui.confirm(context.container());

                history.pop();
                loading.close();

                selection
                    .select('.modal-section.header')
                    .append('h3')
                    .text(t('save.error'));

                addErrors(selection, errors);
                selection.okButton();
            }


            function addErrors(selection, data) {
                var message = selection
                    .select('.modal-section.message-text');

                var items = message
                    .selectAll('.error-container')
                    .data(data);

                var enter = items.enter()
                    .append('div')
                    .attr('class', 'error-container');

                enter
                    .append('a')
                    .attr('class', 'error-description')
                    .attr('href', '#')
                    .classed('hide-toggle', true)
                    .text(function(d) { return d.msg || t('save.unknown_error_details'); })
                    .on('click', function() {
                        var error = d3.select(this),
                            detail = d3.select(this.nextElementSibling),
                            exp = error.classed('expanded');

                        detail.style('display', exp ? 'none' : 'block');
                        error.classed('expanded', !exp);

                        d3.event.preventDefault();
                    });

                var details = enter
                    .append('div')
                    .attr('class', 'error-detail-container')
                    .style('display', 'none');

                details
                    .append('ul')
                    .attr('class', 'error-detail-list')
                    .selectAll('li')
                    .data(function(d) { return d.details || []; })
                    .enter()
                    .append('li')
                    .attr('class', 'error-detail-item')
                    .text(function(d) { return d; });

                items.exit()
                    .remove();
            }

        }


        function success(e, changeset_id) {
            context.enter(iD.modes.Browse(context)
                .sidebar(iD.ui.Success(context)
                    .changeset({
                        id: changeset_id,
                        comment: e.comment
                    })
                    .on('cancel', function() {
                        context.ui().sidebar.hide();
                    })));
        }

        var mode = {
            id: 'save'
        };

        mode.enter = function() {
            context.connection().authenticate(function(err) {
                if (err) {
                    cancel();
                } else {
                    context.ui().sidebar.show(ui);
                }
            });
        };

        mode.exit = function() {
            context.ui().sidebar.hide();
        };

        return mode;
    }

    function Select(context, selectedIDs) {
        var mode = {
            id: 'select',
            button: 'browse'
        };

        var keybinding = d3.keybinding('select'),
            timeout = null,
            behaviors = [
                iD.behavior.Copy(context),
                iD.behavior.Paste(context),
                iD.behavior.Breathe(context),
                iD.behavior.Hover(context),
                iD.behavior.Select(context),
                iD.behavior.Lasso(context),
                iD.modes.DragNode(context)
                    .selectedIDs(selectedIDs)
                    .behavior],
            inspector,
            radialMenu,
            newFeature = false,
            suppressMenu = false;

        var wrap = context.container()
            .select('.inspector-wrap');


        function singular() {
            if (selectedIDs.length === 1) {
                return context.hasEntity(selectedIDs[0]);
            }
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
                    viewport = iD.geo.Extent(context.projection.clipExtent()).polygon();
                if (iD.geo.pointInPolygon(point, viewport)) {
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

        mode.reselect = function() {
            var surfaceNode = context.surface().node();
            if (surfaceNode.focus) { // FF doesn't support it
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

        mode.enter = function() {
            function update() {
                closeMenu();
                if (_.some(selectedIDs, function(id) { return !context.hasEntity(id); })) {
                    // Exit mode if selected entity gets undone
                    context.enter(iD.modes.Browse(context));
                }
            }

            function dblclick() {
                var target = d3.select(d3.event.target),
                    datum = target.datum();

                if (datum instanceof iD.Way && !target.classed('fill')) {
                    var choice = iD.geo.chooseEdge(context.childNodes(datum), context.mouse(), context.projection),
                        node = iD.Node();

                    var prev = datum.nodes[choice.index - 1],
                        next = datum.nodes[choice.index];

                    context.perform(
                        iD.actions.AddMidpoint({loc: choice.loc, edge: [prev, next]}, node),
                        t('operations.add.annotation.vertex'));

                    d3.event.preventDefault();
                    d3.event.stopPropagation();
                }
            }

            function selectElements(drawn) {
                var entity = singular();
                if (entity && context.geometry(entity.id) === 'relation') {
                    suppressMenu = true;
                    return;
                }

                var selection = context.surface()
                        .selectAll(iD.util.entityOrMemberSelector(selectedIDs, context.graph()));

                if (selection.empty()) {
                    if (drawn) {  // Exit mode if selected DOM elements have disappeared..
                        context.enter(iD.modes.Browse(context));
                    }
                } else {
                    selection
                        .classed('selected', true);
                }
            }

            function esc() {
                if (!context.inIntro()) {
                    context.enter(iD.modes.Browse(context));
                }
            }


            behaviors.forEach(function(behavior) {
                context.install(behavior);
            });

            var operations = _.without(d3.values(iD.operations), iD.operations.Delete)
                    .map(function(o) { return o(selectedIDs, context); })
                    .filter(function(o) { return o.available(); });

            operations.unshift(iD.operations.Delete(selectedIDs, context));

            keybinding
                .on('⎋', esc, true)
                .on('space', toggleMenu);

            operations.forEach(function(operation) {
                operation.keys.forEach(function(key) {
                    keybinding.on(key, function() {
                        if (!(context.inIntro() || operation.disabled())) {
                            operation();
                        }
                    });
                });
            });

            d3.select(document)
                .call(keybinding);

            radialMenu = iD.ui.RadialMenu(context, operations);

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

            timeout = window.setTimeout(function() {
                if (show) {
                    showMenu();
                }

                context.surface()
                    .on('dblclick.select', dblclick);
            }, 200);

            if (selectedIDs.length > 1) {
                var entities = iD.ui.SelectionList(context, selectedIDs);
                context.ui().sidebar.show(entities);
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

            context.history()
                .on('undone.select', null)
                .on('redone.select', null);

            context.surface()
                .on('dblclick.select', null)
                .selectAll('.selected')
                .classed('selected', false);

            context.map().on('drawn.select', null);
            context.ui().sidebar.hide();
        };

        return mode;
    }

    exports.AddArea = AddArea;
    exports.AddLine = AddLine;
    exports.AddPoint = AddPoint;
    exports.Browse = Browse;
    exports.DragNode = DragNode;
    exports.DrawArea = DrawArea;
    exports.DrawLine = DrawLine;
    exports.Move = Move;
    exports.RotateWay = RotateWay;
    exports.Save = Save;
    exports.Select = Select;

    Object.defineProperty(exports, '__esModule', { value: true });

}));