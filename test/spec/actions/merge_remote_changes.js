describe("iD.actions.MergeRemoteChanges", function () {
    var base = iD.Graph([
        iD.Node({id: 'a', loc: [1, 1], version: '1', tags: {foo: 'foo'}}),

        iD.Node({id: 'p1', loc: [ 10,  10], version: '1', tags: {foo: 'foo'}}),
        iD.Node({id: 'p2', loc: [ 10, -10], version: '1', tags: {foo: 'foo'}}),
        iD.Node({id: 'p3', loc: [-10, -10], version: '1', tags: {foo: 'foo'}}),
        iD.Node({id: 'p4', loc: [-10,  10], version: '1', tags: {foo: 'foo'}}),
        iD.Way({
            id: 'w1',
            nodes: ['p1', 'p2', 'p3', 'p4', 'p1'],
            version: '1',
            tags: {foo: 'foo', area: 'yes'}
        }),

        iD.Node({id: 'q1', loc: [ 5,  5], version: '1', tags: {foo: 'foo'}}),
        iD.Node({id: 'q2', loc: [ 5, -5], version: '1', tags: {foo: 'foo'}}),
        iD.Node({id: 'q3', loc: [-5, -5], version: '1', tags: {foo: 'foo'}}),
        iD.Node({id: 'q4', loc: [-5,  5], version: '1', tags: {foo: 'foo'}}),
        iD.Way({
            id: 'w2',
            nodes: ['q1', 'q2', 'q3', 'q4', 'q1'],
            version: '1',
            tags: {foo: 'foo', area: 'yes'}
        }),

        iD.Relation({
            id: 'r',
            members: [{id: 'w1', role: 'outer'}, {id: 'w2', role: 'inner'}],
            version: '1',
            tags: {type: 'multipolygon', foo: 'foo'}
        }),

    ]);


    describe("non-destuctive merging", function () {
        it("doesn't merge nodes if location is different", function () {
            var local = iD.Node({id: 'a', loc: [1, 1], version: '1', v: 2, tags: {foo: 'foo_local'}}),
                remote = iD.Node({id: 'a', loc: [3, 3], version: '2', tags: {foo: 'foo', bar: 'bar_remote'}}),
                graph = iD.Graph(base).replace(local),
                altGraph = iD.Graph(base).replace(remote),
                action = iD.actions.MergeRemoteChanges('a', graph, altGraph);

            graph = action(graph);

            expect(graph.entity('a')).to.eql(local);
        });

        it("doesn't merge nodes if changed tags conflict", function () {
            var local = iD.Node({id: 'a', loc: [1, 1], version: '1', v: 2, tags: {foo: 'foo_local'}}),
                remote = iD.Node({id: 'a', loc: [1, 1], version: '2', tags: {foo: 'foo_remote', bar: 'bar_remote'}}),
                graph = iD.Graph(base).replace(local),
                altGraph = iD.Graph(base).replace(remote),
                action = iD.actions.MergeRemoteChanges('a', graph, altGraph);

            graph = action(graph);

            expect(graph.entity('a')).to.eql(local);
        });

        it("does merge nodes if location is same and changed tags don't conflict", function () {
            var local = iD.Node({id: 'a', loc: [1, 1], version: '1', v: 2, tags: {foo: 'foo_local'}}),
                remote = iD.Node({id: 'a', loc: [1, 1], version: '2', tags: {foo: 'foo', bar: 'bar_remote'}}),
                graph = iD.Graph(base).replace(local),
                altGraph = iD.Graph(base).replace(remote),
                action = iD.actions.MergeRemoteChanges('a', graph, altGraph);

            graph = action(graph);

            expect(graph.entity('a').version).to.eql('2');
            expect(graph.entity('a').tags).to.eql({foo: 'foo_local', bar: 'bar_remote'});
        });

        // test merging ways

        // test merging relations

    });

    describe("destuctive merging", function () {
        it("merges nodes with 'force_local' option", function () {
            var localTags = {foo: 'foo_local'},    // changed tag foo
                remoteTags = {foo: 'foo_remote'},   // changed tag foo
                local = iD.Node({id: 'a', loc: [2, 2], version: '1', v: 2, tags: localTags}),
                remote = iD.Node({id: 'a', loc: [3, 3], version: '2', tags: remoteTags}),
                graph = iD.Graph(base).replace(local),
                altGraph = iD.Graph(base).replace(remote),
                action = iD.actions.MergeRemoteChanges('a', graph, altGraph).withOption('force_local');

            graph = action(graph);

            expect(graph.entity('a').version).to.eql('2');
            expect(graph.entity('a').loc).to.eql([2, 2]);
            expect(graph.entity('a').tags).to.eql(localTags);
        });

        it("merges nodes with 'force_remote' option", function () {
            var localTags = {foo: 'foo_local'},    // changed tag foo
                remoteTags = {foo: 'foo_remote'},   // changed tag foo
                local = iD.Node({id: 'a', loc: [2, 2], version: '1', v: 2, tags: localTags}),
                remote = iD.Node({id: 'a', loc: [3, 3], version: '2', tags: remoteTags}),
                graph = iD.Graph(base).replace(local),
                altGraph = iD.Graph(base).replace(remote),
                action = iD.actions.MergeRemoteChanges('a', graph, altGraph).withOption('force_remote');

            graph = action(graph);

            expect(graph.entity('a').version).to.eql('2');
            expect(graph.entity('a').loc).to.eql([3, 3]);
            expect(graph.entity('a').tags).to.eql(remoteTags);
        });

        it("merges ways with 'force_local' option", function () {
            var x = iD.Node({id: 'x', loc: [5, 0], tags: {foo: 'foo_local'}}),
                y = iD.Node({id: 'y', loc: [-5, 0], version: '2', tags: {foo: 'foo_remote'}}),
                localNodes = ['p1', 'x', 'p2', 'p3', 'p4', 'p1'],  // inserted node x
                remoteNodes = ['p1', 'p2', 'p3', 'y', 'p4', 'p1'],  // inserted node y
                localTags = {foo: 'foo_local', area: 'yes'},   // changed tag foo
                remoteTags = {foo: 'foo_remote', area: 'yes'},  // changed tag foo
                local = iD.Way({id: 'w1', nodes: localNodes, version: '1', v: 2, tags: localTags}),
                remote = iD.Way({id: 'w1', nodes: remoteNodes, version: '2', tags: remoteTags}),
                graph = iD.Graph(base).replace(x).replace(local),
                altGraph = iD.Graph(base).replace(y).replace(remote),
                action = iD.actions.MergeRemoteChanges('w1', graph, altGraph).withOption('force_local');

            graph = action(graph);

            expect(graph.entity('w1').version).to.eql('2');
            // expect(graph.hasEntity('x')).to.be.true;
            // expect(graph.hasEntity('y')).to.be.false;
            expect(graph.entity('w1').nodes).to.eql(localNodes);
            expect(graph.entity('w1').tags).to.eql(localTags);
        });

        it("merges ways with 'force_remote' option", function () {
            var x = iD.Node({id: 'x', loc: [5, 0], tags: {foo: 'foo_local'}}),
                y = iD.Node({id: 'y', loc: [-5, 0], version: '2', tags: {foo: 'foo_remote'}}),
                localNodes = ['p1', 'x', 'p2', 'p3', 'p4', 'p1'],  // inserted node x
                remoteNodes = ['p1', 'p2', 'p3', 'y', 'p4', 'p1'],  // inserted node y
                localTags = {foo: 'foo_local', area: 'yes'},   // changed tag foo
                remoteTags = {foo: 'foo_remote', area: 'yes'},  // changed tag foo
                local = iD.Way({id: 'w1', nodes: localNodes, version: '1', v: 2, tags: localTags}),
                remote = iD.Way({id: 'w1', nodes: remoteNodes, version: '2', tags: remoteTags}),
                graph = iD.Graph(base).replace(x).replace(local),
                altGraph = iD.Graph(base).replace(y).replace(remote),
                action = iD.actions.MergeRemoteChanges('w1', graph, altGraph).withOption('force_remote');

            graph = action(graph);

            expect(graph.entity('w1').version).to.eql('2');
            // expect(graph.hasEntity('x')).to.be.true;
            // expect(graph.hasEntity('y')).to.be.true;
            expect(graph.entity('w1').nodes).to.eql(remoteNodes);
            expect(graph.entity('w1').tags).to.eql(remoteTags);
        });

        it("merges relations with 'force_local' option", function () {
            var localNodes = ['p2', 'p3', 'p4', 'p1', 'p2'],  // changed order
                remoteNodes = ['p1', 'p4', 'p3', 'p2', 'p1'],  // reversed order
                localWayTags = {foo: 'foo_local'},  // changed tag foo
                remoteWayTags = {foo: 'foo_remote'},  // changed tag foo
                x = iD.Way({id: 'x', nodes: localNodes, tags: localWayTags}),
                y = iD.Way({id: 'y', nodes: remoteNodes, version: '2', tags: remoteWayTags}),
                localMembers = [{id: 'x', role: 'outer'}, {id: 'w2', role: 'inner'}],  // changed outer to x
                remoteMembers = [{id: 'y', role: 'outer'}, {id: 'w2', role: 'inner'}],  // changed outer to y
                localRelTags = {type: 'multipolygon', foo: 'foo_local'},  // changed tag foo
                remoteRelTags = {type: 'multipolygon', foo: 'foo_remote'},  // changed tag foo
                local = iD.Relation({id: 'r', members: localMembers, version: '1', v: 2, tags: localRelTags}),
                remote = iD.Relation({id: 'r', members: remoteMembers, version: '2', tags: remoteRelTags}),
                graph = iD.Graph(base).replace(x).replace(local),
                altGraph = iD.Graph(base).replace(y).replace(remote),
                action = iD.actions.MergeRemoteChanges('r', graph, altGraph).withOption('force_local');

            graph = action(graph);

            expect(graph.entity('r').version).to.eql('2');
            // expect(graph.hasEntity('x')).to.be.true;
            // expect(graph.hasEntity('y')).to.be.false;
            expect(graph.entity('r').members).to.eql(localMembers);
            expect(graph.entity('r').tags).to.eql(localRelTags);
        });

        it("merges relations with 'force_remote' option", function () {
            var localNodes = ['p2', 'p3', 'p4', 'p1', 'p2'],  // changed order
                remoteNodes = ['p1', 'p4', 'p3', 'p2', 'p1'],  // reversed
                localWayTags = {foo: 'foo_local'},  // changed tag foo
                remoteWayTags = {foo: 'foo_remote'},  // changed tag foo
                x = iD.Way({id: 'x', nodes: localNodes, tags: localWayTags}),
                y = iD.Way({id: 'y', nodes: remoteNodes, version: '2', tags: remoteWayTags}),
                localMembers = [{id: 'x', role: 'outer'}, {id: 'w2', role: 'inner'}],  // changed outer to x
                remoteMembers = [{id: 'y', role: 'outer'}, {id: 'w2', role: 'inner'}],  // changed outer to y
                localRelTags = {type: 'multipolygon', foo: 'foo_local'},  // changed tag foo
                remoteRelTags = {type: 'multipolygon', foo: 'foo_remote'},  // changed tag foo
                local = iD.Relation({id: 'r', members: localMembers, version: '1', v: 2, tags: localRelTags}),
                remote = iD.Relation({id: 'r', members: remoteMembers, version: '2', tags: remoteRelTags}),
                graph = iD.Graph(base).replace(x).replace(local),
                altGraph = iD.Graph(base).replace(y).replace(remote),
                action = iD.actions.MergeRemoteChanges('r', graph, altGraph).withOption('force_remote');

            graph = action(graph);

            expect(graph.entity('r').version).to.eql('2');
            // expect(graph.hasEntity('x')).to.be.true;
            // expect(graph.hasEntity('y')).to.be.true;
            expect(graph.entity('r').members).to.eql(remoteMembers);
            expect(graph.entity('r').tags).to.eql(remoteRelTags);
        });
    });

});
