iD.History = function() {
    var stack, index,
        dispatch = d3.dispatch('change');

    function perform(actions) {
        actions = Array.prototype.slice.call(actions);

        var annotation;

        if (_.isString(_.last(actions))) {
            annotation = actions.pop();
        }

        var graph = stack[index].graph;
        for (var i = 0; i < actions.length; i++) {
            graph = actions[i](graph);
        }

        return {graph: graph, annotation: annotation};
    }

    function change(previous) {
        dispatch.change(history.graph().difference(previous));
    }

    var history = {
        graph: function () {
            return stack[index].graph;
        },

        merge: function (graph) {
            for (var i = 0; i < stack.length; i++) {
                stack[i].graph = stack[i].graph.merge(graph);
            }
        },

        perform: function () {
            var previous = stack[index].graph;

            stack = stack.slice(0, index + 1);
            stack.push(perform(arguments));
            index++;

            change(previous);
        },

        replace: function () {
            var previous = stack[index].graph;

            // assert(index == stack.length - 1)
            stack[index] = perform(arguments);

            change(previous);
        },

        undo: function () {
            var previous = stack[index].graph;

            while (index > 0) {
                index--;
                if (stack[index].annotation) break;
            }

            change(previous);
        },

        redo: function () {
            var previous = stack[index].graph;

            while (index < stack.length - 1) {
                index++;
                if (stack[index].annotation) break;
            }

            change(previous);
        },

        undoAnnotation: function () {
            var i = index;
            while (i >= 0) {
                if (stack[i].annotation) return stack[i].annotation;
                i--;
            }
        },

        redoAnnotation: function () {
            var i = index + 1;
            while (i <= stack.length - 1) {
                if (stack[i].annotation) return stack[i].annotation;
                i++;
            }
        },

        changes: function () {
            var initial = stack[0].graph,
                current = stack[index].graph;

            return {
                modified: current.modified().map(function (id) {
                    return current.fetch(id);
                }),
                created: current.created().map(function (id) {
                    return current.fetch(id);
                }),
                deleted: current.deleted().map(function (id) {
                    return initial.fetch(id);
                })
            };
        },

        reset: function () {
            stack = [{graph: iD.Graph()}];
            index = 0;
            dispatch.change();
        }
    };

    history.reset();

    return d3.rebind(history, dispatch, 'on');
};
