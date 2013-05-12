iD.History = function(context) {
    var stack, index, tree,
        imagery_used = 'Bing',
        dispatch = d3.dispatch('change', 'undone', 'redone'),
        lock = false;

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

    // iD uses namespaced keys so multiple installations do not conflict
    function getKey(n) {
        return 'iD_' + window.location.origin + '_' + n;
    }

    var history = {
        graph: function() {
            return stack[index].graph;
        },

        merge: function(entities) {

            var base = stack[0].graph.base(),
                newentities = Object.keys(entities).filter(function(i) {
                    return !base.entities[i];
                });

            for (var i = 0; i < stack.length; i++) {
                stack[i].graph.rebase(entities);
            }

            tree.rebase(newentities);

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
            tree = iD.Tree(stack[0].graph);
            dispatch.change();
            return history;
        },

        toJSON: function() {
            if (stack.length <= 1) return;

            var s = stack.map(function(i) {
                var x = { entities: i.graph.entities };
                if (i.imagery_used) x.imagery_used = i.imagery_used;
                if (i.annotation) x.annotation = i.annotation;
                return x;
            });

            return JSON.stringify({
                stack: s,
                nextIDs: iD.Entity.id.next,
                index: index
            }, function includeUndefined(key, value) {
                if (typeof value === 'undefined') return 'undefined';
                return value;
            });
        },

        fromJSON: function(json) {

            var h = JSON.parse(json);

            iD.Entity.id.next = h.nextIDs;
            index = h.index;
            stack = h.stack.map(function(d) {
                d.graph = iD.Graph(stack[0].graph).load(d.entities);
                return d;
            });
            stack[0].graph.inherited = false;
            dispatch.change();

            return history;
        },

        save: function() {
            if (!lock) return history;
            context.storage(getKey('lock'), null);
            context.storage(getKey('saved_history'), this.toJSON() || null);
            return history;
        },

        clearSaved: function() {
            if (!lock) return;
            context.storage(getKey('saved_history'), null);
        },

        lock: function() {
            if (context.storage(getKey('lock'))) return false;
            context.storage(getKey('lock'), true);
            lock = true;
            return lock;
        },

        // is iD not open in another window and it detects that
        // there's a history stored in localStorage that's recoverable?
        restorableChanges: function() {
            return lock && !!context.storage(getKey('saved_history'));
        },

        // load history from a version stored in localStorage
        restore: function() {
            if (!lock) return;

            var json = context.storage(getKey('saved_history'));
            if (json) this.fromJSON(json);

            context.storage(getKey('saved_history', null));

        },

        _getKey: getKey

    };

    history.reset();

    return d3.rebind(history, dispatch, 'on');
};
