iD.History = function() {
    var stack, index,
        imagery_used = 'Bing',
        dispatch = d3.dispatch('change', 'undone', 'redone');

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

        return {graph: graph, annotation: annotation, imagery_used: imagery_used};
    }

    function change(previous) {
        var difference = iD.Difference(previous, history.graph());
        dispatch.change(difference);
        return difference;
    }

    var history = {
        graph: function() {
            return stack[index].graph;
        },

        merge: function(entities) {
            for (var i = 0; i < stack.length; i++) {
                stack[i].graph.rebase(entities);
            }

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

        difference: function() {
            var base = stack[0].graph,
                head = stack[index].graph;
            return iD.Difference(base, head);
        },

        changes: function() {
            var difference = history.difference();
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
            dispatch.change();
        }
    };

    history.reset();

    return d3.rebind(history, dispatch, 'on');
};
