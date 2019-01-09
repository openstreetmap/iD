describe('iD.validations.highway_almost_junction', function () {
    var context;

    beforeEach(function() {
        context = iD.Context();
    });

    function horizontalVertialCloserThanThd() {
        // horizontal road
        var n1 = iD.Node({id: 'n-1', loc: [22.42357, 0]});
        var n2 = iD.Node({id: 'n-2', loc: [22.42367, 0]});
        var w1 = iD.Way({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        // vertical road to the west of w1 by 0.00001 logitude degree
        // 5th digit after decimal point has a resolution of ~1 meter
        var n3 = iD.Node({id: 'n-3', loc: [22.42356, 0.001]});
        var n4 = iD.Node({id: 'n-4', loc: [22.42356, -0.001]});
        var w2 = iD.Way({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function horizontalTiltedCloserThanThd() {
        // horizontal road
        var n1 = iD.Node({id: 'n-1', loc: [22.42357, 0]});
        var n2 = iD.Node({id: 'n-2', loc: [22.42367, 0]});
        var w1 = iD.Way({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        // tilted road to the west of w1 by 0.00001 logitude degree
        var n3 = iD.Node({id: 'n-3', loc: [22.423555, 0.001]});
        var n4 = iD.Node({id: 'n-4', loc: [22.423565, -0.001]});
        var w2 = iD.Way({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function horizontalVertialFurtherThanThd() {
        // horizontal road
        var n1 = iD.Node({id: 'n-1', loc: [22.42357, 0]});
        var n2 = iD.Node({id: 'n-2', loc: [22.42367, 0]});
        var w1 = iD.Way({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        // vertical road to the west of w1 by 0.00007 logitude degree
        var n3 = iD.Node({id: 'n-3', loc: [22.42350, 0.001]});
        var n4 = iD.Node({id: 'n-4', loc: [22.42350, -0.001]});
        var w2 = iD.Way({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function twoHorizontalCloserThanThd() {
        // horizontal road
        var n1 = iD.Node({id: 'n-1', loc: [22.42357, 0]});
        var n2 = iD.Node({id: 'n-2', loc: [22.42367, 0]});
        var w1 = iD.Way({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        // another horizontal road to the north of w1 by 0.0001 latitude degree
        var n3 = iD.Node({id: 'n-3', loc: [22.42357, 0.00001]});
        var n4 = iD.Node({id: 'n-4', loc: [22.42367, 0.00001]});
        var w2 = iD.Way({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function horizontalVertialWithNoExit() {
        // horizontal road
        var n1 = iD.Node({id: 'n-1', loc: [22.42357, 0], tags: { noexit: 'yes' }});
        var n2 = iD.Node({id: 'n-2', loc: [22.42367, 0]});
        var w1 = iD.Way({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        // vertical road to the west of w1 by 0.00001 logitude degree
        var n3 = iD.Node({id: 'n-3', loc: [22.42356, 0.001]});
        var n4 = iD.Node({id: 'n-4', loc: [22.42356, -0.001]});
        var w2 = iD.Way({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function validate() {
        var validator = iD.validationHighwayAlmostJunction();
        var changes = context.history().changes();
        return validator(changes, context.graph(), context.history().tree());
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('horizontal and vertical road, closer than threshold', function() {
        horizontalVertialCloserThanThd();
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql(iD.ValidationIssueType.highway_almost_junction);
        expect(issue.entities).to.have.lengthOf(2);
        expect(issue.entities[0].id).to.eql('n-1');
        expect(issue.entities[1].id).to.eql('w-2');

        expect(issue.coordinates).to.have.lengthOf(2);
        expect(issue.coordinates[0]).to.eql(22.42357);
        expect(issue.coordinates[1]).to.eql(0);
    });

    it('horizontal and tilted road, closer than threshold', function() {
        horizontalTiltedCloserThanThd();
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql(iD.ValidationIssueType.highway_almost_junction);
        expect(issue.entities).to.have.lengthOf(2);
        expect(issue.entities[0].id).to.eql('n-1');
        expect(issue.entities[1].id).to.eql('w-2');

        expect(issue.coordinates).to.have.lengthOf(2);
        expect(issue.coordinates[0]).to.eql(22.42357);
        expect(issue.coordinates[1]).to.eql(0);
    });

    it('horizontal and vertical road, further than threshold', function() {
        horizontalVertialFurtherThanThd();
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('horizontal and vertical road, closer than threshold but with noexit tag', function() {
        horizontalVertialWithNoExit();
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('two horizontal roads, closer than threshold', function() {
        twoHorizontalCloserThanThd();
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });
});
