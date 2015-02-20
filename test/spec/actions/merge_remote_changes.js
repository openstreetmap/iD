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
            })
        ]),

        // some new objects not in the graph yet..
        r1 = iD.Node({id: 'r1', loc: [ 12,  12], version: '1', tags: {foo: 'foo_new'}}),
        r2 = iD.Node({id: 'r2', loc: [ 12, -12], version: '1', tags: {foo: 'foo_new'}}),
        r3 = iD.Node({id: 'r3', loc: [-12, -12], version: '1', tags: {foo: 'foo_new'}}),
        r4 = iD.Node({id: 'r4', loc: [-12,  12], version: '1', tags: {foo: 'foo_new'}}),
        w3 = iD.Way({
                id: 'w3',
                nodes: ['r1', 'r2', 'r3', 'r4', 'r1'],
                version: '1',
                tags: {foo: 'foo_new', area: 'yes'}
            }),

        s1 = iD.Node({id: 's1', loc: [ 6,  6], version: '1', tags: {foo: 'foo_new'}}),
        s2 = iD.Node({id: 's2', loc: [ 6, -6], version: '1', tags: {foo: 'foo_new'}}),
        s3 = iD.Node({id: 's3', loc: [-6, -6], version: '1', tags: {foo: 'foo_new'}}),
        s4 = iD.Node({id: 's4', loc: [-6,  6], version: '1', tags: {foo: 'foo_new'}}),
        w4 = iD.Way({
                id: 'w4',
                nodes: ['s1', 's2', 's3', 's4', 's1'],
                version: '1',
                tags: {foo: 'foo_new', area: 'yes'}
            }),

        saved, error;

    // setup mock locale object..
    beforeEach(function() {
        saved = locale;
        error = console.error;
        console.error = function () {};
        locale = {
            _current: 'en',
            en: {
                "merge_remote_changes": {
                    "annotation": "Merged remote changes from server.",
                    "conflict": {
                        "location": "This object was moved by both you and {user}.",
                        "nodelist": "Nodes were changed by both you and {user}.",
                        "memberlist": "Relation members were changed by both you and {user}.",
                        "tags": "You changed the <b>{tag}</b> tag to \"{local}\" and {user} changed it to \"{remote}\"."
                    }
                }
            }
        };
    });

    afterEach(function() {
        locale = saved;
        console.error = error;
    });

    function makeGraph(entities) {
        return _.reduce(entities, function(graph, entity) {
            return graph.replace(entity);
        }, iD.Graph(base));
    }

    describe("non-destuctive merging", function () {
        describe("nodes", function () {
            it("doesn't merge nodes if location is different", function () {
                var localTags = {foo: 'foo_local'},                 // changed tag foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote'},   // didn't change tag foo, added tag bar
                    localLoc = [1, 1],      // didn't move node
                    remoteLoc = [3, 3],     // moved node
                    local = iD.Node({id: 'a', loc: localLoc, version: '1', v: 2, tags: localTags }),
                    remote = iD.Node({id: 'a', loc: remoteLoc, version: '2', tags: remoteTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', altGraph);

                graph = action(graph);

                expect(graph.entity('a')).to.eql(local);
            });

            it("doesn't merge nodes if changed tags conflict (tag change)", function () {
                var localTags = {foo: 'foo_local'},                        // changed tag foo
                    remoteTags = {foo: 'foo_remote', bar: 'bar_remote'},   // changed tag foo, added tag bar
                    localLoc = [1, 1],      // didn't move node
                    remoteLoc = [1, 1],     // didn't move node
                    local = iD.Node({id: 'a', loc: localLoc, version: '1', v: 2, tags: localTags }),
                    remote = iD.Node({id: 'a', loc: remoteLoc, version: '2', tags: remoteTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', altGraph);

                graph = action(graph);

                expect(graph.entity('a')).to.eql(local);
            });

            it("doesn't merge nodes if changed tags conflict (tag delete)", function () {
                var localTags = {},                     // deleted tag foo
                    remoteTags = {foo: 'foo_remote'},   // changed tag foo
                    localLoc = [1, 1],      // didn't move node
                    remoteLoc = [1, 1],     // didn't move node
                    local = iD.Node({id: 'a', loc: localLoc, version: '1', v: 2, tags: localTags }),
                    remote = iD.Node({id: 'a', loc: remoteLoc, version: '2', tags: remoteTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', altGraph);

                graph = action(graph);

                expect(graph.entity('a')).to.eql(local);
            });

            it("merges nodes if location is same and changed tags don't conflict (tag change)", function () {
                var localTags = {foo: 'foo_local'},                 // changed tag foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote'},   // didn't change tag foo, added tag bar
                    localLoc = [1, 1],      // didn't move node
                    remoteLoc = [1, 1],     // didn't move node
                    local = iD.Node({id: 'a', loc: localLoc, version: '1', v: 2, tags: localTags }),
                    remote = iD.Node({id: 'a', loc: remoteLoc, version: '2', tags: remoteTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', altGraph);

                graph = action(graph);

                expect(graph.entity('a').version).to.eql('2');
                expect(graph.entity('a').tags).to.eql({foo: 'foo_local', bar: 'bar_remote'});
            });

            it("merges nodes if location is same and changed tags don't conflict (tag delete)", function () {
                var localTags = {},                                 // deleted tag foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote'},   // didn't change tag foo, added tag bar
                    localLoc = [1, 1],      // didn't move node
                    remoteLoc = [1, 1],     // didn't move node
                    local = iD.Node({id: 'a', loc: localLoc, version: '1', v: 2, tags: localTags }),
                    remote = iD.Node({id: 'a', loc: remoteLoc, version: '2', tags: remoteTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', altGraph);

                graph = action(graph);

                expect(graph.entity('a').version).to.eql('2');
                expect(graph.entity('a').tags).to.eql({bar: 'bar_remote'});
            });
        });

        describe("ways", function () {
            it("doesn't merge ways if changed tags conflict", function () {
                var localNodes = ['p1', 'p2', 'p3', 'p4', 'p1'],    // didn't change nodes
                    remoteNodes = ['p1', 'p2', 'p3', 'p4', 'p1'],   // didn't change nodes
                    localTags = {foo: 'foo_local', area: 'yes'},                        // changed tag foo
                    remoteTags = {foo: 'foo_remote', bar: 'bar_remote', area: 'yes'},   // changed tag foo, added tag bar
                    local = iD.Way({id: 'w1', nodes: localNodes, version: '1', v: 2, tags: localTags}),
                    remote = iD.Way({id: 'w1', nodes: remoteNodes, version: '2', tags: remoteTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('w1', altGraph);

                graph = action(graph);

                expect(graph.entity('w1')).to.eql(local);
            });

            it("merges ways if nodelist is same and tags don't conflict", function () {
                var localNodes = ['p1', 'p2', 'p3', 'p4', 'p1'],    // didn't change nodes
                    remoteNodes = ['p1', 'p2', 'p3', 'p4', 'p1'],   // didn't change nodes
                    localTags = {foo: 'foo_local', area: 'yes'},                 // changed tag foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote', area: 'yes'},   // didn't change tag foo, added tag bar
                    local = iD.Way({id: 'w1', nodes: localNodes, version: '1', v: 2, tags: localTags}),
                    remote = iD.Way({id: 'w1', nodes: remoteNodes, version: '2', tags: remoteTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('w1', altGraph);

                graph = action(graph);

                expect(graph.entity('w1').version).to.eql('2');
                expect(graph.entity('w1').tags).to.eql({foo: 'foo_local', bar: 'bar_remote', area: 'yes'});
            });

            it("merges ways if nodelist changed only remotely", function () {
                var localNodes = ['p1', 'p2', 'p3', 'p4', 'p1'],    // didn't change nodes
                    remoteNodes = ['p1', 'r2', 'r3', 'p4', 'p1'],   // changed nodes
                    localTags = {foo: 'foo_local', area: 'yes'},                 // changed tag foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote', area: 'yes'},   // didn't change tag foo, added tag bar
                    local = iD.Way({id: 'w1', nodes: localNodes, version: '1', v: 2, tags: localTags}),
                    remote = iD.Way({id: 'w1', nodes: remoteNodes, version: '2', tags: remoteTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote, r2, r3]),
                    action = iD.actions.MergeRemoteChanges('w1', altGraph);

                graph = action(graph);

                expect(graph.entity('w1').version).to.eql('2');
                expect(graph.entity('w1').tags).to.eql({foo: 'foo_local', bar: 'bar_remote', area: 'yes'});
                expect(graph.entity('w1').nodes).to.eql(remoteNodes);
                expect(graph.hasEntity('r2')).to.eql(r2);
                expect(graph.hasEntity('r3')).to.eql(r3);
            });

            it("merges ways if nodelist changed only locally", function () {
                var localNodes = ['p1', 'r2', 'r3', 'p4', 'p1'],    // changed nodes
                    remoteNodes = ['p1', 'p2', 'p3', 'p4', 'p1'],   // didn't change nodes
                    localTags = {foo: 'foo_local', area: 'yes'},                 // changed tag foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote', area: 'yes'},   // didn't change tag foo, added tag bar
                    local = iD.Way({id: 'w1', nodes: localNodes, version: '1', v: 2, tags: localTags}),
                    remote = iD.Way({id: 'w1', nodes: remoteNodes, version: '2', tags: remoteTags}),
                    graph = makeGraph([local, r2, r3]),
                    altGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('w1', altGraph);

                graph = action(graph);

                expect(graph.entity('w1').version).to.eql('2');
                expect(graph.entity('w1').tags).to.eql({foo: 'foo_local', bar: 'bar_remote', area: 'yes'});
                expect(graph.entity('w1').nodes).to.eql(localNodes);
            });

            it("merges ways if nodelist changes don't overlap", function () {
                var localNodes = ['p1', 'r1', 'r2',  'p3',     'p4',    'p1'],   // changed p2 -> r1, r2
                    remoteNodes = ['p1',   'p2',     'p3',  'r3', 'r4', 'p1'],   // changed p4 -> r3, r4
                    localTags = {foo: 'foo_local', area: 'yes'},                 // changed tag foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote', area: 'yes'},   // didn't change tag foo, added tag bar
                    local = iD.Way({id: 'w1', nodes: localNodes, version: '1', v: 2, tags: localTags}),
                    remote = iD.Way({id: 'w1', nodes: remoteNodes, version: '2', tags: remoteTags}),
                    graph = makeGraph([local, r1, r2]),
                    altGraph = makeGraph([remote, r3, r4]),
                    action = iD.actions.MergeRemoteChanges('w1', altGraph);

                graph = action(graph);

                expect(graph.entity('w1').version).to.eql('2');
                expect(graph.entity('w1').tags).to.eql({foo: 'foo_local', bar: 'bar_remote', area: 'yes'});
                expect(graph.entity('w1').nodes).to.eql(['p1', 'r1', 'r2', 'p3', 'r3', 'r4', 'p1']);
                expect(graph.hasEntity('r3')).to.eql(r3);
                expect(graph.hasEntity('r4')).to.eql(r4);
            });

            it("doesn't merge ways if nodelist changes overlap", function () {
                var localNodes = ['p1', 'r1', 'r2', 'p3', 'p4', 'p1'],   // changed p2 -> r1, r2
                    remoteNodes = ['p1', 'r3', 'r4', 'p3', 'p4', 'p1'],   // changed p2 -> r3, r4
                    localTags = {foo: 'foo_local', area: 'yes'},                 // changed tag foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote', area: 'yes'},   // didn't change tag foo, added tag bar
                    local = iD.Way({id: 'w1', nodes: localNodes, version: '1', v: 2, tags: localTags}),
                    remote = iD.Way({id: 'w1', nodes: remoteNodes, version: '2', tags: remoteTags}),
                    graph = makeGraph([local, r1, r2]),
                    altGraph = makeGraph([remote, r3, r4]),
                    action = iD.actions.MergeRemoteChanges('w1', altGraph);

                graph = action(graph);

                expect(graph.entity('w1')).to.eql(local);
            });

        });

        describe("relations", function () {
            it("doesn't merge relations if members have changed", function () {
                var localMembers = [{id: 'w1', role: 'outer'}, {id: 'w2', role: 'inner'}],   // didn't change members
                    remoteMembers = [{id: 'w1', role: 'outer'}, {id: 'w4', role: 'inner'}],  // changed inner to w4
                    localRelTags = {type: 'multipolygon', foo: 'foo_local'},                 // changed tag foo
                    remoteRelTags = {type: 'multipolygon', foo: 'foo', bar: 'bar_remote'},   // didn't change tag foo, added tag bar
                    local = iD.Relation({id: 'r', members: localMembers, version: '1', v: 2, tags: localRelTags}),
                    remote = iD.Relation({id: 'r', members: remoteMembers, version: '2', tags: remoteRelTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([s1, s2, s3, s4, w4]);
                    action = iD.actions.MergeRemoteChanges('r', altGraph);

                graph = action(graph);

                expect(graph.entity('r')).to.eql(local);
            });

            it("doesn't merge relations if changed tags conflict", function () {
                var relMembers = [{id: 'w1', role: 'outer'}, {id: 'w2', role: 'inner'}],           // didn't change members
                    localRelTags = {type: 'multipolygon', foo: 'foo_local'},                       // changed tag foo
                    remoteRelTags = {type: 'multipolygon', foo: 'foo_remote', bar: 'bar_remote'},  // changed tag foo, added tag bar
                    local = iD.Relation({id: 'r', members: relMembers, version: '1', v: 2, tags: localRelTags}),
                    remote = iD.Relation({id: 'r', members: relMembers, version: '2', tags: remoteRelTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote]);
                    action = iD.actions.MergeRemoteChanges('r', altGraph);

                graph = action(graph);

                expect(graph.entity('r')).to.eql(local);
            });

            it("merges relations if members are same and changed tags don't conflict", function () {
                var relMembers = [{id: 'w1', role: 'outer'}, {id: 'w2', role: 'inner'}],     // didn't change members
                    localRelTags = {type: 'multipolygon', foo: 'foo_local'},                 // changed tag foo
                    remoteRelTags = {type: 'multipolygon', foo: 'foo', bar: 'bar_remote'},   // didn't change tag foo, added tag bar
                    local = iD.Relation({id: 'r', members: relMembers, version: '1', v: 2, tags: localRelTags}),
                    remote = iD.Relation({id: 'r', members: relMembers, version: '2', tags: remoteRelTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote]);
                    action = iD.actions.MergeRemoteChanges('r', altGraph);

                graph = action(graph);

                expect(graph.entity('r').version).to.eql('2');
                expect(graph.entity('r').tags).to.eql({type: 'multipolygon', foo: 'foo_local', bar: 'bar_remote'});
            });
        });

        describe("#conflicts", function () {
            it("returns conflict details", function () {
                var localLoc = [1, 1],      // didn't move node
                    remoteLoc = [3, 3],     // moved node
                    local = iD.Node({id: 'a', loc: localLoc, version: '1', v: 2}),
                    remote = iD.Node({id: 'a', loc: remoteLoc, version: '2'}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', altGraph);

                graph = action(graph);

                expect(action.conflicts()).not.to.be.empty;
            });
        });
    });

    describe("destuctive merging", function () {
        describe("nodes", function () {
            it("merges nodes with 'force_local' option", function () {
                var localTags = {foo: 'foo_local'},     // changed tag foo
                    remoteTags = {foo: 'foo_remote'},   // changed tag foo
                    localLoc = [2, 2],     // moved node
                    remoteLoc = [3, 3],    // moved node
                    local = iD.Node({id: 'a', loc: localLoc, version: '1', v: 2, tags: localTags}),
                    remote = iD.Node({id: 'a', loc: remoteLoc, version: '2', tags: remoteTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', altGraph).withOption('force_local');

                graph = action(graph);

                expect(graph.entity('a').version).to.eql('2');
                expect(graph.entity('a').loc).to.eql(localLoc);
                expect(graph.entity('a').tags).to.eql(localTags);
            });

            it("merges nodes with 'force_remote' option", function () {
                var localTags = {foo: 'foo_local'},     // changed tag foo
                    remoteTags = {foo: 'foo_remote'},   // changed tag foo
                    localLoc = [2, 2],     // moved node
                    remoteLoc = [3, 3],    // moved node
                    local = iD.Node({id: 'a', loc: localLoc, version: '1', v: 2, tags: localTags}),
                    remote = iD.Node({id: 'a', loc: remoteLoc, version: '2', tags: remoteTags}),
                    graph = makeGraph([local]),
                    altGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', altGraph).withOption('force_remote');

                graph = action(graph);

                expect(graph.entity('a').version).to.eql('2');
                expect(graph.entity('a').loc).to.eql(remoteLoc);
                expect(graph.entity('a').tags).to.eql(remoteTags);
            });
        });

        describe("ways", function () {
            it("merges ways with 'force_local' option", function () {
                var localNodes = ['p1', 'r1', 'p2', 'p3', 'p4', 'p1'],    // inserted node r1
                    remoteNodes = ['p1', 'p2', 'p3', 's3', 'p4', 'p1'],   // inserted node s3
                    localTags = {foo: 'foo_local', area: 'yes'},     // changed tag foo
                    remoteTags = {foo: 'foo_remote', area: 'yes'},   // changed tag foo
                    local = iD.Way({id: 'w1', nodes: localNodes, version: '1', v: 2, tags: localTags}),
                    remote = iD.Way({id: 'w1', nodes: remoteNodes, version: '2', tags: remoteTags}),
                    graph = makeGraph([local, r1]),
                    altGraph = makeGraph([remote, s3]),
                    action = iD.actions.MergeRemoteChanges('w1', altGraph).withOption('force_local');

                graph = action(graph);

                expect(graph.entity('w1').version).to.eql('2');
                expect(graph.entity('w1').nodes).to.eql(localNodes);
                expect(graph.entity('w1').tags).to.eql(localTags);
            });

            it("merges ways with 'force_remote' option", function () {
                var localNodes = ['p1', 'r1', 'p2', 'p3', 'p4', 'p1'],    // inserted node r1
                    remoteNodes = ['p1', 'p2', 'p3', 's3', 'p4', 'p1'],   // inserted node s3
                    localTags = {foo: 'foo_local', area: 'yes'},     // changed tag foo
                    remoteTags = {foo: 'foo_remote', area: 'yes'},   // changed tag foo
                    local = iD.Way({id: 'w1', nodes: localNodes, version: '1', v: 2, tags: localTags}),
                    remote = iD.Way({id: 'w1', nodes: remoteNodes, version: '2', tags: remoteTags}),
                    graph = makeGraph([local, r1]),
                    altGraph = makeGraph([remote, s3]),
                    action = iD.actions.MergeRemoteChanges('w1', altGraph).withOption('force_remote');

                graph = action(graph);

                expect(graph.entity('w1').version).to.eql('2');
                expect(graph.hasEntity('s3')).to.eql(s3);
                expect(graph.entity('w1').nodes).to.eql(remoteNodes);
                expect(graph.entity('w1').tags).to.eql(remoteTags);
            });
        });

        describe("relations", function () {
            it("merges relations with 'force_local' option", function () {
                var localMembers = [{id: 'w3', role: 'outer'}, {id: 'w2', role: 'inner'}],   // changed outer to w3
                    remoteMembers = [{id: 'w4', role: 'outer'}, {id: 'w2', role: 'inner'}],  // changed outer to w4
                    localRelTags = {type: 'multipolygon', foo: 'foo_local'},    // changed tag foo
                    remoteRelTags = {type: 'multipolygon', foo: 'foo_remote'},  // changed tag foo
                    local = iD.Relation({id: 'r', members: localMembers, version: '1', v: 2, tags: localRelTags}),
                    remote = iD.Relation({id: 'r', members: remoteMembers, version: '2', tags: remoteRelTags}),
                    graph = makeGraph([local, r1, r2, r3, r4, w3]),
                    altGraph = makeGraph([remote, s1, s2, s3, s4, w4]),
                    action = iD.actions.MergeRemoteChanges('r', altGraph).withOption('force_local');

                graph = action(graph);

                expect(graph.entity('r').version).to.eql('2');
                expect(graph.entity('r').members).to.eql(localMembers);
                expect(graph.entity('r').tags).to.eql(localRelTags);
            });

            it("merges relations with 'force_remote' option", function () {
                var localMembers = [{id: 'w3', role: 'outer'}, {id: 'w2', role: 'inner'}],   // changed outer to w3
                    remoteMembers = [{id: 'w4', role: 'outer'}, {id: 'w2', role: 'inner'}],  // changed outer to w4
                    localRelTags = {type: 'multipolygon', foo: 'foo_local'},    // changed tag foo
                    remoteRelTags = {type: 'multipolygon', foo: 'foo_remote'},  // changed tag foo
                    local = iD.Relation({id: 'r', members: localMembers, version: '1', v: 2, tags: localRelTags}),
                    remote = iD.Relation({id: 'r', members: remoteMembers, version: '2', tags: remoteRelTags}),
                    graph = makeGraph([local, r1, r2, r3, r4, w3]),
                    altGraph = makeGraph([remote, s1, s2, s3, s4, w4]),
                    action = iD.actions.MergeRemoteChanges('r', altGraph).withOption('force_remote');

                graph = action(graph);

                expect(graph.entity('r').version).to.eql('2');
                expect(graph.entity('r').members).to.eql(remoteMembers);
                expect(graph.entity('r').tags).to.eql(remoteRelTags);
            });
        });
    });

});
