iD.History = function() {
    var stack = [iD.Graph()],
        index = 0;

    return {
        graph: function () {
            return stack[index];
        },

        merge: function (graph) {
            for (var i = 0; i < stack.length; i++) {
                stack[i] = stack[i].merge(graph);
            }
        },

        perform: function (action) {
            stack = stack.slice(0, index + 1);
            stack.push(action(this.graph()));
            index++;
        },

        replace: function (action) {
            // assert(index == stack.length - 1)
            stack[index] = action(this.graph());
        },

        undo: function () {
            while (index > 0) {
                index--;
                if (stack[index].annotation) break;
            }
        },

        redo: function () {
            while (index < stack.length - 1) {
                index++;
                if (stack[index].annotation) break;
            }
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
        }
    }
};
