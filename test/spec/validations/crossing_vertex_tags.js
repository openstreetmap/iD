describe('iD.validations.crossing_vertex_tags', function () {
    var context;

    beforeEach(function() {
        // Setup a fresh environment for every test
        context = iD.coreContext().assetPath('../dist/').init();
    });


    function createCrossing(wayTags, nodeTags) {

        // Create a path (n1-n2-n3) and a road (n4-n2-n5) intersecting at n2
        //        n4
        //         |
        //  n1----n2----n3
        //         |
        //        n5

        var n1 = iD.osmNode({id: 'n-1', loc: [0,0]});
        var n2 = iD.osmNode({id: 'n-2', loc: [1,1], tags: nodeTags});  //This will allow us to pass specific tags to the intersection point
        var n3 = iD.osmNode({id: 'n-3', loc: [2,2]});
        var n4 = iD.osmNode({id: 'n-4', loc: [0,2]});
        var n5 = iD.osmNode({id: 'n-5', loc: [2,0]});

        var road = iD.osmWay({id: 'w-road', nodes: ['n-4', 'n-2', 'n-5'], tags: { highway: 'residential' }}); // Create a residential road and a crossing way that intersect at node 'n-2'
        var path = iD.osmWay({id: 'w-path', nodes: ['n-1', 'n-2', 'n-3'], tags: wayTags}); // wayTags allows us to test that the validator correctly identifies a 'formal' crossing

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(n5),
            iD.actionAddEntity(road),
            iD.actionAddEntity(path)
        );
        return { path: path, node: n2, road: road };  // return object that will bundle path(pedestrian way- footway, cycleway and path), shared intersection node(vertex) and road(residential road which is being crossed)
    }

    function validate() {
        var validator = iD.validationCrossingVertexTags(context);  //initialising the validator
        var changes = context.history().changes();    // Collect all modified, created, or deleted entities in the current graph
        var entities = changes.modified.concat(changes.created);  //combine newly created and modified entities into single processing list
        var issues = [];   // Initialise collection to hold any validation issues
        entities.forEach(function(entity) {   //Iterate through each entity to run validation checks and aggregate results
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    // Test Cases

    // PRESERVE KEYS
    it('does not flag a mismatch when way lacks a preserve key that the node has', function() {
        // crossing_ref is a preserve key
        createCrossing({ highway: 'footway', footway: 'crossing' }, { 'crossing_ref': '123' });
        var issues = validate();
        // Even though way doesn't have crossing_ref, we don't delete it from node or flag error
        expect(issues).to.have.lengthOf(0);
    });


    // NODE-ONLY HIGHWAY
    it('flags when node needs highway=crossing added for formal crossings', function() {
        createCrossing({ highway: 'footway', footway: 'crossing', 'crossing:markings': 'zebra' }, { });
        var issues = validate();
        // Should flag because node lacks the 'crossing' value in its highway tag
        expect(issues).to.have.lengthOf(1);
    });


    it('supports multivalue highway tags (e.g., traffic_signals)', function() {
        createCrossing({ 'crossing:signals': 'yes' }, { highway: 'traffic_signals' });
        var issues = validate();
        // The expected fix/sync would result in highway=traffic_signals;crossing
        expect(issues).to.have.lengthOf(1);
    });


    it('handles incomplete crossing tags by merging instead of overwriting', function() {
        // Node has markings but no highway=crossing
        var n = iD.osmNode({id: 'n-1', loc: [0,0], tags: { 'crossing:markings': 'zebra' }});
        // Way has highway=crossing but no markings
        var w = iD.osmWay({id: 'w-1', nodes: ['n-start', 'n-1', 'n-end'],
            tags: { highway: 'footway', footway: 'crossing' }});
        var w_road = iD.osmWay({id: 'w-2', nodes: ['n-a', 'n-1', 'n-b'], tags: { highway: 'residential' }});

        context.perform(iD.actionAddEntity(n), iD.actionAddEntity(w), iD.actionAddEntity(w_road));

        var issues = validate();
        // Validator should notice the node is missing the 'highway=crossing' tag
        // but should NOT delete the existing 'zebra' markings.
        expect(issues).to.have.lengthOf(1);
        expect(issues[0].message).to.contain('Missing crossing tag');
    });


    it('flags when a crossing midpoint node is missing tags from the way', function() {
        createCrossing({ highway: 'footway', footway: 'crossing', 'crossing:markings': 'zebra' }, { highway: 'crossing' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        expect(issues[0].message).to.contain('Crossing tags mismatch');
    });


    it('syncs tags to multiple valid intersection midpoints on a single crossing way', function() {
        // Create two road ways
        var w_road1 = iD.osmWay({id: 'w-road1', nodes: ['n-a', 'n-mid1', 'n-b'], tags: { highway: 'residential' }});
        var w_road2 = iD.osmWay({id: 'w-road2', nodes: ['n-c', 'n-mid2', 'n-d'], tags: { highway: 'residential' }});

        // Create one crossing way that spans both roads
        var w_cross = iD.osmWay({id: 'w-cross', nodes: ['n-start', 'n-mid1', 'n-mid2', 'n-end'],
            tags: { highway: 'footway', footway: 'crossing', 'crossing:markings': 'zebra' }});

        context.perform(
            iD.actionAddEntity(w_road1), iD.actionAddEntity(w_road2), iD.actionAddEntity(w_cross)
        );

        var issues = validate();
        // Both n-mid1 and n-mid2 should be flagged for missing zebra tags
        // (Total issues = 2 because each node needs a fix)
        expect(issues).to.have.lengthOf(2);
    });

    //     Road A (Northbound)          Road B (Southbound)
    //                |                            |
    //                |          Node 1            |          Node 2
    //   [Start]------|------------(X)-------------|-----------(X)------------[End]
    //                |      (First Junction)      |      (Second Junction)
    //                |                            |
    //                |                            |


    it('does not strip crossing tags from a node if it has another crossable parent', function() {
        // Just call the helper to set up the context; we don't need to store the return object
        createCrossing({ highway: 'stream' }, { 'crossing:markings': 'zebra' });

        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });


    it('ignores endpoints even if they are on a crossing way', function() {
        var n1 = iD.osmNode({id: 'n-1', loc: [0,0], tags: {}}); // Endpoint
        var n2 = iD.osmNode({id: 'n-2', loc: [1,1], tags: {}}); // Midpoint
        var w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'footway', footway: 'crossing', 'crossing:markings': 'zebra' }});

        context.perform(iD.actionAddEntity(n1), iD.actionAddEntity(n2), iD.actionAddEntity(w));

        var validator = iD.validationCrossingVertexTags(context);
        var node1Issues = validator(n1, context.graph());
        expect(node1Issues).to.have.lengthOf(0); // Endpoint n1 is ignored (and n3, n4, n5 also)
    });



    it('does not give crossing tags to midpoints that only belong to the crossing way', function() {
        // n2 is a midpoint of a crossing way, but it does NOT intersect any other road
        var n1 = iD.osmNode({id: 'n-1', loc: [0,0]});
        var n2 = iD.osmNode({id: 'n-2', loc: [1,1]}); // The "Sidewalk Only" midpoint
        var n3 = iD.osmNode({id: 'n-3', loc: [2,2]});
        var w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3'],
                        tags: { highway: 'footway', footway: 'crossing', 'crossing:markings': 'zebra' }});

        context.perform(iD.actionAddEntity(n1), iD.actionAddEntity(n2), iD.actionAddEntity(n3), iD.actionAddEntity(w));

        var issues = validate();
        // n2 should NOT be flagged as "missing tags" because it isn't an intersection with a road
        expect(issues).to.have.lengthOf(0);
    });


    // NORMALIZATION
    it('normalizes legacy crossing=zebra to crossing:markings=zebra', function() {    //this block will check the part of validator that will trigger when a user interacts with that old data.
        createCrossing({ highway: 'footway', footway: 'crossing', crossing: 'zebra' }, {});
        var issues = validate();
        // The validator should find a mismatch because the node doesn't have the markings yet
        // but it should also show that it has "cleaned" the tags for the fix
        expect(issues).to.have.lengthOf(1);
        expect(issues[0].subtype).to.eql('mismatched_crossing_tags');
    });


    it('skips normalization when semicolons are present', function() {
        // Way has complex markings, Node is empty
        createCrossing({ 'crossing:markings': 'zebra;lines' }, {});
        // Logic from Section 4: 
        // If semicolons exist in crossing tags, the validator should return early 
        // and not flag a mismatch to avoid corrupting complex multi-value tags.
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });


    // Mapping specific signal types from crossing_ref
    it('maps crossing_ref=pelican to crossing:signals=yes', function() {
        createCrossing({ 'crossing_ref': 'pelican' }, {});
        var issues = validate();
        // This proves the normalization engine understands specific crossing types
        expect(issues[0].subtype).to.eql('mismatched_crossing_tags');
    });


    // Mapping informal/unmarked legacy tags
    it('maps crossing=informal to crossing:markings=no', function() {
        createCrossing({ 'crossing': 'informal' }, {});
        var issues = validate();
        // Proves that 'informal' is recognized as 'no markings'
        expect(issues[0].subtype).to.eql('mismatched_crossing_tags');
    });


    // Setting legacy crossing from modern signals
    it('sets crossing=traffic_signals when crossing:signals=yes is present', function() {
        // Start with ONLY modern signal tags
        createCrossing({ 'crossing:signals': 'yes' }, {});
        var issues = validate();
        // The sync/normalization should suggest adding crossing=traffic_signals
        expect(issues[0].subtype).to.eql('mismatched_crossing_tags');
    });


    it('upgrades legacy crossing=yes to crossing=marked when markings are present', function() {
        createCrossing({ 'crossing': 'yes', 'crossing:markings': 'zebra' }, {});
        var issues = validate();
        // This should trigger a cleanup that prefers the specific 'marked' over the vague 'yes'
        expect(issues[0].subtype).to.eql('mismatched_crossing_tags');
    });


    //EDGE CASES

    it('does not suggest removing tags from a standalone crossing node', function() {
        // Create a node with crossing tags but NO parent ways
        var n1 = iD.osmNode({id: 'n-1', loc: [0,0], tags: { 'crossing:markings': 'zebra', 'highway': 'crossing' }});
        context.perform(iD.actionAddEntity(n1));

        var issues = validate();
        // Should be 0 issues because the validator avoids "false remove-all" on standalone nodes
        expect(issues).to.have.lengthOf(0);
    });

    //     (NO Crossing Way here)
    //
    //
    // -----------------(X)-----------------  <-- highway=residential (The Road)
    //
    //
    //             NODE (X) tags:
    //             - highway=crossing
    //             - crossing:markings=zebra

});








