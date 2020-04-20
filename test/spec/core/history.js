describe('iD.coreHistory', function () {
    var context, history, spy;
    var actionNoop = function(g) { return g; };
    var actionAddNode = function (nodeID) {
        return function(g) {
            return g.replace(iD.osmNode({ id: nodeID }));
        };
    };

    beforeEach(function () {
        context = iD.coreContext().init();
        history = context.history();
        spy = sinon.spy();
        // clear lock
        iD.prefs(history._getKey('lock'), null);
    });

    describe('#graph', function () {
        it('returns the current graph', function () {
            expect(history.graph()).to.be.an.instanceOf(iD.coreGraph);
        });
    });

    describe('#merge', function () {
        it('merges the entities into all graph versions', function () {
            var n = iD.osmNode({id: 'n'});
            history.merge([n]);
            expect(history.graph().entity('n')).to.equal(n);
        });

        it('emits a merge event with the new entities', function () {
            var n = iD.osmNode({id: 'n'});
            history.on('merge', spy);
            history.merge([n]);
            expect(spy).to.have.been.calledWith([n]);
        });
    });

    describe('#perform', function () {
        it('returns a difference', function () {
            expect(history.perform(actionNoop).changes()).to.eql({});
        });

        it('updates the graph', function () {
            var node = iD.osmNode();
            history.perform(function (graph) { return graph.replace(node); });
            expect(history.graph().entity(node.id)).to.equal(node);
        });

        it('pushes an undo annotation', function () {
            history.perform(actionNoop, 'annotation');
            expect(history.undoAnnotation()).to.equal('annotation');
        });

        it('emits a change event', function () {
            history.on('change', spy);
            var difference = history.perform(actionNoop);
            expect(spy).to.have.been.calledWith(difference);
            expect(spy.callCount).to.eql(1);
        });

        it('performs multiple actions', function () {
            var action1 = sinon.stub().returns(iD.coreGraph());
            var action2 = sinon.stub().returns(iD.coreGraph());
            history.perform(action1, action2, 'annotation');
            expect(action1).to.have.been.called;
            expect(action2).to.have.been.called;
            expect(history.undoAnnotation()).to.equal('annotation');
        });

        it('performs transitionable actions in a transition', function (done) {
            var action1 = function() { return iD.coreGraph(); };
            action1.transitionable = true;
            history.on('change', spy);
            history.perform(action1);
            window.setTimeout(function() {
                expect(spy.callCount).to.be.above(2);
                done();
            }, 300);
        });
    });

    describe('#replace', function () {
        it('returns a difference', function () {
            expect(history.replace(actionNoop).changes()).to.eql({});
        });

        it('updates the graph', function () {
            var node = iD.osmNode();
            history.replace(function (graph) { return graph.replace(node); });
            expect(history.graph().entity(node.id)).to.equal(node);
        });

        it('replaces the undo annotation', function () {
            history.perform(actionNoop, 'annotation1');
            history.replace(actionNoop, 'annotation2');
            expect(history.undoAnnotation()).to.equal('annotation2');
        });

        it('emits a change event', function () {
            history.on('change', spy);
            var difference = history.replace(actionNoop);
            expect(spy).to.have.been.calledWith(difference);
        });

        it('performs multiple actions', function () {
            var action1 = sinon.stub().returns(iD.coreGraph());
            var action2 = sinon.stub().returns(iD.coreGraph());
            history.replace(action1, action2, 'annotation');
            expect(action1).to.have.been.called;
            expect(action2).to.have.been.called;
            expect(history.undoAnnotation()).to.equal('annotation');
        });
    });

    describe('#pop', function () {
        it('returns a difference', function () {
            history.perform(actionNoop, 'annotation');
            expect(history.pop().changes()).to.eql({});
        });

        it('updates the graph', function () {
            history.perform(actionNoop, 'annotation');
            history.pop();
            expect(history.undoAnnotation()).to.be.undefined;
        });

        it('does not push the redo stack', function () {
            history.perform(actionNoop, 'annotation');
            history.pop();
            expect(history.redoAnnotation()).to.be.undefined;
        });

        it('emits a change event', function () {
            history.perform(actionNoop);
            history.on('change', spy);
            var difference = history.pop();
            expect(spy).to.have.been.calledWith(difference);
        });

        it('pops n times', function () {
            history.perform(actionNoop, 'annotation1');
            history.perform(actionNoop, 'annotation2');
            history.perform(actionNoop, 'annotation3');
            history.pop(2);
            expect(history.undoAnnotation()).to.equal('annotation1');
        });

        it('pops 0 times', function () {
            history.perform(actionNoop, 'annotation1');
            history.perform(actionNoop, 'annotation2');
            history.perform(actionNoop, 'annotation3');
            history.pop(0);
            expect(history.undoAnnotation()).to.equal('annotation3');
        });

        it('pops 1 time if argument is invalid', function () {
            history.perform(actionNoop, 'annotation1');
            history.perform(actionNoop, 'annotation2');
            history.perform(actionNoop, 'annotation3');
            history.pop('foo');
            expect(history.undoAnnotation()).to.equal('annotation2');
            history.pop(-1);
            expect(history.undoAnnotation()).to.equal('annotation1');
        });
    });

    describe('#overwrite', function () {
        it('returns a difference', function () {
            history.perform(actionNoop, 'annotation');
            expect(history.overwrite(actionNoop).changes()).to.eql({});
        });

        it('updates the graph', function () {
            history.perform(actionNoop, 'annotation');
            var node = iD.osmNode();
            history.overwrite(function (graph) { return graph.replace(node); });
            expect(history.graph().entity(node.id)).to.equal(node);
        });

        it('replaces the undo annotation', function () {
            history.perform(actionNoop, 'annotation1');
            history.overwrite(actionNoop, 'annotation2');
            expect(history.undoAnnotation()).to.equal('annotation2');
        });

        it('does not push the redo stack', function () {
            history.perform(actionNoop, 'annotation');
            history.overwrite(actionNoop, 'annotation2');
            expect(history.redoAnnotation()).to.be.undefined;
        });

        it('emits a change event', function () {
            history.perform(actionNoop, 'annotation');
            history.on('change', spy);
            var difference = history.overwrite(actionNoop, 'annotation2');
            expect(spy).to.have.been.calledWith(difference);
        });

        it('performs multiple actions', function () {
            var action1 = sinon.stub().returns(iD.coreGraph());
            var action2 = sinon.stub().returns(iD.coreGraph());
            history.perform(actionNoop, 'annotation');
            history.overwrite(action1, action2, 'annotation2');
            expect(action1).to.have.been.called;
            expect(action2).to.have.been.called;
            expect(history.undoAnnotation()).to.equal('annotation2');
        });
    });

    describe('#undo', function () {
        it('returns a difference', function () {
            expect(history.undo().changes()).to.eql({});
        });

        it('pops the undo stack', function () {
            history.perform(actionNoop, 'annotation');
            history.undo();
            expect(history.undoAnnotation()).to.be.undefined;
        });

        it('pushes the redo stack', function () {
            history.perform(actionNoop, 'annotation');
            history.undo();
            expect(history.redoAnnotation()).to.equal('annotation');
        });

        it('emits an undone event', function () {
            history.perform(actionNoop);
            history.on('undone', spy);
            history.undo();
            expect(spy).to.have.been.called;
        });

        it('emits a change event', function () {
            history.perform(actionNoop);
            history.on('change', spy);
            var difference = history.undo();
            expect(spy).to.have.been.calledWith(difference);
        });
    });

    describe('#redo', function () {
        it('returns a difference', function () {
            expect(history.redo().changes()).to.eql({});
        });

        it('does redo into an annotated state', function () {
            history.perform(actionNoop, 'annotation');
            history.on('redone', spy);
            history.undo();
            history.redo();
            expect(history.undoAnnotation()).to.equal('annotation');
            expect(spy).to.have.been.called;
        });

        it('does not redo into a non-annotated state', function () {
            history.perform(actionNoop);
            history.on('redone', spy);
            history.undo();
            history.redo();
            expect(spy).not.to.have.been.called;
        });

        it('emits a change event', function () {
            history.perform(actionNoop);
            history.undo();
            history.on('change', spy);
            var difference = history.redo();
            expect(spy).to.have.been.calledWith(difference);
        });
    });

    describe('#pauseChangeDispatch / #resumeChangeDispatch', function() {
        it('prevents change events from getting dispatched', function() {
            history.perform(actionNoop, 'base');
            history.on('change', spy);

            history.pauseChangeDispatch();

            history.perform(actionNoop, 'perform');
            expect(spy).to.have.not.been.called;
            history.replace(actionNoop, 'replace');
            expect(spy).to.have.not.been.called;
            history.overwrite(actionNoop, 'replace');
            expect(spy).to.have.not.been.called;
            history.undo();
            expect(spy).to.have.not.been.called;
            history.redo();
            expect(spy).to.have.not.been.called;
            history.pop();
            expect(spy).to.have.not.been.called;

            var diff = history.resumeChangeDispatch();
            expect(spy).to.have.been.calledOnceWith(diff);
        });

        it('does nothing if resume called before pause', function() {
            history.perform(actionNoop, 'base');
            history.on('change', spy);

            history.resumeChangeDispatch();
            expect(spy).to.have.not.been.called;
        });

        it('uses earliest difference if pause called multiple times', function() {
            history.perform(actionNoop, 'base');
            history.on('change', spy);

            history.pauseChangeDispatch();
            history.perform(actionAddNode('a'), 'perform');

            history.pauseChangeDispatch();
            history.perform(actionAddNode('b'), 'perform');

            var diff = history.resumeChangeDispatch();
            expect(spy).to.have.been.calledOnceWith(diff);
            expect(diff.changes()).to.include.keys(['a', 'b']);
        });
    });

    describe('#changes', function () {
        it('includes created entities', function () {
            var node = iD.osmNode();
            history.perform(function (graph) { return graph.replace(node); });
            expect(history.changes().created).to.eql([node]);
        });

        it('includes modified entities', function () {
            var node1 = iD.osmNode({id: 'n1'});
            var node2 = node1.update({ tags: { yes: 'no' } });
            history.merge([node1]);
            history.perform(function (graph) { return graph.replace(node2); });
            expect(history.changes().modified).to.eql([node2]);
        });

        it('includes deleted entities', function () {
            var node = iD.osmNode({id: 'n1'});
            history.merge([node]);
            history.perform(function (graph) { return graph.remove(node); });
            expect(history.changes().deleted).to.eql([node]);
        });
    });

    describe('#hasChanges', function() {
        it('is true when any of change\'s values are nonempty', function() {
            var node = iD.osmNode();
            history.perform(function (graph) { return graph.replace(node); });
            expect(history.hasChanges()).to.eql(true);
        });

        it('is false when all of change\'s values are empty', function() {
            expect(history.hasChanges()).to.eql(false);
        });
    });

    describe('#reset', function () {
        it('clears the version stack', function () {
            history.perform(actionNoop, 'annotation');
            history.perform(actionNoop, 'annotation');
            history.undo();
            history.reset();
            expect(history.undoAnnotation()).to.be.undefined;
            expect(history.redoAnnotation()).to.be.undefined;
        });

        it('emits a change event', function () {
            history.on('change', spy);
            history.reset();
            expect(spy).to.have.been.called;
        });
    });

    describe('#checkpoint', function () {
        it('saves and resets to checkpoints', function () {
            history.perform(actionNoop, 'annotation1');
            history.perform(actionNoop, 'annotation2');
            history.perform(actionNoop, 'annotation3');
            history.checkpoint('check1');
            history.perform(actionNoop, 'annotation4');
            history.perform(actionNoop, 'annotation5');
            history.checkpoint('check2');
            history.perform(actionNoop, 'annotation6');
            history.perform(actionNoop, 'annotation7');
            history.perform(actionNoop, 'annotation8');

            history.reset('check1');
            expect(history.undoAnnotation()).to.equal('annotation3');

            history.reset('check2');
            expect(history.undoAnnotation()).to.equal('annotation5');

            history.reset('check1');
            expect(history.undoAnnotation()).to.equal('annotation3');
        });

        it('emits a change event', function () {
            history.on('change', spy);
            history.reset();
            expect(spy).to.have.been.called;
        });
    });

    describe('#toJSON', function() {
        it('doesn\'t generate unsaveable changes', function() {
            history.perform(actionAddNode('n-1'));
            history.perform(iD.actionDeleteNode('n-1'));
            expect(history.toJSON()).to.be.not.ok;
        });

        it('generates v3 JSON', function() {
            var node_1 = iD.osmNode({id: 'n-1'});
            var node1 = iD.osmNode({id: 'n1'});
            var node2 = iD.osmNode({id: 'n2'});
            var node3 = iD.osmNode({id: 'n3'});
            history.merge([node1, node2, node3]);
            history.perform(iD.actionAddEntity(node_1));           // addition
            history.perform(iD.actionChangeTags('n2', {k: 'v'}));  // modification
            history.perform(iD.actionDeleteNode('n3'));            // deletion

            var json = JSON.parse(history.toJSON());
            var node_1_json = JSON.parse(JSON.stringify(node_1));
            var node1_json = JSON.parse(JSON.stringify(node1));
            var node2_json = JSON.parse(JSON.stringify(node2));
            var node2_upd_json = JSON.parse(JSON.stringify(node2.update({tags: {k: 'v'}})));
            var node3_json = JSON.parse(JSON.stringify(node3));

            expect(json.version).to.eql(3);
            expect(json.entities).to.deep.own.include(node_1_json);
            expect(json.entities).to.not.include(node1_json);
            expect(json.entities).to.deep.own.include(node2_upd_json);
            expect(json.entities).to.not.include(node3_json);

            expect(json.baseEntities).to.not.include(node_1_json);
            expect(json.baseEntities).to.not.include(node1_json);
            expect(json.baseEntities).to.deep.own.include(node2_json);
            expect(json.baseEntities).to.deep.own.include(node3_json);
        });
    });

    describe('#fromJSON', function() {
        it('restores from v1 JSON (creation)', function() {
            var json = {
                'stack': [
                    {'entities': {}},
                    {'entities': {'n-1': {'loc': [1, 2], 'id': 'n-1'}}, 'imageryUsed': ['Bing'], 'annotation': 'Added a point.'}
                ],
                'nextIDs': {'node': -2, 'way': -1, 'relation': -1},
                'index': 1
            };
            history.fromJSON(JSON.stringify(json));
            expect(history.graph().entity('n-1')).to.eql(iD.osmNode({id: 'n-1', loc: [1, 2]}));
            expect(history.undoAnnotation()).to.eql('Added a point.');
            expect(history.imageryUsed()).to.eql(['Bing']);
            expect(iD.osmEntity.id.next).to.eql({node: -2, way: -1, relation: -1});
        });

        it('restores from v1 JSON (modification)', function() {
            var json = {
                'stack': [
                    {'entities': {}},
                    {'entities': {'n-1': {'loc': [1, 2], 'id': 'n-1'}}, 'imageryUsed': ['Bing'], 'annotation': 'Added a point.'},
                    {'entities': {'n-1': {'loc': [2, 3], 'id': 'n-1', 'v': 1}}, 'imageryUsed': ['Bing'], 'annotation': 'Moved a point.'}
                ],
                'nextIDs': {'node': -2, 'way': -1, 'relation': -1},
                'index': 2
            };
            history.fromJSON(JSON.stringify(json));
            expect(history.graph().entity('n-1')).to.eql(iD.osmNode({id: 'n-1', loc: [2, 3], v: 1}));
            expect(history.undoAnnotation()).to.eql('Moved a point.');
            expect(history.imageryUsed()).to.eql(['Bing']);
            expect(iD.osmEntity.id.next).to.eql({node: -2, way: -1, relation: -1});
        });

        it('restores from v1 JSON (deletion)', function() {
            var json = {
                'stack': [
                    {'entities': {}},
                    {'entities': {'n1': 'undefined'}, 'imageryUsed': ['Bing'], 'annotation': 'Deleted a point.'}
                ],
                'nextIDs': {'node': -1, 'way': -2, 'relation': -3},
                'index': 1
            };
            history.fromJSON(JSON.stringify(json));
            history.merge([iD.osmNode({id: 'n1'})]);
            expect(history.graph().hasEntity('n1')).to.be.undefined;
            expect(history.undoAnnotation()).to.eql('Deleted a point.');
            expect(history.imageryUsed()).to.eql(['Bing']);
            expect(iD.osmEntity.id.next).to.eql({node: -1, way: -2, relation: -3});
        });

        it('restores from v2 JSON (creation)', function() {
            var json = {
                'version': 2,
                'entities': [
                    {'loc': [1, 2], 'id': 'n-1'}
                ],
                'stack': [
                    {},
                    {'modified': ['n-1v0'], 'imageryUsed': ['Bing'], 'annotation': 'Added a point.'}
                ],
                'nextIDs': {'node': -2, 'way': -1, 'relation': -1},
                'index': 1
            };
            history.fromJSON(JSON.stringify(json));
            expect(history.graph().entity('n-1')).to.eql(iD.osmNode({id: 'n-1', loc: [1, 2]}));
            expect(history.undoAnnotation()).to.eql('Added a point.');
            expect(history.imageryUsed()).to.eql(['Bing']);
            expect(iD.osmEntity.id.next).to.eql({node: -2, way: -1, relation: -1});
            expect(history.difference().created().length).to.eql(1);
        });

        it('restores from v2 JSON (modification)', function() {
            var json = {
                'version': 2,
                'entities': [
                    {'loc': [2, 3], 'id': 'n1', 'v': 1}
                ],
                'stack': [
                    {},
                    {'modified': ['n1v1'], 'imageryUsed': ['Bing'], 'annotation': 'Moved a point.'}
                ],
                'nextIDs': {'node': -2, 'way': -1, 'relation': -1},
                'index': 1
            };
            history.fromJSON(JSON.stringify(json));
            history.merge([iD.osmNode({id: 'n1'})]); // Shouldn't be necessary; flaw in v2 format (see #2135)
            expect(history.graph().entity('n1')).to.eql(iD.osmNode({id: 'n1', loc: [2, 3], v: 1}));
            expect(history.undoAnnotation()).to.eql('Moved a point.');
            expect(history.imageryUsed()).to.eql(['Bing']);
            expect(iD.osmEntity.id.next).to.eql({node: -2, way: -1, relation: -1});
            expect(history.difference().modified().length).to.eql(1);
        });

        it('restores from v2 JSON (deletion)', function() {
            var json = {
                'version': 2,
                'entities': [],
                'stack': [
                    {},
                    {'deleted': ['n1'], 'imageryUsed': ['Bing'], 'annotation': 'Deleted a point.'}
                ],
                'nextIDs': {'node': -1, 'way': -2, 'relation': -3},
                'index': 1
            };
            history.fromJSON(JSON.stringify(json));
            history.merge([iD.osmNode({id: 'n1'})]); // Shouldn't be necessary; flaw in v2 format (see #2135)
            expect(history.graph().hasEntity('n1')).to.be.undefined;
            expect(history.undoAnnotation()).to.eql('Deleted a point.');
            expect(history.imageryUsed()).to.eql(['Bing']);
            expect(iD.osmEntity.id.next).to.eql({node: -1, way: -2, relation: -3});
            expect(history.difference().deleted().length).to.eql(1);
        });

        it('restores from v3 JSON (creation)', function() {
            var json = {
                'version': 3,
                'entities': [
                    {'loc': [1, 2], 'id': 'n-1'}
                ],
                'baseEntities': [],
                'stack': [
                    {},
                    {'modified': ['n-1v0'], 'imageryUsed': ['Bing'], 'annotation': 'Added a point.'}
                ],
                'nextIDs': {'node': -2, 'way': -1, 'relation': -1},
                'index': 1
            };
            history.fromJSON(JSON.stringify(json));
            expect(history.graph().entity('n-1')).to.eql(iD.osmNode({id: 'n-1', loc: [1, 2]}));
            expect(history.undoAnnotation()).to.eql('Added a point.');
            expect(history.imageryUsed()).to.eql(['Bing']);
            expect(iD.osmEntity.id.next).to.eql({node: -2, way: -1, relation: -1});
            expect(history.difference().created().length).to.eql(1);
        });

        it('restores from v3 JSON (modification)', function() {
            var json = {
                'version': 3,
                'entities': [
                    {'loc': [2, 3], 'id': 'n1', 'v': 1}
                ],
                'baseEntities': [{'loc': [1, 2], 'id': 'n1'}],
                'stack': [
                    {},
                    {'modified': ['n1v1'], 'imageryUsed': ['Bing'], 'annotation': 'Moved a point.'}
                ],
                'nextIDs': {'node': -2, 'way': -1, 'relation': -1},
                'index': 1
            };
            history.fromJSON(JSON.stringify(json));
            expect(history.graph().entity('n1')).to.eql(iD.osmNode({id: 'n1', loc: [2, 3], v: 1}));
            expect(history.undoAnnotation()).to.eql('Moved a point.');
            expect(history.imageryUsed()).to.eql(['Bing']);
            expect(iD.osmEntity.id.next).to.eql({node: -2, way: -1, relation: -1});
            expect(history.difference().modified().length).to.eql(1);
        });

        it('restores from v3 JSON (deletion)', function() {
            var json = {
                'version': 3,
                'entities': [],
                'baseEntities': [{'loc': [1, 2], 'id': 'n1'}],
                'stack': [
                    {},
                    {'deleted': ['n1'], 'imageryUsed': ['Bing'], 'annotation': 'Deleted a point.'}
                ],
                'nextIDs': {'node': -1, 'way': -2, 'relation': -3},
                'index': 1
            };
            history.fromJSON(JSON.stringify(json));
            expect(history.graph().hasEntity('n1')).to.be.undefined;
            expect(history.undoAnnotation()).to.eql('Deleted a point.');
            expect(history.imageryUsed()).to.eql(['Bing']);
            expect(iD.osmEntity.id.next).to.eql({node: -1, way: -2, relation: -3});
            expect(history.difference().deleted().length).to.eql(1);
        });
    });
});
