describe('iD.coreUploader', function() {

    function makeDifference(changes) {
        return {
            created: function() { return changes.created; },
            modified: function() { return changes.modified; },
            summary: function() { return []; }
        };
    }

    function makeContext(changes, graph, connection) {
        var history = {
            perform: sinon.spy(),
            replace: sinon.spy(),
            pop: sinon.spy(),
            pauseChangeDispatch: sinon.spy(),
            resumeChangeDispatch: sinon.spy(),
            clearSaved: sinon.spy(),
            base: function() { return graph; },
            difference: function() { return makeDifference(changes); },
            changes: function() { return changes; }
        };

        return {
            connection: function() { return connection; },
            history: function() { return history; },
            graph: function() { return graph; },
            flush: sinon.spy()
        };
    }

    function makeConnection() {
        return {
            authenticated: function() { return true; },
            authenticate: sinon.spy(),
            putChangeset: sinon.spy(),
            changesetURL: function(id) { return 'https://www.openstreetmap.org/changeset/' + id; },
            updateChangesetTags: sinon.stub().resolves()
        };
    }

    it('uploads each split group sequentially', function() {
        var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
        var n2 = iD.osmNode({ id: 'n2', loc: [100, 50] });
        var graph = iD.coreGraph([n1, n2]);
        var changes = { created: [n1, n2], modified: [], deleted: [] };
        var connection = makeConnection();
        connection.putChangeset = sinon.stub().callsFake(function(changeset, uploadChanges, callback) {
            callback(null, changeset);
        });
        var context = makeContext(changes, graph, connection);
        var uploader = iD.coreUploader(context);

        uploader.save(iD.osmChangeset({ tags: { comment: 'real upload' } }));

        expect(connection.putChangeset).to.have.been.calledTwice;
        expect(connection.putChangeset.firstCall.args[1].created).to.have.length(1);
        expect(connection.putChangeset.secondCall.args[1].created).to.have.length(1);
        var uploadedIds = [
            connection.putChangeset.firstCall.args[1].created[0].id,
            connection.putChangeset.secondCall.args[1].created[0].id
        ];
        expect(uploadedIds).to.include('n1');
        expect(uploadedIds).to.include('n2');
    });

    it('adds part markers and references first split changeset in later comments', function() {
        var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
        var n2 = iD.osmNode({ id: 'n2', loc: [100, 50] });
        var graph = iD.coreGraph([n1, n2]);
        var changes = { created: [n1, n2], modified: [], deleted: [] };
        var connection = makeConnection();
        var seenComments = [];
        var ids = ['111', '222'];
        var call = 0;

        connection.putChangeset = sinon.stub().callsFake(function(changeset, uploadChanges, callback) {
            seenComments.push(changeset.tags.comment);
            var updated = changeset.update({ id: ids[call++] });
            callback(null, updated);
        });

        var context = makeContext(changes, graph, connection);
        var uploader = iD.coreUploader(context);

        uploader.save(iD.osmChangeset({ tags: { comment: 'Split upload test' } }));

        expect(connection.putChangeset).to.have.been.calledTwice;
        expect(seenComments[0]).to.equal('Split upload test (part 1/2)');
        expect(seenComments[1]).to.equal('Split upload test (part 2/2, ref: https://www.openstreetmap.org/changeset/111)');
    });

});
