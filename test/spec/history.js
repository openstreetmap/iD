describe("History", function () {
    var history, spy,
        graph = iD.Graph([], "action"),
        action = function() { return graph; };

    beforeEach(function () {
       history = iD.History();
    });

    describe("#graph", function () {
        it("returns the current graph", function () {
            expect(history.graph()).to.be.an.instanceOf(iD.Graph);
        });
    });

    describe("#perform", function () {
        it("updates the graph", function () {
            history.perform(action);
            expect(history.graph()).to.equal(graph);
        });

        it("pushes the undo stack", function () {
            history.perform(action);
            expect(history.undoAnnotation()).to.equal("action");
        });
    });

    describe("#undo", function () {
        it("pops the undo stack", function () {
            history.perform(action);
            history.undo();
            expect(history.undoAnnotation()).to.be.undefined;
        });

        it("pushes the redo stack", function () {
            history.perform(action);
            history.undo();
            expect(history.redoAnnotation()).to.equal("action");
        });
    });
});
