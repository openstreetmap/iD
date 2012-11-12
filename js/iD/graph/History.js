iD.History = function() {
    if (!(this instanceof iD.History)) return new iD.History();
    this.stack = [iD.Graph()];
    this.index = 0;
};

iD.History.prototype = {
    graph: function() {
        return this.stack[this.index];
    },

    merge: function(graph) {
        for (var i = 0; i < this.stack.length; i++) {
            this.stack[i] = this.stack[i].merge(graph);
        }
    },

    operate: function(operation) {
        this.stack = this.stack.slice(0, this.index + 1);
        this.stack.push(operation(this.graph()));
        this.index++;
    },

    replace: function(operation) {
        // assert(this.index == this.stack.length - 1)
        this.stack[this.index] = operation(this.graph());
    },

    undo: function() {
        while (this.index > 0) {
            this.index--;
            if (this.stack[this.index].annotation) break;
        }
    },

    redo: function() {
        while (this.index < this.stack.length - 1) {
            this.index++;
            if (this.stack[this.index].annotation) break;
        }
    }
};
