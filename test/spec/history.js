describe("History", function () {
    var history, spy,
        graph = iD.Graph([], "action"),
        action = function() { return graph; };

    beforeEach(function () {
        history = iD.History();
        spy = sinon.spy();
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

    describe("#reset", function () {
        it("clears the version stack", function () {
            history.perform(action);
            history.perform(action);
            history.undo();
            history.reset();
            expect(history.undoAnnotation()).to.be.undefined;
            expect(history.redoAnnotation()).to.be.undefined;
        });

        it("emits a change event", function () {
            history.on('change', spy);
            history.reset();
            expect(spy).to.have.been.called;
        });
    });

    describe("change", function () {
        it("is not emitted when performing a noop", function () {
            history.on('change', spy);
            history.perform(iD.actions.noop);
            expect(spy).not.to.have.been.called;
        });

        it("is emitted when performing an action", function () {
            history.on('change', spy);
            history.perform(action);
            expect(spy).to.have.been.called;
        });

        it("is emitted when undoing an action", function () {
            history.perform(action);
            history.on('change', spy);
            history.undo();
            expect(spy).to.have.been.called;
        });

        it("is emitted when redoing an action", function () {
            history.perform(action);
            history.undo();
            history.on('change', spy);
            history.redo();
            expect(spy).to.have.been.called;
        });
    });
});
