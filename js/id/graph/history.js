iD.History = function() {
    var stack, index,
        dispatch = d3.dispatch('change');

    function maybeChange() {
        if (stack[index].annotation) {
            dispatch.change();
        }
    }

    var history = {
        graph: function () {
            return stack[index];
        },

        merge: function (graph) {
            for (var i = 0; i < stack.length; i++) {
                stack[i] = stack[i].merge(graph);
            }
        },

        perform: function () {
            stack = stack.slice(0, index + 1);

            var graph = this.graph();
            for (var i = 0; i < arguments.length; i++) {
                graph = arguments[i](graph);
            }

            stack.push(graph);
            index++;
            maybeChange();
        },

        replace: function () {
            // assert(index == stack.length - 1)

            var graph = this.graph();
            for (var i = 0; i < arguments.length; i++) {
                graph = arguments[i](graph);
            }

            stack[index] = graph;
            maybeChange();
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
            return stack[index].modifications();
        },

        create: function () {
            return stack[index].creations();
        },

        'delete': function () {
            return _.difference(
                _.pluck(stack[0].entities, 'id'),
                _.pluck(stack[index].entities, 'id')
            ).map(function (id) {
                return stack[0].fetch(id);
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
            stack = [iD.Graph()];
            index = 0;
            dispatch.change();
        }
    };

    history.reset();

    return d3.rebind(history, dispatch, 'on');
};
