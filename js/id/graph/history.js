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

    function maybeChange() {
        if (stack[index].annotation) {
            dispatch.change();
        }
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
            stack = stack.slice(0, index + 1);
            stack.push(perform(arguments));
            index++;
            dispatch.change();
        },

        replace: function () {
            // assert(index == stack.length - 1)
            stack[index] = perform(arguments);
            dispatch.change();
        },

        undo: function () {
            while (index > 0) {
                index--;
                if (stack[index].annotation) break;
            }
            dispatch.change();
        },

        redo: function () {
            while (index < stack.length - 1) {
                index++;
                if (stack[index].annotation) break;
            }
            dispatch.change();
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

        // generate reports of changes for changesets to use
        modify: function () {
            return stack[index].graph.modifications();
        },

        create: function () {
            return stack[index].graph.creations();
        },

        'delete': function () {
            return _.difference(
                _.pluck(stack[0].graph.entities, 'id'),
                _.pluck(stack[index].graph.entities, 'id')
            ).map(function (id) {
                return stack[0].graph.fetch(id);
            });
        },

        changes: function () {
            return {
                modify: this.modify(),
                create: this.create(),
                'delete': this['delete']()
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
