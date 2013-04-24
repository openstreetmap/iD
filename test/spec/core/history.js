describe("iD.History", function () {
    var context, history, spy,
        action = function() { return iD.Graph(); };

    beforeEach(function () {
        context = iD();
        history = context.history();
        spy = sinon.spy();
        // clear lock
        context.storage(history._getKey('lock'), null);
    });

    describe("#graph", function () {
        it("returns the current graph", function () {
            expect(history.graph()).to.be.an.instanceOf(iD.Graph);
        });
    });

    describe("#merge", function () {
        it("merges the entities into all graph versions", function () {
            var n = iD.Node({id: 'n'});
            history.merge({n: n});
            expect(history.graph().entity('n')).to.equal(n);
        });

        it("emits a change event", function () {
            history.on('change', spy);
            history.merge({});
            expect(spy).to.have.been.called;
        });
    });

    describe("#perform", function () {
        it("returns a difference", function () {
            expect(history.perform(action).changes()).to.eql({});
        });

        it("updates the graph", function () {
            var node = iD.Node();
            history.perform(function (graph) { return graph.replace(node); });
            expect(history.graph().entity(node.id)).to.equal(node);
        });

        it("pushes an undo annotation", function () {
            history.perform(action, "annotation");
            expect(history.undoAnnotation()).to.equal("annotation");
        });

        it("emits a change event", function () {
            history.on('change', spy);
            var difference = history.perform(action);
            expect(spy).to.have.been.calledWith(difference);
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
        it("returns a difference", function () {
            expect(history.replace(action).changes()).to.eql({});
        });

        it("updates the graph", function () {
            var node = iD.Node();
            history.replace(function (graph) { return graph.replace(node); });
            expect(history.graph().entity(node.id)).to.equal(node);
        });

        it("replaces the undo annotation", function () {
            history.perform(action, "annotation1");
            history.replace(action, "annotation2");
            expect(history.undoAnnotation()).to.equal("annotation2");
        });

        it("emits a change event", function () {
            history.on('change', spy);
            var difference = history.replace(action);
            expect(spy).to.have.been.calledWith(difference);
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

    describe("#pop", function () {
        it("returns a difference", function () {
            history.perform(action, "annotation");
            expect(history.pop().changes()).to.eql({});
        });

        it("updates the graph", function () {
            history.perform(action, "annotation");
            history.pop();
            expect(history.undoAnnotation()).to.be.undefined;
        });

        it("does not push the redo stack", function () {
            history.perform(action, "annotation");
            history.pop();
            expect(history.redoAnnotation()).to.be.undefined;
        });

        it("emits a change event", function () {
            history.perform(action);
            history.on('change', spy);
            var difference = history.pop();
            expect(spy).to.have.been.calledWith(difference);
        });
    });

    describe("#undo", function () {
        it("returns a difference", function () {
            expect(history.undo().changes()).to.eql({});
        });

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

        it("emits an undone event", function () {
            history.perform(action);
            history.on('undone', spy);
            history.undo();
            expect(spy).to.have.been.called;
        });

        it("emits a change event", function () {
            history.perform(action);
            history.on('change', spy);
            var difference = history.undo();
            expect(spy).to.have.been.calledWith(difference);
        });
    });

    describe("#redo", function () {
        it("returns a difference", function () {
            expect(history.redo().changes()).to.eql({});
        });

        it("emits an redone event", function () {
            history.perform(action);
            history.undo();
            history.on('change', spy);
            history.redo();
            expect(spy).to.have.been.called;
        });

        it("emits a change event", function () {
            history.perform(action);
            history.undo();
            history.on('change', spy);
            var difference = history.redo();
            expect(spy).to.have.been.calledWith(difference);
        });
    });

    describe("#changes", function () {
        it("includes created entities", function () {
            var node = iD.Node();
            history.perform(function (graph) { return graph.replace(node); });
            expect(history.changes().created).to.eql([node]);
        });

        it("includes modified entities", function () {
            var node1 = iD.Node({id: "n1"}),
                node2 = node1.update({ tags: { yes: "no" } });
            history.merge({ n1: node1});
            history.perform(function (graph) { return graph.replace(node2); });
            expect(history.changes().modified).to.eql([node2]);
        });

        it("includes deleted entities", function () {
            var node = iD.Node({id: "n1"});
            history.merge({ n1: node });
            history.perform(function (graph) { return graph.remove(node); });
            expect(history.changes().deleted).to.eql([node]);
        });
    });

    describe("#hasChanges", function() {
        it("is true when any of change's values are nonempty", function() {
            var node = iD.Node();
            history.perform(function (graph) { return graph.replace(node); });
            expect(history.hasChanges()).to.eql(true);
        });

        it("is false when all of change's values are empty", function() {
            expect(history.hasChanges()).to.eql(false);
        });
    });

    describe("#numChanges", function() {
        it("is 0 when there are no changes", function() {
            expect(history.numChanges()).to.eql(0);
        });

        it("is the sum of all types of changes", function() {
            var node1 = iD.Node({id: "n1"}),
                node2 = iD.Node();
            history.merge({ n1: node1 });
            history.perform(function (graph) { return graph.remove(node1); });
            expect(history.numChanges()).to.eql(1);
            history.perform(function (graph) { return graph.replace(node2); });
            expect(history.numChanges()).to.eql(2);
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

    describe("#lock", function() {
        it("acquires lock if possible", function() {
            expect(history.lock()).to.be.true;
            expect(history.lock()).to.be.false;
        });
    });

    describe("#save", function() {

        it("doesn't do anything if it doesn't have the lock", function() {
            var key = history._getKey('saved_history');
            context.storage(key, null);
            history.save();
            expect(context.storage(key)).to.be.undefined;
            context.storage(key, 'something');
            expect(context.storage(key)).to.equal('something');
            history.save();
            context.storage(key, null);
        });

        it("saves to localStorage", function() {
            var node = iD.Node({ id: 'n' });
            history.lock();
            history.perform(iD.actions.AddEntity(node));
            history.save();
            var saved = JSON.parse(context.storage(history._getKey('saved_history')));
            expect(saved.stack[1].entities.n.id).to.eql('n');
        });
    });

    describe("#restore", function() {
        it("saves and restores a created and deleted entities", function() {
            var node = iD.Node({ id: 'n' }),
                node2 = iD.Node({ id: 'n2' });
            history.lock();
            history.perform(iD.actions.AddEntity(node));
            history.perform(iD.actions.AddEntity(node2));
            history.perform(iD.actions.DeleteNode('n2'));
            history.save();
            history.reset();
            expect(history.graph().hasEntity('n')).to.be.undefined
            history.restore();
            expect(history.graph().entity('n').id).to.equal('n');
            expect(history.graph().hasEntity('n2')).to.be.undefined;
        });
    });
});
