describe("iD.actions.MergeRemoteChanges", function () {
    var base = iD.Graph([
            iD.Node({id: 'a', loc: [1, 1], version: '1', tags: {foo: 'foo'}}),

            iD.Node({id: 'p1', loc: [ 10,  10], version: '1'}),
            iD.Node({id: 'p2', loc: [ 10, -10], version: '1'}),
            iD.Node({id: 'p3', loc: [-10, -10], version: '1'}),
            iD.Node({id: 'p4', loc: [-10,  10], version: '1'}),
            iD.Way({
                id: 'w1',
                nodes: ['p1', 'p2', 'p3', 'p4', 'p1'],
                version: '1',
                tags: {foo: 'foo', area: 'yes'}
            }),

            iD.Node({id: 'q1', loc: [ 5,  5], version: '1'}),
            iD.Node({id: 'q2', loc: [ 5, -5], version: '1'}),
            iD.Node({id: 'q3', loc: [-5, -5], version: '1'}),
            iD.Node({id: 'q4', loc: [-5,  5], version: '1'}),
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
        r1 = iD.Node({id: 'r1', loc: [ 12,  12], version: '1'}),
        r2 = iD.Node({id: 'r2', loc: [ 12, -12], version: '1'}),
        r3 = iD.Node({id: 'r3', loc: [-12, -12], version: '1'}),
        r4 = iD.Node({id: 'r4', loc: [-12,  12], version: '1'}),
        w3 = iD.Way({
                id: 'w3',
                nodes: ['r1', 'r2', 'r3', 'r4', 'r1'],
                version: '1',
                tags: {foo: 'foo_new', area: 'yes'}
            }),

        s1 = iD.Node({id: 's1', loc: [ 6,  6], version: '1'}),
        s2 = iD.Node({id: 's2', loc: [ 6, -6], version: '1'}),
        s3 = iD.Node({id: 's3', loc: [-6, -6], version: '1'}),
        s4 = iD.Node({id: 's4', loc: [-6,  6], version: '1'}),
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
                'merge_remote_changes': {
                    "annotation": "Merged remote changes from server.",
                    "conflict": {
                        "deleted": "This object has been deleted by {user}.",
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
        describe("tags", function() {
            it("doesn't merge tags if conflict (local change, remote change)", function () {

                var localTags = {foo: 'foo_local'},      // changed foo
                    remoteTags = {foo: 'foo_remote'},    // changed foo
                    local = base.entity('a').update({tags: localTags}),
                    remote = base.entity('a').update({tags: remoteTags, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', localGraph, remoteGraph);
                  var  result = action(localGraph);

                expect(result).to.eql(localGraph);
            });

            it("doesn't merge tags if conflict (local change, remote delete)", function () {
                var localTags = {foo: 'foo_local'},     // changed foo
                    remoteTags = {},                    // deleted foo
                    local = base.entity('a').update({tags: localTags}),
                    remote = base.entity('a').update({tags: remoteTags, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result).to.eql(localGraph);
            });

            it("doesn't merge tags if conflict (local delete, remote change)", function () {
                var localTags = {},                     // deleted foo
                    remoteTags = {foo: 'foo_remote'},   // changed foo
                    local = base.entity('a').update({tags: localTags}),
                    remote = base.entity('a').update({tags: remoteTags, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result).to.eql(localGraph);
            });

            it("doesn't merge tags if conflict (local add, remote add)", function () {
                var localTags = {foo: 'foo', bar: 'bar_local'},    // same foo, added bar
                    remoteTags = {foo: 'foo', bar: 'bar_remote'},  // same foo, added bar
                    local = base.entity('a').update({tags: localTags}),
                    remote = base.entity('a').update({tags: remoteTags, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result).to.eql(localGraph);
            });

            it("merges tags if no conflict (remote delete)", function () {
                var localTags = {foo: 'foo', bar: 'bar_local'},   // same foo, added bar
                    remoteTags = {},                              // deleted foo
                    mergedTags = {bar: 'bar_local'},
                    local = base.entity('a').update({tags: localTags}),
                    remote = base.entity('a').update({tags: remoteTags, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result.entity('a').version).to.eql('2');
                expect(result.entity('a').tags).to.eql(mergedTags);
            });

            it("merges tags if no conflict (local delete)", function () {
                var localTags = {},                                 // deleted foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote'},   // same foo, added bar
                    mergedTags = {bar: 'bar_remote'},
                    local = base.entity('a').update({tags: localTags}),
                    remote = base.entity('a').update({tags: remoteTags, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result.entity('a').version).to.eql('2');
                expect(result.entity('a').tags).to.eql(mergedTags);
            });
        });


        describe("nodes", function () {
            it("doesn't merge nodes if location is different", function () {
                var localTags = {foo: 'foo_local'},                // changed foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote'},  // same foo, added bar
                    localLoc = [2, 2],                             // moved node
                    remoteLoc = [3, 3],                            // moved node
                    local = base.entity('a').update({tags: localTags, loc: localLoc}),
                    remote = base.entity('a').update({tags: remoteTags, loc: remoteLoc, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result).to.eql(localGraph);
            });

            it("merges nodes if location is same", function () {
                var localTags = {foo: 'foo_local'},                // changed foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote'},  // same foo, added bar
                    mergedTags = {foo: 'foo_local', bar: 'bar_remote'},
                    localLoc = [2, 2],                             // moved node
                    remoteLoc = [2, 2],                            // moved node
                    local = base.entity('a').update({tags: localTags, loc: localLoc}),
                    remote = base.entity('a').update({tags: remoteTags, loc: remoteLoc, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result.entity('a').version).to.eql('2');
                expect(result.entity('a').tags).to.eql(mergedTags);
                expect(result.entity('a').loc).to.eql([2, 2]);
            });
        });


        describe("ways", function () {
            it("merges ways if nodelist is same", function () {
                var localTags = {foo: 'foo_local', area: 'yes'},                // changed foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote', area: 'yes'},  // same foo, added bar
                    mergedTags = {foo: 'foo_local', bar: 'bar_remote', area: 'yes'},
                    local = base.entity('w1').update({tags: localTags}),
                    remote = base.entity('w1').update({tags: remoteTags, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('w1', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result.entity('w1').version).to.eql('2');
                expect(result.entity('w1').tags).to.eql(mergedTags);
            });

            it("merges ways if nodelist changed only remotely", function () {
                var localTags = {foo: 'foo_local', area: 'yes'},                // changed foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote', area: 'yes'},  // same foo, added bar
                    mergedTags = {foo: 'foo_local', bar: 'bar_remote', area: 'yes'},
                    localNodes = ['p1', 'p2', 'p3', 'p4', 'p1'],                // didn't change nodes
                    remoteNodes = ['p1', 'r2', 'r3', 'p4', 'p1'],               // changed nodes
                    local = base.entity('w1').update({tags: localTags, nodes: localNodes}),
                    remote = base.entity('w1').update({tags: remoteTags, nodes: remoteNodes, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote, r2, r3]),
                    action = iD.actions.MergeRemoteChanges('w1', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result.entity('w1').version).to.eql('2');
                expect(result.entity('w1').tags).to.eql(mergedTags);
                expect(result.entity('w1').nodes).to.eql(remoteNodes);
                expect(result.hasEntity('r2')).to.eql(r2);
                expect(result.hasEntity('r3')).to.eql(r3);
            });

            it("merges ways if nodelist changed only locally", function () {
                var localTags = {foo: 'foo_local', area: 'yes'},                // changed foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote', area: 'yes'},  // same foo, added bar
                    mergedTags = {foo: 'foo_local', bar: 'bar_remote', area: 'yes'},
                    localNodes = ['p1', 'r2', 'r3', 'p4', 'p1'],                // changed nodes
                    remoteNodes = ['p1', 'p2', 'p3', 'p4', 'p1'],               // didn't change nodes
                    local = base.entity('w1').update({tags: localTags, nodes: localNodes}),
                    remote = base.entity('w1').update({tags: remoteTags, nodes: remoteNodes, version: '2'}),
                    localGraph = makeGraph([local, r2, r3]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('w1', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result.entity('w1').version).to.eql('2');
                expect(result.entity('w1').tags).to.eql(mergedTags);
                expect(result.entity('w1').nodes).to.eql(localNodes);
            });

            it("merges ways if nodelist changes don't overlap", function () {
                var localTags   = {foo: 'foo_local', area: 'yes'},                 // changed foo
                    remoteTags  = {foo: 'foo', bar: 'bar_remote', area: 'yes'},    // same foo, added bar
                    mergedTags  = {foo: 'foo_local', bar: 'bar_remote', area: 'yes'},
                    localNodes  = ['p1', 'r1', 'r2',  'p3',     'p4',     'p1'],   // changed p2 -> r1, r2
                    remoteNodes = ['p1',    'p2',     'p3',  'r3', 'r4',  'p1'],   // changed p4 -> r3, r4
                    mergedNodes = ['p1', 'r1', 'r2',  'p3',  'r3', 'r4',  'p1'],
                    local = base.entity('w1').update({tags: localTags, nodes: localNodes}),
                    remote = base.entity('w1').update({tags: remoteTags, nodes: remoteNodes, version: '2'}),
                    localGraph = makeGraph([local, r1, r2]),
                    remoteGraph = makeGraph([remote, r3, r4]),
                    action = iD.actions.MergeRemoteChanges('w1', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result.entity('w1').version).to.eql('2');
                expect(result.entity('w1').tags).to.eql(mergedTags);
                expect(result.entity('w1').nodes).to.eql(mergedNodes);
                expect(result.hasEntity('r3')).to.eql(r3);
                expect(result.hasEntity('r4')).to.eql(r4);
            });

            it("doesn't merge ways if nodelist changes overlap", function () {
                var localTags   = {foo: 'foo_local', area: 'yes'},                // changed foo
                    remoteTags  = {foo: 'foo', bar: 'bar_remote', area: 'yes'},   // same foo, added bar
                    localNodes  = ['p1', 'r1', 'r2', 'p3', 'p4', 'p1'],           // changed p2 -> r1, r2
                    remoteNodes = ['p1', 'r3', 'r4', 'p3', 'p4', 'p1'],           // changed p2 -> r3, r4
                    local = base.entity('w1').update({tags: localTags, nodes: localNodes}),
                    remote = base.entity('w1').update({tags: remoteTags, nodes: remoteNodes, version: '2'}),
                    localGraph = makeGraph([local, r1, r2]),
                    remoteGraph = makeGraph([remote, r3, r4]),
                    action = iD.actions.MergeRemoteChanges('w1', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result).to.eql(localGraph);
            });

            it("merges ways if childNode location is same", function () {
                var localLoc = [12, 12],     // moved node
                    remoteLoc = [12, 12],    // moved node
                    local = base.entity('p1').update({loc: localLoc}),
                    remote = base.entity('p1').update({loc: remoteLoc, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('w1', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result.entity('p1').version).to.eql('2');
                expect(result.entity('p1').loc).to.eql(remoteLoc);
            });

            it("doesn't merge ways if childNode location is different", function () {
                var localLoc = [12, 12],     // moved node
                    remoteLoc = [13, 13],    // moved node
                    local = base.entity('p1').update({loc: localLoc}),
                    remote = base.entity('p1').update({loc: remoteLoc, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('w1', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result).to.eql(localGraph);
            });
        });


        describe("relations", function () {
            it("doesn't merge relations if members have changed", function () {
                var localTags   = {foo: 'foo_local', type: 'multipolygon'},                  // changed foo
                    remoteTags  = {foo: 'foo', bar: 'bar_remote', type: 'multipolygon'},     // same foo, added bar
                    localMembers = [{id: 'w1', role: 'outer'}, {id: 'w2', role: 'inner'}],   // same members
                    remoteMembers = [{id: 'w1', role: 'outer'}, {id: 'w4', role: 'inner'}],  // changed inner to w4
                    local = base.entity('r').update({tags: localTags, members: localMembers}),
                    remote = base.entity('r').update({tags: remoteTags, members: remoteMembers, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote, s1, s2, s3, s4, w4]),
                    action = iD.actions.MergeRemoteChanges('r', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result).to.eql(localGraph);
            });

            it("merges relations if members are same and changed tags don't conflict", function () {
                var localTags   = {foo: 'foo_local', type: 'multipolygon'},                  // changed foo
                    remoteTags  = {foo: 'foo', bar: 'bar_remote', type: 'multipolygon'},     // same foo, added bar
                    mergedTags  = {foo: 'foo_local', bar: 'bar_remote', type: 'multipolygon'},
                    localMembers = [{id: 'w1', role: 'outer'}, {id: 'w2', role: 'inner'}],   // same members
                    remoteMembers = [{id: 'w1', role: 'outer'}, {id: 'w2', role: 'inner'}],  // same members
                    local = base.entity('r').update({tags: localTags, members: localMembers}),
                    remote = base.entity('r').update({tags: remoteTags, members: remoteMembers, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('r', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(result.entity('r').version).to.eql('2');
                expect(result.entity('r').tags).to.eql(mergedTags);
            });
        });


        describe("#conflicts", function () {
            it("returns conflict details", function () {
                var localTags = {foo: 'foo_local'},                // changed foo
                    remoteTags = {foo: 'foo', bar: 'bar_remote'},  // same foo, added bar
                    remoteLoc = [2, 2],                            // moved node
                    local = base.entity('a').update({tags: localTags}),
                    remote = base.entity('a').update({tags: remoteTags, loc: remoteLoc, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', localGraph, remoteGraph),
                    result = action(localGraph);

                expect(action.conflicts()).not.to.be.empty;
            });
        });
    });


    describe("destuctive merging", function () {
        describe("nodes", function () {
            it("merges nodes with 'force_local' option", function () {
                var localTags = {foo: 'foo_local'},       // changed foo
                    remoteTags = {foo: 'foo_remote'},     // changed foo
                    localLoc = [2, 2],                    // moved node
                    remoteLoc = [3, 3],                   // moved node
                    local = base.entity('a').update({tags: localTags, loc: localLoc}),
                    remote = base.entity('a').update({tags: remoteTags, loc: remoteLoc, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', localGraph, remoteGraph).withOption('force_local'),
                    result = action(localGraph);

                expect(result.entity('a').version).to.eql('2');
                expect(result.entity('a').tags).to.eql(localTags);
                expect(result.entity('a').loc).to.eql(localLoc);
            });

            it("merges nodes with 'force_remote' option", function () {
                var localTags = {foo: 'foo_local'},       // changed foo
                    remoteTags = {foo: 'foo_remote'},     // changed foo
                    localLoc = [2, 2],                    // moved node
                    remoteLoc = [3, 3],                   // moved node
                    local = base.entity('a').update({tags: localTags, loc: localLoc}),
                    remote = base.entity('a').update({tags: remoteTags, loc: remoteLoc, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('a', localGraph, remoteGraph).withOption('force_remote'),
                    result = action(localGraph);

                expect(result.entity('a').version).to.eql('2');
                expect(result.entity('a').tags).to.eql(remoteTags);
                expect(result.entity('a').loc).to.eql(remoteLoc);
            });
        });


        describe("ways", function () {
            it("merges ways with 'force_local' option", function () {
                var localTags   = {foo: 'foo_local', area: 'yes'},        // changed foo
                    remoteTags  = {foo: 'foo_remote', area: 'yes'},       // changed foo
                    localNodes  = ['p1', 'r1', 'r2', 'p3', 'p4', 'p1'],   // changed p2 -> r1, r2
                    remoteNodes = ['p1', 'r3', 'r4', 'p3', 'p4', 'p1'],   // changed p2 -> r3, r4
                    local = base.entity('w1').update({tags: localTags, nodes: localNodes}),
                    remote = base.entity('w1').update({tags: remoteTags, nodes: remoteNodes, version: '2'}),
                    localGraph = makeGraph([local, r1, r2]),
                    remoteGraph = makeGraph([remote, r3, r4]),
                    action = iD.actions.MergeRemoteChanges('w1', localGraph, remoteGraph).withOption('force_local'),
                    result = action(localGraph);

                expect(result.entity('w1').version).to.eql('2');
                expect(result.entity('w1').tags).to.eql(localTags);
                expect(result.entity('w1').nodes).to.eql(localNodes);
            });

            it("merges ways with 'force_remote' option", function () {
                var localTags   = {foo: 'foo_local', area: 'yes'},        // changed foo
                    remoteTags  = {foo: 'foo_remote', area: 'yes'},       // changed foo
                    localNodes  = ['p1', 'r1', 'r2', 'p3', 'p4', 'p1'],   // changed p2 -> r1, r2
                    remoteNodes = ['p1', 'r3', 'r4', 'p3', 'p4', 'p1'],   // changed p2 -> r3, r4
                    local = base.entity('w1').update({tags: localTags, nodes: localNodes}),
                    remote = base.entity('w1').update({tags: remoteTags, nodes: remoteNodes, version: '2'}),
                    localGraph = makeGraph([local, r1, r2]),
                    remoteGraph = makeGraph([remote, r3, r4]),
                    action = iD.actions.MergeRemoteChanges('w1', localGraph, remoteGraph).withOption('force_remote'),
                    result = action(localGraph);

                expect(result.entity('w1').version).to.eql('2');
                expect(result.entity('w1').tags).to.eql(remoteTags);
                expect(result.entity('w1').nodes).to.eql(remoteNodes);
                expect(result.hasEntity('r3')).to.eql(r3);
                expect(result.hasEntity('r4')).to.eql(r4);
            });

            it("merges way childNodes with 'force_local' option", function () {
                var localLoc = [12, 12],     // moved node
                    remoteLoc = [13, 13],    // moved node
                    local = base.entity('p1').update({loc: localLoc}),
                    remote = base.entity('p1').update({loc: remoteLoc, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('w1', localGraph, remoteGraph).withOption('force_local'),
                    result = action(localGraph);

                expect(result.entity('p1').version).to.eql('2');
                expect(result.entity('p1').loc).to.eql(localLoc);
            });

            it("merges way childNodes with 'force_remote' option", function () {
                var localLoc = [12, 12],     // moved node
                    remoteLoc = [13, 13],    // moved node
                    local = base.entity('p1').update({loc: localLoc}),
                    remote = base.entity('p1').update({loc: remoteLoc, version: '2'}),
                    localGraph = makeGraph([local]),
                    remoteGraph = makeGraph([remote]),
                    action = iD.actions.MergeRemoteChanges('w1', localGraph, remoteGraph).withOption('force_remote'),
                    result = action(localGraph);

                expect(result.entity('p1').version).to.eql('2');
                expect(result.entity('p1').loc).to.eql(remoteLoc);
            });

            it("keeps only important childNodes when merging", function () {
                var localNodes  = ['p1', 'r1', 'r2', 'p3', 'p4', 'p1'],    // changed p2 -> r1, r2
                    remoteNodes = ['p1', 'r3', 'r4', 'p3', 'p4', 'p1'],    // changed p2 -> r3, r4
                    localr1 = r1.update({tags: {highway: 'traffic_signals'}}),  // r1 has interesting tags
                    local = base.entity('w1').update({nodes: localNodes}),
                    remote = base.entity('w1').update({nodes: remoteNodes, version: '2'}),
                    localGraph = makeGraph([local, localr1, r2]),
                    remoteGraph = makeGraph([remote, r3, r4]),
                    action = iD.actions.MergeRemoteChanges('w1', localGraph, remoteGraph).withOption('force_remote'),
                    result = action(localGraph);

                expect(result.entity('w1').nodes).to.eql(remoteNodes);
                expect(result.hasEntity('r1')).to.eql(localr1);
                expect(result.hasEntity('r2')).to.be.not.ok;
            });
        });


        describe("relations", function () {
            it("merges relations with 'force_local' option", function () {
                var localTags = {foo: 'foo_local', type: 'multipolygon'},      // changed foo
                    remoteTags = {foo: 'foo_remote', type: 'multipolygon'},    // changed foo
                    localMembers = [{id: 'w3', role: 'outer'}, {id: 'w2', role: 'inner'}],   // changed outer to w3
                    remoteMembers = [{id: 'w1', role: 'outer'}, {id: 'w4', role: 'inner'}],  // changed inner to w4
                    local = base.entity('r').update({tags: localTags, members: localMembers}),
                    remote = base.entity('r').update({tags: remoteTags, members: remoteMembers, version: '2'}),
                    localGraph = makeGraph([local, r1, r2, r3, r4, w3]),
                    remoteGraph = makeGraph([remote, s1, s2, s3, s4, w4]),
                    action = iD.actions.MergeRemoteChanges('r', localGraph, remoteGraph).withOption('force_local'),
                    result = action(localGraph);

                expect(result.entity('r').version).to.eql('2');
                expect(result.entity('r').tags).to.eql(localTags);
                expect(result.entity('r').members).to.eql(localMembers);
            });

            it("merges relations with 'force_remote' option", function () {
                var localTags = {foo: 'foo_local', type: 'multipolygon'},      // changed foo
                    remoteTags = {foo: 'foo_remote', type: 'multipolygon'},    // changed foo
                    localMembers = [{id: 'w3', role: 'outer'}, {id: 'w2', role: 'inner'}],   // changed outer to w3
                    remoteMembers = [{id: 'w1', role: 'outer'}, {id: 'w4', role: 'inner'}],  // changed inner to w4
                    local = base.entity('r').update({tags: localTags, members: localMembers}),
                    remote = base.entity('r').update({tags: remoteTags, members: remoteMembers, version: '2'}),
                    localGraph = makeGraph([local, r1, r2, r3, r4, w3]),
                    remoteGraph = makeGraph([remote, s1, s2, s3, s4, w4]),
                    action = iD.actions.MergeRemoteChanges('r', localGraph, remoteGraph).withOption('force_remote'),
                    result = action(localGraph);

                expect(result.entity('r').version).to.eql('2');
                expect(result.entity('r').tags).to.eql(remoteTags);
                expect(result.entity('r').members).to.eql(remoteMembers);
            });
        });
    });

});
