describe('iD.validations.crossing_ways', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext();
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

    function verifySingleCrossingIssue(issues) {
        var issue = issues[0];
        expect(issue.type).to.eql('crossing_ways');
        expect(issue.entityIds).to.have.lengthOf(2);

        expect(issue.loc).to.have.lengthOf(2);
        expect(issue.loc[0]).to.eql(1.5);
        expect(issue.loc[1]).to.eql(1.5);
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    // legit crossing cases
    it('legit crossing between highway and highway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential', tunnel: 'yes', layer: '-1' }, { highway: 'residential' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('legit crossing between highway and railway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { railway: 'rail', bridge: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('legit crossing between highway and waterway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential', bridge: 'yes' }, { waterway: 'river' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('legit crossing between highway and building', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential', layer: '-1' }, { building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('legit crossing between railway and railway', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail', bridge: 'yes' }, { railway: 'rail' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('legit crossing between railway bridges on different layers', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail', bridge: 'yes', layer: '2' }, { railway: 'rail', bridge: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('legit crossing between railway and waterway', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail' }, { waterway: 'river', tunnel: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('legit crossing between railway and building', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail', layer: '-1' }, { building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('legit crossing between waterway and waterway', function() {
        createWaysWithOneCrossingPoint({ waterway: 'canal', tunnel: 'yes' }, { waterway: 'river' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('legit crossing between waterway and building', function() {
        createWaysWithOneCrossingPoint({ waterway: 'river', layer: '-1' }, { building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('legit crossing between building and building', function() {
        createWaysWithOneCrossingPoint({ building: 'yes' }, { building: 'yes', layer: '1' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('legit crossing between indoor corridors on different levels', function() {
        createWaysWithOneCrossingPoint({ highway: 'corridor', level: '0' }, { highway: 'corridor', level: '1' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    // warning crossing cases between ways
    it('one cross point between highway and highway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { highway: 'residential' });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('one cross point between highway and railway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { railway: 'rail' });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('one cross point between highway and waterway', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { waterway: 'river' });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('one cross point between highway and building', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential' }, { building: 'yes' });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('one cross point between railway and railway', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail' }, { railway: 'rail' });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('one cross point between railway and waterway', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail' }, { waterway: 'river' });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('one cross point between railway bridge and highway bridge', function() {
        createWaysWithOneCrossingPoint({ highway: 'residential', bridge: 'yes' }, { railway: 'rail', bridge: 'yes' });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('one cross point between railway and building', function() {
        createWaysWithOneCrossingPoint({ railway: 'rail' }, { building: 'yes' });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('one cross point between waterway and waterway', function() {
        createWaysWithOneCrossingPoint({ waterway: 'canal' }, { waterway: 'canal' });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('one cross point between waterway tunnels', function() {
        createWaysWithOneCrossingPoint({ waterway: 'canal', tunnel: 'yes' }, { waterway: 'canal', tunnel: 'yes' });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('one cross point between waterway and building', function() {
        createWaysWithOneCrossingPoint({ waterway: 'river' }, { building: 'yes' });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('one cross point between building and building', function() {
        createWaysWithOneCrossingPoint({ building: 'yes' }, { building: 'yes' });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('one cross point between indoor corridors on the same level', function() {
        createWaysWithOneCrossingPoint({ highway: 'corridor', level: 0 }, { highway: 'corridor', level: 0 });
        verifySingleCrossingIssue(validate(), 'w-2');
    });

    it('two cross points between two highways', function() {
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
        var r1 = iD.osmRelation({id: 'r-1', members: [{id: 'w-2'}, {id: 'w-3'}], tags: relTags});

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

    it('one cross point between highway and building relation', function() {
        createWayAndRelationWithOneCrossingPoint({ highway: 'residential' }, { building: 'yes' });
        verifySingleCrossingIssue(validate(), 'r-1');
    });

});
