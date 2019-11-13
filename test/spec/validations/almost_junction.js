describe('iD.validations.almost_junction', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext();
    });

    function horizontalVertialCloserThanThd() {
        // horizontal road
        var n1 = iD.osmNode({id: 'n-1', loc: [22.42357, 0]});
        var n2 = iD.osmNode({id: 'n-2', loc: [22.42367, 0]});
        var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        // vertical road to the west of w1 by 0.00001 logitude degree
        // 5th digit after decimal point has a resolution of ~1 meter
        var n3 = iD.osmNode({id: 'n-3', loc: [22.42356, 0.001]});
        var n4 = iD.osmNode({id: 'n-4', loc: [22.42356, -0.001]});
        var w2 = iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function horizontalTiltedCloserThanThd() {
        // horizontal road
        var n1 = iD.osmNode({id: 'n-1', loc: [22.42357, 0]});
        var n2 = iD.osmNode({id: 'n-2', loc: [22.42367, 0]});
        var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        // tilted road to the west of w1 by 0.00001 logitude degree
        var n3 = iD.osmNode({id: 'n-3', loc: [22.423555, 0.001]});
        var n4 = iD.osmNode({id: 'n-4', loc: [22.423565, -0.001]});
        var w2 = iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function horizontalVertialFurtherThanThd() {
        // horizontal road
        var n1 = iD.osmNode({id: 'n-1', loc: [22.42357, 0]});
        var n2 = iD.osmNode({id: 'n-2', loc: [22.42367, 0]});
        var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        // vertical road to the west of w1 by 0.00007 logitude degree
        var n3 = iD.osmNode({id: 'n-3', loc: [22.42350, 0.001]});
        var n4 = iD.osmNode({id: 'n-4', loc: [22.42350, -0.001]});
        var w2 = iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function twoHorizontalCloserThanThd() {
        // horizontal road
        var n1 = iD.osmNode({id: 'n-1', loc: [22.42357, 0]});
        var n2 = iD.osmNode({id: 'n-2', loc: [22.42367, 0]});
        var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        // another horizontal road to the north of w1 by 0.0001 latitude degree
        var n3 = iD.osmNode({id: 'n-3', loc: [22.42357, 0.00001]});
        var n4 = iD.osmNode({id: 'n-4', loc: [22.42367, 0.00001]});
        var w2 = iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function horizontalVertialWithNoExit() {
        // horizontal road
        var n1 = iD.osmNode({id: 'n-1', loc: [22.42357, 0], tags: { noexit: 'yes' }});
        var n2 = iD.osmNode({id: 'n-2', loc: [22.42367, 0]});
        var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        // vertical road to the west of w1 by 0.00001 logitude degree
        var n3 = iD.osmNode({id: 'n-3', loc: [22.42356, 0.001]});
        var n4 = iD.osmNode({id: 'n-4', loc: [22.42356, -0.001]});
        var w2 = iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function validate() {
        var validator = iD.validationAlmostJunction(context);
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
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
        expect(issue.type).to.eql('almost_junction');
        expect(issue.subtype).to.eql('highway-highway');
        expect(issue.entityIds).to.have.lengthOf(3);
        expect(issue.entityIds[0]).to.eql('w-1');
        expect(issue.entityIds[1]).to.eql('n-1');
        expect(issue.entityIds[2]).to.eql('w-2');

        expect(issue.loc).to.have.lengthOf(2);
        expect(issue.loc[0]).to.eql(22.42357);
        expect(issue.loc[1]).to.eql(0);

        expect(issue.data.edge).to.have.lengthOf(2);
        expect(issue.data.edge[0]).to.eql('n-3');
        expect(issue.data.edge[1]).to.eql('n-4');

        expect(issue.data.cross_loc).to.have.lengthOf(2);
        expect(issue.data.cross_loc[0]).to.eql(22.42356);
        expect(issue.data.cross_loc[1]).to.eql(0);

        expect(issue.fixes(context)).to.have.lengthOf(3);
        issue.fixes(context)[0].onClick(context);
        issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('horizontal and tilted road, closer than threshold', function() {
        horizontalTiltedCloserThanThd();
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('almost_junction');
        expect(issue.subtype).to.eql('highway-highway');
        expect(issue.entityIds).to.have.lengthOf(3);
        expect(issue.entityIds[0]).to.eql('w-1');
        expect(issue.entityIds[1]).to.eql('n-1');
        expect(issue.entityIds[2]).to.eql('w-2');

        expect(issue.loc).to.have.lengthOf(2);
        expect(issue.loc[0]).to.eql(22.42357);
        expect(issue.loc[1]).to.eql(0);

        expect(issue.data.edge).to.have.lengthOf(2);
        expect(issue.data.edge[0]).to.eql('n-3');
        expect(issue.data.edge[1]).to.eql('n-4');

        expect(issue.data.cross_loc).to.have.lengthOf(2);
        expect(issue.data.cross_loc[0]).to.eql(22.42356);
        expect(issue.data.cross_loc[1]).to.eql(0);

        expect(issue.fixes(context)).to.have.lengthOf(3);
        issue.fixes(context)[1].onClick(context);
        issues = validate();
        expect(issues).to.have.lengthOf(0);
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
