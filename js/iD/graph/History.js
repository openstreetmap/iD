iD.History = function() {
    this.stack = [new iD.Graph()];
    this.index = 0;
};

iD.History.prototype = {
    graph: function() {
        return this.stack[this.index];
    },

    do: function(operation) {
        this.stack = this.stack.slice(0, this.index + 1);
        this.stack.push(operation(this.graph()));
        this.index++;
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
    },

    entity: function(id) {
        return this.graph().entity(id);
    },

    fetch: function(id) {
        return this.graph().fetch(id);
    }
};
