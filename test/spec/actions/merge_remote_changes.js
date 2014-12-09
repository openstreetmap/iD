describe("iD.actions.MergeRemoteChanges", function () {
    describe("non-destuctive merging", function () {
        it("doesn't merge nodes if location is different", function () {
            var base = iD.Node({id: 'a', loc: [1, 1], version: '1', tags: {foo: 'foo'}}),
                local = iD.Node({id: 'a', loc: [1, 1], version: '1', v: 2, tags: {foo: 'foo_v2'}}),
                remote = iD.Node({id: 'a', loc: [3, 3], version: '2', tags: {bar: 'bar'}}),
                graph = iD.Graph([local]),
                action = iD.actions.MergeRemoteChanges(base, local, remote);

            graph = action(graph);

            expect(graph.entity('a').loc).to.eql([1, 1]);
            expect(graph.entity('a').version).to.eql('1');
            expect(graph.entity('a').tags).to.eql({foo: 'foo_v2'});
        });

        it("doesn't merge nodes if changed tags conflict", function () {
            var base = iD.Node({id: 'a', loc: [1, 1], version: '1', tags: {foo: 'foo'}}),
                local = iD.Node({id: 'a', loc: [1, 1], version: '1', v: 2, tags: {foo: 'foo_v2'}}),
                remote = iD.Node({id: 'a', loc: [1, 1], version: '2', tags: {foo: 'bar'}}),
                graph = iD.Graph([local]),
                action = iD.actions.MergeRemoteChanges(base, local, remote);

            graph = action(graph);

            expect(graph.entity('a').loc).to.eql([1, 1]);
            expect(graph.entity('a').version).to.eql('1');
            expect(graph.entity('a').tags).to.eql({foo: 'foo_v2'});
        });

        it("does merge nodes if location is same and changed tags don't conflict", function () {
            var base = iD.Node({id: 'a', loc: [1, 1], version: '1', tags: {foo: 'foo'}}),
                local = iD.Node({id: 'a', loc: [1, 1], version: '1', v: 2, tags: {foo: 'foo_v2'}}),
                remote = iD.Node({id: 'a', loc: [1, 1], version: '2', tags: {foo: 'foo', bar: 'bar'}}),
                graph = iD.Graph([local]),
                action = iD.actions.MergeRemoteChanges(base, local, remote);

            graph = action(graph);

            expect(graph.entity('a').loc).to.eql([1, 1]);
            expect(graph.entity('a').version).to.eql('2');
            expect(graph.entity('a').tags).to.eql({foo: 'foo_v2', bar: 'bar'});
        });

        // test merging ways

        // test merging relations

    });

    describe("destuctive merging", function () {
        it("merges nodes with 'force_local' option", function () {
            var base = iD.Node({id: 'a', loc: [1, 1], version: '1', tags: {foo: 'foo'}}),
                local = iD.Node({id: 'a', loc: [2, 2], version: '1', v: 2, tags: {foo: 'foo_v2'}}),
                remote = iD.Node({id: 'a', loc: [3, 3], version: '2', tags: {foo: 'bar'}}),
                graph = iD.Graph([local]),
                action = iD.actions.MergeRemoteChanges(base, local, remote).withOption('force_local');

            graph = action(graph);

            expect(graph.entity('a').loc).to.eql([2, 2]);
            expect(graph.entity('a').version).to.eql('2');
            expect(graph.entity('a').tags).to.eql({foo: 'foo_v2'});
        });

        it("merges nodes with 'force_remote' option", function () {
            var base = iD.Node({id: 'a', loc: [1, 1], version: '1', tags: {foo: 'foo'}}),
                local = iD.Node({id: 'a', loc: [2, 2], version: '1', v: 2, tags: {foo: 'foo_v2'}}),
                remote = iD.Node({id: 'a', loc: [3, 3], version: '2', tags: {foo: 'bar'}}),
                graph = iD.Graph([local]),
                action = iD.actions.MergeRemoteChanges(base, local, remote).withOption('force_remote');

            graph = action(graph);

            expect(graph.entity('a').loc).to.eql([3, 3]);
            expect(graph.entity('a').version).to.eql('2');
            expect(graph.entity('a').tags).to.eql({foo: 'bar'});
        });

        it("merges ways with 'force_local' option", function () {
            var a = iD.Node({id: 'a'}),
                b = iD.Node({id: 'b'}),
                c = iD.Node({id: 'c'}),
                d = iD.Node({id: 'd'}),
                e = iD.Node({id: 'e'}),
                f = iD.Node({id: 'f'}),
                base = iD.Way({id: 'w', nodes: ['a', 'b'], version: '1', tags: {foo: 'foo'}}),
                local = iD.Way({id: 'w', nodes: ['c', 'd'], version: '1', v: 2, tags: {foo: 'foo_v2'}}),
                remote = iD.Way({id: 'w', nodes: ['e', 'f'], version: '2', tags: {foo: 'bar'}}),
                graph = iD.Graph([c, d, local]),
                action = iD.actions.MergeRemoteChanges(base, local, remote).withOption('force_local');

            graph = action(graph);

            expect(graph.entity('w').nodes).to.eql(['c', 'd']);
            expect(graph.entity('w').version).to.eql('2');
            expect(graph.entity('w').tags).to.eql({foo: 'foo_v2'});
        });

        it("merges ways with 'force_remote' option", function () {
            var a = iD.Node({id: 'a'}),
                b = iD.Node({id: 'b'}),
                c = iD.Node({id: 'c'}),
                d = iD.Node({id: 'd'}),
                e = iD.Node({id: 'e'}),
                f = iD.Node({id: 'f'}),
                base = iD.Way({id: 'w', nodes: ['a', 'b'], version: '1', tags: {foo: 'foo'}}),
                local = iD.Way({id: 'w', nodes: ['c', 'd'], version: '1', v: 2, tags: {foo: 'foo_v2'}}),
                remote = iD.Way({id: 'w', nodes: ['e', 'f'], version: '2', tags: {foo: 'bar'}}),
                graph = iD.Graph([c, d, local]),
                action = iD.actions.MergeRemoteChanges(base, local, remote).withOption('force_remote');

            graph = action(graph);

            // expect(graph.hasEntity('e')).to.be.true;
            // expect(graph.hasEntity('f')).to.be.true;
            expect(graph.entity('w').nodes).to.eql(['e', 'f']);
            expect(graph.entity('w').version).to.eql('2');
            expect(graph.entity('w').tags).to.eql({foo: 'bar'});
        });

        it("merges relations with 'force_local' option", function () {
            var a = iD.Node({id: 'a'}),
                b = iD.Node({id: 'b'}),
                c = iD.Node({id: 'c'}),
                base = iD.Relation({id: 'r', members: [{id: 'a', type: 'node'}], version: '1', tags: {foo: 'foo'}}),
                local = iD.Relation({id: 'r', members: [{id: 'b', type: 'node'}], version: '1', v: 2, tags: {foo: 'foo_v2'}}),
                remote = iD.Relation({id: 'r', members: [{id: 'c', type: 'node'}], version: '2', tags: {foo: 'bar'}}),
                graph = iD.Graph([b, local]),
                action = iD.actions.MergeRemoteChanges(base, local, remote).withOption('force_local');

            graph = action(graph);

            expect(graph.entity('r').members).to.eql([{id: 'b', type: 'node'}]);
            expect(graph.entity('r').version).to.eql('2');
            expect(graph.entity('r').tags).to.eql({foo: 'foo_v2'});
        });

        it("merges relations with 'force_remote' option", function () {
            var a = iD.Node({id: 'a'}),
                b = iD.Node({id: 'b'}),
                c = iD.Node({id: 'c'}),
                base = iD.Relation({id: 'r', members: [{id: 'a', type: 'node'}], version: '1', tags: {foo: 'foo'}}),
                local = iD.Relation({id: 'r', members: [{id: 'b', type: 'node'}], version: '1', v: 2, tags: {foo: 'foo_v2'}}),
                remote = iD.Relation({id: 'r', members: [{id: 'c', type: 'node'}], version: '2', tags: {foo: 'bar'}}),
                graph = iD.Graph([b, local]),
                action = iD.actions.MergeRemoteChanges(base, local, remote).withOption('force_remote');

            graph = action(graph);

            // expect(graph.hasEntity('c')).to.be.true;
            expect(graph.entity('r').members).to.eql([{id: 'c', type: 'node'}]);
            expect(graph.entity('r').version).to.eql('2');
            expect(graph.entity('r').tags).to.eql({foo: 'bar'});
        });
    });

});
