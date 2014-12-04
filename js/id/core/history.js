iD.History = function(context) {
    var stack, index, tree,
        imageryUsed = ['Bing'],
        dispatch = d3.dispatch('change', 'undone', 'redone'),
        lock = iD.util.SessionMutex('lock');

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
            imageryUsed: imageryUsed
        };
    }

    function change(previous) {
        var difference = iD.Difference(previous, history.graph());
        dispatch.change(difference);
        return difference;
    }

    // iD uses namespaced keys so multiple installations do not conflict
    function getKey(n) {
        return 'iD_' + window.location.origin + '_' + n;
    }

    var history = {
        graph: function() {
            return stack[index].graph;
        },

        merge: function(entities, extent) {
            stack[0].graph.rebase(entities, _.pluck(stack, 'graph'));
            tree.rebase(entities);

            dispatch.change(undefined, extent);
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
            return tree.intersects(extent, stack[index].graph);
        },

        difference: function() {
            var base = stack[0].graph,
                head = stack[index].graph;
            return iD.Difference(base, head);
        },

        changes: function(action) {
            var base = stack[0].graph,
                head = stack[index].graph;

            if (action) {
                head = action(head);
            }

            var difference = iD.Difference(base, head);

            return {
                modified: difference.modified(),
                created: difference.created(),
                deleted: difference.deleted()
            };
        },

        hasChanges: function() {
            return this.difference().length() > 0;
        },

        imageryUsed: function(sources) {
            if (sources) {
                imageryUsed = sources;
                return history;
            } else {
                return _(stack.slice(1, index + 1))
                    .pluck('imageryUsed')
                    .flatten()
                    .unique()
                    .without(undefined, 'Custom')
                    .value();
            }
        },

        reset: function() {
            stack = [{graph: iD.Graph()}];
            index = 0;
            tree = iD.Tree(stack[0].graph);
            dispatch.change();
            return history;
        },

        toJSON: function() {
            if (stack.length <= 1) return;

            var allEntities = {},
                baseEntities = {},
                base = stack[0];

            var s = stack.map(function(i) {
                var modified = [], deleted = [];

                _.forEach(i.graph.entities, function(entity, id) {
                    if (entity) {
                        var key = iD.Entity.key(entity);
                        allEntities[key] = entity;
                        modified.push(key);
                    } else {
                        deleted.push(id);
                    }

                    // make sure that the originals of changed or deleted entities get merged
                    // into the base of the stack after restoring the data from JSON.
                    if (id in base.graph.entities) {
                        baseEntities[id] = base.graph.entities[id];
                    }
                });

                var x = {};

                if (modified.length) x.modified = modified;
                if (deleted.length) x.deleted = deleted;
                if (i.imageryUsed) x.imageryUsed = i.imageryUsed;
                if (i.annotation) x.annotation = i.annotation;

                return x;
            });

            return JSON.stringify({
                version: 3,
                entities: _.values(allEntities),
                baseEntities: _.values(baseEntities),
                stack: s,
                nextIDs: iD.Entity.id.next,
                index: index
            });
        },

        fromJSON: function(json) {
            var h = JSON.parse(json);

            iD.Entity.id.next = h.nextIDs;
            index = h.index;

            if (h.version === 2 || h.version === 3) {
                var allEntities = {};

                h.entities.forEach(function(entity) {
                    allEntities[iD.Entity.key(entity)] = iD.Entity(entity);
                });

                if (h.version === 3) {
                    // this merges originals for changed entities into the base of
                    // the stack even if the current stack doesn't have them (for
                    // example when iD has been restarted in a different region)
                    var baseEntities = h.baseEntities.map(function(entity) {
                        return iD.Entity(entity);
                    });
                    stack[0].graph.rebase(baseEntities, _.pluck(stack, 'graph'));
                    tree.rebase(baseEntities);
                }

                stack = h.stack.map(function(d) {
                    var entities = {}, entity;

                    if (d.modified) {
                        d.modified.forEach(function(key) {
                            entity = allEntities[key];
                            entities[entity.id] = entity;
                        });
                    }

                    if (d.deleted) {
                        d.deleted.forEach(function(id) {
                            entities[id] = undefined;
                        });
                    }

                    return {
                        graph: iD.Graph(stack[0].graph).load(entities),
                        annotation: d.annotation,
                        imageryUsed: d.imageryUsed
                    };
                });
            } else { // original version
                stack = h.stack.map(function(d) {
                    var entities = {};

                    for (var i in d.entities) {
                        var entity = d.entities[i];
                        entities[i] = entity === 'undefined' ? undefined : iD.Entity(entity);
                    }

                    d.graph = iD.Graph(stack[0].graph).load(entities);
                    return d;
                });
            }

            dispatch.change();

            return history;
        },

        save: function() {
            if (lock.locked()) context.storage(getKey('saved_history'), history.toJSON() || null);
            return history;
        },

        clearSaved: function() {
            if (lock.locked()) context.storage(getKey('saved_history'), null);
            return history;
        },

        lock: function() {
            return lock.lock();
        },

        unlock: function() {
            lock.unlock();
        },

        // is iD not open in another window and it detects that
        // there's a history stored in localStorage that's recoverable?
        restorableChanges: function() {
            return lock.locked() && !!context.storage(getKey('saved_history'));
        },

        // load history from a version stored in localStorage
        restore: function() {
            if (!lock.locked()) return;

            var json = context.storage(getKey('saved_history'));
            if (json) history.fromJSON(json);
        },

        _getKey: getKey

    };

    history.reset();

    return d3.rebind(history, dispatch, 'on');
};
