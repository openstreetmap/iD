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

        it("emits a change event", function () {
            history.on('change', spy);
            history.perform(action);
            expect(spy).to.have.been.called;
        });

        it("does not emit a change event when performing a noop", function () {
            history.on('change', spy);
            history.perform(iD.actions.Noop);
            expect(spy).not.to.have.been.called;
        });

        it("performs multiple actions", function () {
            var action1 = sinon.stub().returns(graph),
                action2 = sinon.stub().returns(graph);
            history.perform(action1, action2);
            expect(action1).to.have.been.called;
            expect(action2).to.have.been.called;
        });
    });

    describe("#replace", function () {
        it("updates the graph", function () {
            history.replace(action);
            expect(history.graph()).to.equal(graph);
        });

        it("replaces the undo stack", function () {
            history.perform(action);
            history.replace(action);
            history.undo();
            expect(history.undoAnnotation()).to.be.undefined;
        });

        it("emits a change event", function () {
            history.on('change', spy);
            history.replace(action);
            expect(spy).to.have.been.called;
        });

        it("does not emit a change event when performing a noop", function () {
            history.on('change', spy);
            history.replace(iD.actions.Noop);
            expect(spy).not.to.have.been.called;
        });

        it("performs multiple actions", function () {
            var action1 = sinon.stub().returns(graph),
                action2 = sinon.stub().returns(graph);
            history.replace(action1, action2);
            expect(action1).to.have.been.called;
            expect(action2).to.have.been.called;
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

        it("emits a change event", function () {
            history.perform(action);
            history.on('change', spy);
            history.undo();
            expect(spy).to.have.been.called;
        });
    });

    describe("#redo", function () {
        it("emits a change event", function () {
            history.perform(action);
            history.undo();
            history.on('change', spy);
            history.redo();
            expect(spy).to.have.been.called;
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
});
