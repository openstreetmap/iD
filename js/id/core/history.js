iD.History = function(context) {
    var stack, index,
        imagery_used = 'Bing',
        dispatch = d3.dispatch('change', 'undone', 'redone'),
        lock = false;

    var rtree = new RTree(),
        treeGraph;

    function perform(actions) {
        actions = Array.prototype.slice.call(actions);

        var annotation;

        if (!_.isFunction(_.last(actions))) {
            annotation = actions.pop();
        }

        var graph = stack[index].graph;
        for (var i = 0; i < actions.length; i++) {
            graph = actions[i](graph);
        }

        return {
            graph: graph,
            annotation: annotation,
            imagery_used: imagery_used
        };
    }

    function change(previous) {
        var difference = iD.Difference(previous, history.graph());
        dispatch.change(difference);
        return difference;
    }

    function getKey(n) {
        return 'iD_' + window.location.origin + '_' + n;
    }

    function rebaseTree(entities) {
        for (var i = 0; i < entities.length; i++) {
            insert(stack[index].graph.entities[entities[i]]);
        }
    }

    function extentRectangle(extent) {
        var m = 1000 * 1000 * 100,
            x = m * extent[0][0],
            y = m * extent[0][1],
            dx = m * extent[1][0] - x || 2,
            dy = m * extent[1][1] - y || 2;
        return new RTree.Rectangle(~~x, ~~y, ~~dx - 1, ~~dy - 1);
    }

    function insert(entity) {
        rtree.insert(extentRectangle(entity.extent(stack[index].graph)), entity.id);
    }

    function remove(entity) {
        var r= rtree.remove(extentRectangle(entity.extent(treeGraph)), entity.id);
    }

    function reinsert(entity) {
        remove(treeGraph.entities[entity.id]);
        insert(entity);
    }

    var history = {
        graph: function() {
            return stack[index].graph;
        },

        merge: function(entities) {

            var base = treeGraph.base(),
                newentities = Object.keys(entities).filter(function(i) {
                return !treeGraph.entities.hasOwnProperty(i) && !base.entities[i];
            });

            for (var i = 0; i < stack.length; i++) {
                stack[i].graph.rebase(entities);
            }
            rebaseTree(newentities);
            dispatch.change();
        },

        perform: function() {
            var previous = stack[index].graph;

            stack = stack.slice(0, index + 1);
            stack.push(perform(arguments));
            index++;

            return change(previous);
        },

        replace: function() {
            var previous = stack[index].graph;

            // assert(index == stack.length - 1)
            stack[index] = perform(arguments);

            return change(previous);
        },

        pop: function() {
            var previous = stack[index].graph;

            if (index > 0) {
                index--;
                stack.pop();
                return change(previous);
            }
        },

        undo: function() {
            var previous = stack[index].graph;

            // Pop to the first annotated state.
            while (index > 0) {
                if (stack[index].annotation) break;
                index--;
            }

            // Pop to the next annotated state.
            while (index > 0) {
                index--;
                if (stack[index].annotation) break;
            }

            dispatch.undone();
            return change(previous);
        },

        redo: function() {
            var previous = stack[index].graph;

            while (index < stack.length - 1) {
                index++;
                if (stack[index].annotation) break;
            }

            dispatch.redone();
            return change(previous);
        },

        undoAnnotation: function() {
            var i = index;
            while (i >= 0) {
                if (stack[i].annotation) return stack[i].annotation;
                i--;
            }
        },

        redoAnnotation: function() {
            var i = index + 1;
            while (i <= stack.length - 1) {
                if (stack[i].annotation) return stack[i].annotation;
                i++;
            }
        },

        intersects: function(extent) {
            if (treeGraph !== stack[index].graph) {
                var diff = iD.Difference(treeGraph, stack[index].graph),
                    modified = {};

                diff.modified().forEach(function(d) {
                    var loc = treeGraph.entities[d.id].loc;
                    if (!loc || loc[0] !== d.loc[0] || loc[1] !== d.loc[1]) {
                        modified[d.id] = d;
                    }
                });

                d3.values(diff.addParents(modified)).map(reinsert);
                diff.created().forEach(insert);
                diff.deleted().forEach(remove);

                treeGraph = stack[index].graph;
            }

            return rtree.search(extentRectangle(extent))
                .map(function(id) { return treeGraph.entity(id); });
        },

        difference: function() {
            var base = stack[0].graph,
                head = stack[index].graph;
            return iD.Difference(base, head);
        },

        changes: function() {
            var difference = history.difference();

            function discardTags(entity) {
                if (_.isEmpty(entity.tags)) {
                    return entity;
                } else {
                    return entity.update({
                        tags: _.omit(entity.tags, iD.data.discarded)
                    });
                }
            }

            return {
                modified: d3.values(difference.modified()).map(discardTags),
                created: difference.created().map(discardTags),
                deleted: difference.deleted()
            };
        },

        hasChanges: function() {
            return this.difference().length() > 0;
        },

        numChanges: function() {
            return this.difference().length();
        },

        imagery_used: function(source) {
            if (source) imagery_used = source;
            else return _.without(
                    _.unique(_.pluck(stack.slice(1, index + 1), 'imagery_used')),
                    undefined, 'Custom');
        },

        reset: function() {
            stack = [{graph: iD.Graph()}];
            index = 0;
            treeGraph = stack[0].graph;
            dispatch.change();
        },

        save: function() {
            if (!lock) return;
            context.storage(getKey('lock'), null);

            if (stack.length <= 1) {
                context.storage(getKey('history'), null);
                context.storage(getKey('nextIDs'), null);
                context.storage(getKey('index'), null);
                return;
            }

            var json = JSON.stringify(stack.map(function(i) {
                return {
                    annotation: i.annotation,
                    imagery_used: i.imagery_used,
                    entities: i.graph.entities
                };
            }));

            context.storage(getKey('history'), json);
            context.storage(getKey('nextIDs'), JSON.stringify(iD.Entity.id.next));
            context.storage(getKey('index'), index);
        },

        lock: function() {
            if (context.storage(getKey('lock'))) return false;
            context.storage(getKey('lock'), true);
            lock = true;
            return lock;
        },

        restorableChanges: function() {
            return lock && !!context.storage(getKey('history'));
        },

        load: function() {
            if (!lock) return;

            var json = context.storage(getKey('history')),
                nextIDs = context.storage(getKey('nextIDs')),
                index_ = context.storage(getKey('index'));

            if (!json) return;
            if (nextIDs) iD.Entity.id.next = JSON.parse(nextIDs);
            if (index_ !== null) index = parseInt(index_, 10);

            context.storage(getKey('history', null));
            context.storage(getKey('nextIDs', null));
            context.storage(getKey('index', null));

            stack = JSON.parse(json).map(function(d, i) {
                d.graph = iD.Graph(stack[0].graph).load(d.entities);
                return d;
            });
            dispatch.change();

        }

    };

    history.reset();

    return d3.rebind(history, dispatch, 'on');
};
