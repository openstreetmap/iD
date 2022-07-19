describe('iD.validations.crossing_ways', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function createWaysWithOneCrossingPoint(tags1, tags2) {
        var n1 = iD.osmNode({id: 'n-1', loc: [1,1]});
        var n2 = iD.osmNode({id: 'n-2', loc: [2,2]});
        var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags1});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        var n3 = iD.osmNode({id: 'n-3', loc: [1,2]});
        var n4 = iD.osmNode({id: 'n-4', loc: [2,1]});
        var w2 = iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-4'], tags: tags2});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function createWaysWithTwoCrossingPoint() {
      var n1 = iD.osmNode({id: 'n-1', loc: [1,1]});
      var n2 = iD.osmNode({id: 'n-2', loc: [3,3]});
      var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

      context.perform(
          iD.actionAddEntity(n1),
          iD.actionAddEntity(n2),
          iD.actionAddEntity(w1)
      );

      var n3 = iD.osmNode({id: 'n-3', loc: [1,2]});
      var n4 = iD.osmNode({id: 'n-4', loc: [2,1]});
      var n5 = iD.osmNode({id: 'n-5', loc: [3,2]});
      var n6 = iD.osmNode({id: 'n-6', loc: [2,3]});
      var w2 = iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-4', 'n-5', 'n-6'], tags: { highway: 'residential' }});

      context.perform(
          iD.actionAddEntity(n3),
          iD.actionAddEntity(n4),
          iD.actionAddEntity(n5),
          iD.actionAddEntity(n6),
          iD.actionAddEntity(w2)
      );
    }

    function validate() {
        var validator = iD.validationCrossingWays(context);
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    function verifySingleCrossingIssue(issues, connectionTags) {
        // each entity must produce an identical issue
        expect(issues).to.have.lengthOf(2);
        expect(issues[0].id).to.eql(issues[1].id);

        for (var i in issues) {
            var issue = issues[i];
            expect(issue.type).to.eql('crossing_ways');
            expect(issue.severity).to.eql('warning');
            expect(issue.entityIds).to.have.lengthOf(2);

            expect(issue.loc).to.have.lengthOf(2);
            expect(issue.loc[0]).to.eql(1.5);
            expect(issue.loc[1]).to.eql(1.5);

            expect(issue.data.connectionTags).to.eql(connectionTags);
        }
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores untagged line crossing untagged line', function() {
        createWaysWithOneCrossingPoint({}, {});
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores road crossing abandoned railway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { railway: 'abandoned' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores road crossing non-rail railway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { railway: 'yard' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores road crossing non-water waterway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { waterway: 'fuel' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores road crossing non-building building', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { building: 'no' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores road crossing non-routable highway', function() {
        createWaysWithOneCrossingPoint({ highway: 'services' }, { highway: 'residential' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    // legit crossing cases
    it('ignores road tunnel crossing road', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential', tunnel: 'yes', layer: '-1' }, { highway: 'residential' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores road crossing railway bridge', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { railway: 'rail', bridge: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores road bridge crossing waterway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential', bridge: 'yes' }, { waterway: 'river' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores road crossing building on different layers', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential', layer: '-1' }, { building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores railway crossing railway bridge', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail', bridge: 'yes' }, { railway: 'rail' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores railway bridge crossing railway bridge on different layers', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail', bridge: 'yes', layer: '2' }, { railway: 'rail', bridge: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores railway crossing waterway tunnel', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail' }, { waterway: 'river', tunnel: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores railway crossing building on different layers', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail', layer: '-1' }, { building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores waterway crossing waterway tunnel', function() {
        createWaysWithOneCrossingPoint({ waterway: 'canal', tunnel: 'yes' }, { waterway: 'river' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores waterway crossing building on different layers', function() {
        createWaysWithOneCrossingPoint({ waterway: 'river', layer: '-1' }, { building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores building crossing building on different layers', function() {
        createWaysWithOneCrossingPoint({ building: 'yes' }, { building: 'yes', layer: '1' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores corridor crossing corridor on different levels', function() {
        createWaysWithOneCrossingPoint({ highway: 'corridor', level: '0' }, { highway: 'corridor', level: '1' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    // warning crossing cases between ways
    it('flags road crossing road', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { highway: 'residential' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags road crossing footway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { highway: 'footway' });
        verifySingleCrossingIssue(validate(), { highway: 'crossing' });
    });

    it('flags road crossing cycleway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { highway: 'cycleway' });
        verifySingleCrossingIssue(validate(), { highway: 'crossing' });
    });

    it('flags road crossing marked crosswalk', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { highway: 'footway', crossing: 'marked' });
        verifySingleCrossingIssue(validate(), { highway: 'crossing', crossing: 'marked' });
    });

    it('flags road crossing crosswalk with traffic_signals', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { highway: 'footway', crossing: 'traffic_signals' });
        verifySingleCrossingIssue(validate(), { highway: 'crossing', crossing: 'traffic_signals' });
    });

    it('flags road crossing unmarked crosswalk', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { highway: 'footway', crossing: 'unmarked' });
        verifySingleCrossingIssue(validate(), { highway: 'crossing', crossing: 'unmarked' });
    });

    it('flags road=track crossing footway', function() {
        createWaysWithOneCrossingPoint({ highway: 'track' }, { highway: 'footway' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags cycleway crossing cycleway', function() {
        createWaysWithOneCrossingPoint({ highway: 'cycleway' }, { highway: 'cycleway' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags cycleway crossing footway', function() {
        createWaysWithOneCrossingPoint({ highway: 'cycleway' }, { highway: 'footway' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags footway crossing footway', function() {
        createWaysWithOneCrossingPoint({ highway: 'footway' }, { highway: 'footway' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags road crossing railway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { railway: 'rail' });
        verifySingleCrossingIssue(validate(), { railway: 'level_crossing' });
    });

    it('flags footway crossing railway', function() {
        createWaysWithOneCrossingPoint({ highway: 'footway' }, { railway: 'rail' });
        verifySingleCrossingIssue(validate(), { railway: 'crossing' });
    });

    it('flags cycleway crossing railway', function() {
        createWaysWithOneCrossingPoint({ highway: 'cycleway' }, { railway: 'rail' });
        verifySingleCrossingIssue(validate(), { railway: 'crossing' });
    });

    it('flags minor road crossing waterway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { waterway: 'river' });
        verifySingleCrossingIssue(validate(), { ford: 'yes' });
    });

    it('flags major road crossing waterway', function() {
        createWaysWithOneCrossingPoint({ highway: 'motorway' }, { waterway: 'river' });
        verifySingleCrossingIssue(validate(), null);
    });

    it('flags road crossing building', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { building: 'yes' });
        verifySingleCrossingIssue(validate(), null);
    });

    it('flags railway crossing railway', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail' }, { railway: 'rail' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags railway crossing waterway', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail' }, { waterway: 'river' });
        verifySingleCrossingIssue(validate(), null);
    });

    it('flags road bridge crossing road bridge on the same layer', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential', bridge: 'yes' }, { highway: 'tertiary', bridge: 'yes' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags road bridge crossing aqueduct on the same layer', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential', bridge: 'yes' }, { waterway: 'canal', bridge: 'aqueduct' });
        verifySingleCrossingIssue(validate(), null);
    });

    it('flags road tunnel crossing waterway tunnel on the same layer', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential', tunnel: 'yes' }, { waterway: 'canal', tunnel: 'yes' });
        verifySingleCrossingIssue(validate(), null);
    });

    it('flags railway bridge crossing road bridge on the same layer', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential', bridge: 'yes' }, { railway: 'rail', bridge: 'yes' });
        verifySingleCrossingIssue(validate(), { railway: 'level_crossing' });
    });

    it('flags railway crossing building', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail' }, { building: 'yes' });
        verifySingleCrossingIssue(validate(), null);
    });

    it('flags waterway crossing waterway', function() {
        createWaysWithOneCrossingPoint({ waterway: 'canal' }, { waterway: 'canal' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags waterway tunnel crossing waterway tunnel on the same layer', function() {
        createWaysWithOneCrossingPoint({ waterway: 'canal', tunnel: 'yes' }, { waterway: 'canal', tunnel: 'yes' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags waterway crossing building', function() {
        createWaysWithOneCrossingPoint({ waterway: 'river' }, { building: 'yes' });
        verifySingleCrossingIssue(validate(), null);
    });

    it('flags building crossing building', function() {
        createWaysWithOneCrossingPoint({ building: 'yes' }, { building: 'yes' });
        verifySingleCrossingIssue(validate(), null);
    });

    it('flags corridor crossing corridor on the same level', function() {
        createWaysWithOneCrossingPoint({ highway: 'corridor', level: '0' }, { highway: 'corridor', level: '0' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags road crossing road twice', function() {
        createWaysWithTwoCrossingPoint();
        var issues = validate();
        expect(issues).to.have.lengthOf(4);
        var issue = issues[0];
        expect(issue.type).to.eql('crossing_ways');
        expect(issue.entityIds).to.have.lengthOf(2);

        expect(issue.loc).to.have.lengthOf(2);
        expect(issue.loc[0]).to.eql(1.5);
        expect(issue.loc[1]).to.eql(1.5);

        issue = issues[1];
        expect(issue.type).to.eql('crossing_ways');
        expect(issue.entityIds).to.have.lengthOf(2);

        expect(issue.loc).to.have.lengthOf(2);
        expect(issue.loc[0]).to.eql(2.5);
        expect(issue.loc[1]).to.eql(2.5);
    });

    function createWayAndRelationWithOneCrossingPoint(wayTags, relTags) {
        var n1 = iD.osmNode({id: 'n-1', loc: [1,1]});
        var n2 = iD.osmNode({id: 'n-2', loc: [2,2]});
        var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: wayTags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        var n3 = iD.osmNode({id: 'n-3', loc: [1,2]});
        var n4 = iD.osmNode({id: 'n-4', loc: [2,1]});
        var n5 = iD.osmNode({id: 'n-5', loc: [3,2]});
        var n6 = iD.osmNode({id: 'n-6', loc: [2,3]});
        var w2 = iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-4', 'n-5'], tags: {}});
        var w3 = iD.osmWay({id: 'w-3', nodes: ['n-5', 'n-6', 'n-3'], tags: {}});
        var r1 = iD.osmRelation({id: 'r-1', members: [{id: 'w-2', type: 'way'}, {id: 'w-3', type: 'way'}], tags: relTags});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(n5),
            iD.actionAddEntity(n6),
            iD.actionAddEntity(w2),
            iD.actionAddEntity(w3),
            iD.actionAddEntity(r1)
        );
    }

    it('ignores road line crossing relation with building=yes without a type', function() {
        createWayAndRelationWithOneCrossingPoint({ highway: 'residential' }, { building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores road line crossing type=building relation', function() {
        createWayAndRelationWithOneCrossingPoint({ highway: 'residential' }, { building: 'yes', type: 'building' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores road line crossing waterway multipolygon relation', function() {
        createWayAndRelationWithOneCrossingPoint({ highway: 'residential' }, { waterway: 'river', type: 'multipolygon' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags road line crossing building multipolygon relation', function() {
        createWayAndRelationWithOneCrossingPoint({ highway: 'residential' }, { building: 'yes', type: 'multipolygon' });
        verifySingleCrossingIssue(validate(), null);
    });

    it('flags footway line crossing footway multipolygon relation', function() {
        createWayAndRelationWithOneCrossingPoint({ highway: 'footway' }, { highway: 'footway', type: 'multipolygon' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags road line crossing footway multipolygon relation', function() {
        createWayAndRelationWithOneCrossingPoint({ highway: 'residential' }, { highway: 'footway', type: 'multipolygon' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags railway line crossing footway multipolygon relation', function() {
        createWayAndRelationWithOneCrossingPoint({ railway: 'tram' }, { highway: 'footway', type: 'multipolygon' });
        verifySingleCrossingIssue(validate(), {});
    });

    it('flags waterway line crossing footway multipolygon relation', function() {
        createWayAndRelationWithOneCrossingPoint({ waterway: 'stream' }, { highway: 'footway', type: 'multipolygon' });
        verifySingleCrossingIssue(validate(), {});
    });

});
