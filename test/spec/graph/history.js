describe("iD.History", function () {
    var history, spy,
        action = function() { return iD.Graph(); };

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
            var graph = iD.Graph();
            history.perform(d3.functor(graph));
            expect(history.graph()).to.equal(graph);
        });

        it("pushes an undo annotation", function () {
            history.perform(action, "annotation");
            expect(history.undoAnnotation()).to.equal("annotation");
        });

        it("emits a change event", function () {
            history.on('change', spy);
            history.perform(action);
            expect(spy).to.have.been.called;
        });

        it("performs multiple actions", function () {
            var action1 = sinon.stub().returns(iD.Graph()),
                action2 = sinon.stub().returns(iD.Graph());
            history.perform(action1, action2, "annotation");
            expect(action1).to.have.been.called;
            expect(action2).to.have.been.called;
            expect(history.undoAnnotation()).to.equal("annotation");
        });
    });

    describe("#replace", function () {
        it("updates the graph", function () {
            var graph = iD.Graph();
            history.replace(d3.functor(graph));
            expect(history.graph()).to.equal(graph);
        });

        it("replaces the undo annotation", function () {
            history.perform(action, "annotation1");
            history.replace(action, "annotation2");
            expect(history.undoAnnotation()).to.equal("annotation2");
        });

        it("emits a change event", function () {
            history.on('change', spy);
            history.replace(action);
            expect(spy).to.have.been.called;
        });

        it("performs multiple actions", function () {
            var action1 = sinon.stub().returns(iD.Graph()),
                action2 = sinon.stub().returns(iD.Graph());
            history.replace(action1, action2, "annotation");
            expect(action1).to.have.been.called;
            expect(action2).to.have.been.called;
            expect(history.undoAnnotation()).to.equal("annotation");
        });
    });

    describe("#undo", function () {
        it("pops the undo stack", function () {
            history.perform(action, "annotation");
            history.undo();
            expect(history.undoAnnotation()).to.be.undefined;
        });

        it("pushes the redo stack", function () {
            history.perform(action, "annotation");
            history.undo();
            expect(history.redoAnnotation()).to.equal("annotation");
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
            history.perform(action, "annotation");
            history.perform(action, "annotation");
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
