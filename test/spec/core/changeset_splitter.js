describe('iD.coreChangesetSplitter', function() {

    describe('early exit', function() {
        it('returns single group for empty changes', function() {
            // Scenario: User opens the editor, makes no edits, and hits save.
            // The changeset is empty.
            var graph = iD.coreGraph([]);
            var changes = { created: [], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(1);
            expect(groups[0].created).to.have.length(0);
            expect(groups[0].modified).to.have.length(0);
            expect(groups[0].deleted).to.have.length(0);
        });

        it('handles a single entity', function() {
            // Scenario: User adds just one bench in a park and saves.
            // Should always return a single group.
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var graph = iD.coreGraph([n1]);

            var changes = { created: [n1], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(1);
            expect(groups[0].created).to.have.length(1);
        });

        it('does not split when overall bbox is under threshold', function() {
            // Scenario: User adds two benches in the same park (~10 meters apart).
            // Both edits are well within the threshold, so no split is needed.
            //
            //   n1 ---10m--- n2
            //      (same park)
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [0.1, 0.1] });
            var graph = iD.coreGraph([n1, n2]);

            var changes = { created: [n1, n2], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(1);
            expect(groups[0].created).to.have.length(2);
        });
    });


    describe('geographic splitting', function() {
        it('splits distant unrelated nodes into separate groups', function() {
            // Scenario: User adds a restaurant in London, then pans across the
            // globe and adds a bus stop in Mongolia. These are completely
            // unrelated edits that should become two separate changesets.
            //
            //   n1 (London)                    n2 (Mongolia)
            //     [0,0] --------- 8000km --------- [100,50]
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [100, 50] });
            var graph = iD.coreGraph([n1, n2]);

            var changes = { created: [n1, n2], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);
            expect(groups[0].created).to.have.length(1);
            expect(groups[1].created).to.have.length(1);
        });

        it('correctly distributes entities across created/modified/deleted in each group', function() {
            // Scenario: User does a mixed editing session in two distant areas:
            //
            //   Area A (London):       Area B (Mongolia):
            //   - adds cafe n1         - adds shop n3
            //   - retags bench n2      - deletes old POI n4
            //
            // Each group should preserve the correct change type per entity.
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [0.001, 0.001] });
            var n3 = iD.osmNode({ id: 'n3', loc: [100, 50] });
            var n4 = iD.osmNode({ id: 'n4', loc: [100.001, 50.001] });
            var graph = iD.coreGraph([n1, n2, n3]);

            var changes = { created: [n1, n3], modified: [n2], deleted: [n4] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);
            groups.forEach(function(g) {
                expect(g).to.have.property('created').that.is.an('array');
                expect(g).to.have.property('modified').that.is.an('array');
                expect(g).to.have.property('deleted').that.is.an('array');
            });

            var totalCreated = groups.reduce(function(sum, g) { return sum + g.created.length; }, 0);
            var totalModified = groups.reduce(function(sum, g) { return sum + g.modified.length; }, 0);
            var totalDeleted = groups.reduce(function(sum, g) { return sum + g.deleted.length; }, 0);
            expect(totalCreated).to.equal(2);
            expect(totalModified).to.equal(1);
            expect(totalDeleted).to.equal(1);
        });
    });


    describe('referential integrity', function() {
        it('keeps a way and its child nodes in the same group', function() {
            // Scenario: User draws a new road (w1) with two nodes in London,
            // then also adds an unrelated POI (n3) in Mongolia.
            // The road and its nodes must stay together.
            //
            //   n1 ---w1--- n2                   n3
            //   [London road]        8000km       [Mongolia POI]
            //   \___ group A ___/                 \_ group B _/
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [0.001, 0.001] });
            var n3 = iD.osmNode({ id: 'n3', loc: [100, 50] });
            var w1 = iD.osmWay({ id: 'w1', nodes: ['n1', 'n2'] });
            var graph = iD.coreGraph([n1, n2, n3, w1]);

            var changes = { created: [n1, n2, n3, w1], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);

            var wayGroup = groups.find(function(g) {
                return g.created.some(function(e) { return e.id === 'w1'; });
            });
            var wayGroupIds = wayGroup.created.map(function(e) { return e.id; });
            expect(wayGroupIds).to.include('n1');
            expect(wayGroupIds).to.include('n2');
            expect(wayGroupIds).to.include('w1');
            expect(wayGroupIds).to.not.include('n3');
        });

        it('keeps a relation and its members in the same group', function() {
            // Scenario: User creates a multipolygon building (r1) with an
            // outer way (w1 with nodes n1, n2) in London, and separately
            // adds a POI (n3) in Mongolia.
            // The entire building relation must stay in one group.
            //
            //   n1 ---w1--- n2
            //   \____r1____/                     n3
            //   [London building]                [Mongolia POI]
            //   \_____ group A _____/            \_ group B _/
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [0.01, 0.01] });
            var w1 = iD.osmWay({ id: 'w1', nodes: ['n1', 'n2'] });
            var r1 = iD.osmRelation({ id: 'r1', members: [{ id: 'w1', type: 'way', role: 'outer' }] });
            var n3 = iD.osmNode({ id: 'n3', loc: [100, 50] });
            var graph = iD.coreGraph([n1, n2, w1, r1, n3]);

            var changes = { created: [n1, n2, w1, r1, n3], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);

            var relGroup = groups.find(function(g) {
                return g.created.some(function(e) { return e.id === 'r1'; });
            });
            var relGroupIds = relGroup.created.map(function(e) { return e.id; });
            expect(relGroupIds).to.include('w1');
            expect(relGroupIds).to.include('n1');
            expect(relGroupIds).to.include('n2');
        });

        it('keeps nested relations in the same group', function() {
            // Scenario: User creates a route relation (r2) that contains a
            // sub-relation (r1), which contains a way (w1) and node (n1).
            // Then they also add a separate POI (n2) far away.
            // The entire nested structure must stay as one group.
            //
            //   n1 ---w1
            //   \__r1__/
            //   \___r2__/                        n2
            //   [nested route]                   [distant POI]
            //   \_____ group A _____/            \_ group B _/
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var w1 = iD.osmWay({ id: 'w1', nodes: ['n1'] });
            var r1 = iD.osmRelation({ id: 'r1', members: [{ id: 'w1', type: 'way', role: '' }] });
            var r2 = iD.osmRelation({ id: 'r2', members: [{ id: 'r1', type: 'relation', role: '' }] });
            var n2 = iD.osmNode({ id: 'n2', loc: [100, 50] });
            var graph = iD.coreGraph([n1, w1, r1, r2, n2]);

            var changes = { created: [n1, w1, r1, r2, n2], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);

            var nestedGroup = groups.find(function(g) {
                return g.created.some(function(e) { return e.id === 'r2'; });
            });
            var ids = nestedGroup.created.map(function(e) { return e.id; });
            expect(ids).to.include('r1');
            expect(ids).to.include('w1');
            expect(ids).to.include('n1');
            expect(ids).to.not.include('n2');
        });
    });


    describe('deleted entities', function() {
        it('groups deleted entities with related entities', function() {
            // Scenario: User deletes a road (w1) but its nodes (n1, n2)
            // remain because they're shared with other features. User also
            // retags node n1. The deleted way should group with the modified
            // node since they share a structural dependency.
            //
            //   n1 ---w1--- n2         (w1 deleted, n1 retagged)
            //   \___ same group ___/
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [0.001, 0.001] });
            var w1 = iD.osmWay({ id: 'w1', nodes: ['n1', 'n2'] });
            var graph = iD.coreGraph([n1, n2]);

            var changes = { created: [], modified: [n1], deleted: [w1] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(1);
            var ids = groups[0].modified.map(function(e) { return e.id; })
                .concat(groups[0].deleted.map(function(e) { return e.id; }));
            expect(ids).to.include('n1');
            expect(ids).to.include('w1');
        });

        it('resolves location from deleted nodes not in graph via entityMap', function() {
            // Scenario: User bulk-deletes an entire building (way + nodes)
            // in London, and also deletes an unrelated POI in Mongolia.
            // All entities are gone from the head graph, but their base
            // versions still carry location data.
            //
            //   n1 ---w1--- n2  (all deleted)     n3 (deleted)
            //   [London building]                  [Mongolia POI]
            //   \_____ group A _____/              \_ group B _/
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [0.001, 0.001] });
            var w1 = iD.osmWay({ id: 'w1', nodes: ['n1', 'n2'] });
            var n3 = iD.osmNode({ id: 'n3', loc: [100, 50] });
            var graph = iD.coreGraph([]);

            var changes = { created: [], modified: [], deleted: [n1, n2, w1, n3] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);
            var wayGroup = groups.find(function(g) {
                return g.deleted.some(function(e) { return e.id === 'w1'; });
            });
            var wayGroupIds = wayGroup.deleted.map(function(e) { return e.id; });
            expect(wayGroupIds).to.include('n1');
            expect(wayGroupIds).to.include('n2');
            expect(wayGroupIds).to.not.include('n3');
        });
    });


    describe('edge cases', function() {
        it('handles only modified entities', function() {
            // Scenario: User retags a cafe in London, then pans to Mongolia
            // and retags a bus stop there. No new features or deletions,
            // just tag edits in two distant places.
            //
            //   n1 (retagged)                    n2 (retagged)
            //   [London cafe]      8000km        [Mongolia bus stop]
            //   \_ group A _/                    \_ group B _/
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [100, 50] });
            var graph = iD.coreGraph([n1, n2]);

            var changes = { created: [], modified: [n1, n2], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);
            expect(groups[0].modified).to.have.length(1);
            expect(groups[1].modified).to.have.length(1);
            expect(groups[0].created).to.have.length(0);
            expect(groups[0].deleted).to.have.length(0);
        });

        it('links two ways sharing a common node in the changes', function() {
            // Scenario: User draws two connected streets (w1 and w2) that
            // share an intersection node (n3), plus an unrelated POI (n4)
            // far away. The two streets must stay together because they
            // share node n3 which is also being created.
            //
            //   n1 ---w1--- n3 ---w2--- n2       n4
            //               (shared)              [distant POI]
            //   \_______ group A ______/          \_ group B _/
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [0.001, 0] });
            var nShared = iD.osmNode({ id: 'n3', loc: [0.0005, 0] });
            var n4 = iD.osmNode({ id: 'n4', loc: [100, 50] });
            var w1 = iD.osmWay({ id: 'w1', nodes: ['n1', 'n3'] });
            var w2 = iD.osmWay({ id: 'w2', nodes: ['n3', 'n2'] });
            var graph = iD.coreGraph([n1, n2, nShared, n4, w1, w2]);

            var changes = { created: [n1, n2, nShared, n4, w1, w2], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);
            var wayGroup = groups.find(function(g) {
                return g.created.some(function(e) { return e.id === 'w1'; });
            });
            var ids = wayGroup.created.map(function(e) { return e.id; });
            expect(ids).to.include('w1');
            expect(ids).to.include('w2');
            expect(ids).to.include('n3');
            expect(ids).to.not.include('n4');
        });

        it('does not link two ways sharing a node that is NOT in the changes', function() {
            // Scenario: User retags two existing roads (w1 and w2) that
            // share an intersection node (n1), but the node itself is
            // unchanged. Since the shared node won't be uploaded, there's
            // no conflict risk, so the ways can safely go in separate changesets.
            //
            //   n2 ---w1--- n1 ---w2--- n3
            //   (retagged)  (unchanged)  (retagged)
            //   [London]                 [Mongolia]
            //   \_ group A _/            \_ group B _/
            var nShared = iD.osmNode({ id: 'n1', loc: [5, 5] });
            var n2 = iD.osmNode({ id: 'n2', loc: [0, 0] });
            var n3 = iD.osmNode({ id: 'n3', loc: [100, 50] });
            var w1 = iD.osmWay({ id: 'w1', nodes: ['n1', 'n2'] });
            var w2 = iD.osmWay({ id: 'w2', nodes: ['n1', 'n3'] });
            var graph = iD.coreGraph([nShared, n2, n3, w1, w2]);

            var changes = { created: [], modified: [w1, w2], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);
        });

        it('keeps a way with geographically distant nodes as one component', function() {
            // Scenario: User draws a very long power line (w1) that stretches
            // from London to Istanbul. The way and its endpoint nodes must
            // stay together; you can't upload half a way.
            //
            //   n1 ============w1============ n2
            //   [London]      5000km          [Istanbul]
            //   \__________ group A __________/
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [50, 40] });
            var w1 = iD.osmWay({ id: 'w1', nodes: ['n1', 'n2'] });
            var graph = iD.coreGraph([n1, n2, w1]);

            var changes = { created: [n1, n2, w1], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(1);
            expect(groups[0].created).to.have.length(3);
        });

        it('handles negative coordinates correctly', function() {
            // Scenario: User adds two POIs in Buenos Aires (southern/western
            // hemisphere with negative lat/lon), plus one POI in Mongolia.
            // The two Buenos Aires nodes should cluster together despite
            // negative coordinates.
            //
            //   n1, n2 (Buenos Aires)            n3 (Mongolia)
            //   [-73, -33]        ~15000km       [100, 50]
            //   \_ group A _/                    \_ group B _/
            var n1 = iD.osmNode({ id: 'n1', loc: [-73, -33] });
            var n2 = iD.osmNode({ id: 'n2', loc: [-73.001, -33.001] });
            var n3 = iD.osmNode({ id: 'n3', loc: [100, 50] });
            var graph = iD.coreGraph([n1, n2, n3]);

            var changes = { created: [n1, n2, n3], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);
            var southAmericaGroup = groups.find(function(g) {
                return g.created.some(function(e) { return e.id === 'n1'; });
            });
            var ids = southAmericaGroup.created.map(function(e) { return e.id; });
            expect(ids).to.include('n2');
            expect(ids).to.not.include('n3');
        });

        it('merges nearby nodes in adjacent grid cells', function() {
            // Scenario: User adds two trees on opposite sides of a street.
            // They happen to fall on different sides of an internal grid
            // cell boundary (at lon=0.5). The splitter should still merge
            // them since their combined extent is small.
            //
            //        grid boundary
            //             |
            //   n1 (0.49) | n2 (0.51)            n3 (100)
            //     [tree]  |  [tree]               [distant POI]
            //   \____ group A ___/                \_ group B _/
            var n1 = iD.osmNode({ id: 'n1', loc: [0.49, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [0.51, 0] });
            var n3 = iD.osmNode({ id: 'n3', loc: [100, 50] });
            var graph = iD.coreGraph([n1, n2, n3]);

            var changes = { created: [n1, n2, n3], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);
            var nearGroup = groups.find(function(g) {
                return g.created.some(function(e) { return e.id === 'n1'; });
            });
            var ids = nearGroup.created.map(function(e) { return e.id; });
            expect(ids).to.include('n2');
        });

        it('preserves entity count across all groups', function() {
            // Scenario: User performs a mix of actions across three cities:
            // creates a cafe and road in London, retags a shop in Cairo,
            // and deletes a POI in Mongolia.
            // All 4 entities must appear exactly once across all groups.
            //
            //   n1+w1 (London)  n2 (Cairo)  n3 (Mongolia)
            //   [created]       [modified]   [deleted]
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [50, 30] });
            var n3 = iD.osmNode({ id: 'n3', loc: [100, 50] });
            var w1 = iD.osmWay({ id: 'w1', nodes: ['n1'] });
            var graph = iD.coreGraph([n1, n2, n3, w1]);

            var changes = { created: [n1, w1], modified: [n2], deleted: [n3] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            var totalEntities = groups.reduce(function(sum, g) {
                return sum + g.created.length + g.modified.length + g.deleted.length;
            }, 0);
            expect(totalEntities).to.equal(4);
        });

        it('handles a relation whose members are not in the changes', function() {
            // Scenario: User retags an existing bus route relation (r1)
            // without modifying its member ways/nodes, and also adds a
            // new POI (n2) far away. Since the relation's members aren't
            // being changed, there's no structural link to keep r1 and n2
            // together.
            //
            //   n1 ---w1   (unchanged, in graph only)
            //   \__r1__/   (retagged)            n2 (new POI)
            //   [London]                         [Mongolia]
            //   \_ group A _/                    \_ group B _/
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var w1 = iD.osmWay({ id: 'w1', nodes: ['n1'] });
            var r1 = iD.osmRelation({ id: 'r1', members: [{ id: 'w1', type: 'way', role: '' }] });
            var n2 = iD.osmNode({ id: 'n2', loc: [100, 50] });
            var graph = iD.coreGraph([n1, w1]);

            var changes = { created: [], modified: [r1, n2], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);
        });

        it('handles cyclic relation membership without infinite recursion', function() {
            // Scenario: Two relations reference each other, and one relation
            // also contains a node with location. The traversal should not
            // recurse forever.
            //
            //   r1 -> r2 -> r1 (cycle), plus r1 -> n1
            //   and an unrelated far-away node n2.
            var n1 = iD.osmNode({ id: 'n1', loc: [0, 0] });
            var n2 = iD.osmNode({ id: 'n2', loc: [100, 50] });
            var r1 = iD.osmRelation({
                id: 'r1',
                members: [
                    { id: 'r2', type: 'relation', role: '' },
                    { id: 'n1', type: 'node', role: '' }
                ]
            });
            var r2 = iD.osmRelation({ id: 'r2', members: [{ id: 'r1', type: 'relation', role: '' }] });
            var graph = iD.coreGraph([n1, n2, r1, r2]);

            var changes = { created: [n1, n2, r1, r2], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);
            var cyclicGroup = groups.find(function(g) {
                return g.created.some(function(e) { return e.id === 'r1'; });
            });
            var ids = cyclicGroup.created.map(function(e) { return e.id; });
            expect(ids).to.include('r2');
            expect(ids).to.include('n1');
            expect(ids).to.not.include('n2');
        });

        it('merges diagonal neighboring grid cells when extent remains small', function() {
            // Scenario: n1 and n2 are in diagonal neighboring cells, while n3
            // is far away. Diagonal neighbors should still merge if the
            // combined extent is under threshold.
            var n1 = iD.osmNode({ id: 'n1', loc: [0.10, 0.10] });   // cell (0,0)
            var n2 = iD.osmNode({ id: 'n2', loc: [0.60, 0.60] });   // cell (1,1), diagonal from n1
            var n3 = iD.osmNode({ id: 'n3', loc: [100, 50] });
            var graph = iD.coreGraph([n1, n2, n3]);

            var changes = { created: [n1, n2, n3], modified: [], deleted: [] };
            var groups = iD.coreChangesetSplitter(changes, graph, 0.25);

            expect(groups).to.have.length(2);

            var nearGroup = groups.find(function(g) {
                return g.created.some(function(e) { return e.id === 'n1'; });
            });
            var ids = nearGroup.created.map(function(e) { return e.id; });
            expect(ids).to.include('n2');
            expect(ids).to.not.include('n3');
        });
    });

});
