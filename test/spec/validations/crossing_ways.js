describe('iD.validations.crossing_ways', function () {
    var context;

    beforeEach(function() {
        context = iD.Context();
    });

    function createWaysWithOneCrossingPoint() {
        var n1 = iD.Node({id: 'n-1', loc: [1,1]});
        var n2 = iD.Node({id: 'n-2', loc: [2,2]});
        var w1 = iD.Way({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        var n3 = iD.Node({id: 'n-3', loc: [1,2]});
        var n4 = iD.Node({id: 'n-4', loc: [2,1]});
        var w2 = iD.Way({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function createWaysWithTwoCrossingPoint() {
      var n1 = iD.Node({id: 'n-1', loc: [1,1]});
      var n2 = iD.Node({id: 'n-2', loc: [3,3]});
      var w1 = iD.Way({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

      context.perform(
          iD.actionAddEntity(n1),
          iD.actionAddEntity(n2),
          iD.actionAddEntity(w1)
      );

      var n3 = iD.Node({id: 'n-3', loc: [1,2]});
      var n4 = iD.Node({id: 'n-4', loc: [2,1]});
      var n5 = iD.Node({id: 'n-5', loc: [3,2]});
      var n6 = iD.Node({id: 'n-6', loc: [2,3]});
      var w2 = iD.Way({id: 'w-2', nodes: ['n-3', 'n-4', 'n-5', 'n-6'], tags: { highway: 'residential' }});

      context.perform(
          iD.actionAddEntity(n3),
          iD.actionAddEntity(n4),
          iD.actionAddEntity(n5),
          iD.actionAddEntity(n6),
          iD.actionAddEntity(w2)
      );
    }

    function validate() {
        var validator = iD.validationHighwayCrossingOtherWays();
        var changes = context.history().changes();
        return validator(changes, context.graph(), context.history().tree());
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('one cross point between two ways', function() {
        createWaysWithOneCrossingPoint();
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql(iD.ValidationIssueType.crossing_ways);
        expect(issue.entities).to.have.lengthOf(2);
        expect(issue.entities[0].id).to.eql('w-1');
        expect(issue.entities[1].id).to.eql('w-2');

        expect(issue.coordinates).to.have.lengthOf(2);
        expect(issue.coordinates[0]).to.eql(1.5);
        expect(issue.coordinates[1]).to.eql(1.5);
    });

    it('two cross points between two ways', function() {
        createWaysWithTwoCrossingPoint();
        var issues = validate();
        expect(issues).to.have.lengthOf(2);
        var issue = issues[0];
        expect(issue.type).to.eql(iD.ValidationIssueType.crossing_ways);
        expect(issue.entities).to.have.lengthOf(2);
        expect(issue.entities[0].id).to.eql('w-1');
        expect(issue.entities[1].id).to.eql('w-2');

        expect(issue.coordinates).to.have.lengthOf(2);
        expect(issue.coordinates[0]).to.eql(1.5);
        expect(issue.coordinates[1]).to.eql(1.5);

        issue = issues[1];
        expect(issue.type).to.eql(iD.ValidationIssueType.crossing_ways);
        expect(issue.entities).to.have.lengthOf(2);
        expect(issue.entities[0].id).to.eql('w-1');
        expect(issue.entities[1].id).to.eql('w-2');

        expect(issue.coordinates).to.have.lengthOf(2);
        expect(issue.coordinates[0]).to.eql(2.5);
        expect(issue.coordinates[1]).to.eql(2.5);
    });
});
