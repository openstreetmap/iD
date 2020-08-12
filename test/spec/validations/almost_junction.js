describe('iD.validations.almost_junction', function () {
    var context;

    beforeEach(function() {
        context = iD.coreContext().init();
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

        // vertical road to the west of w1 by 0.00001 longitude degree
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

        // tilted road to the west of w1 by 0.00001 longitude degree
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

        // vertical road to the west of w1 by 0.00007 longitude degree
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

        // vertical road to the west of w1 by 0.00001 longitude degree
        var n3 = iD.osmNode({id: 'n-3', loc: [22.42356, 0.001]});
        var n4 = iD.osmNode({id: 'n-4', loc: [22.42356, -0.001]});
        var w2 = iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'residential' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function closeEndNodesSmallAngle() {
        // Vertical path
        var n1 = iD.osmNode({id: 'n-1', loc: [0.0003247, 22.4423866]});
        var n2 = iD.osmNode({id: 'n-2', loc: [0.0003060, 22.4432671]});
        var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'path' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        // Angled path with end node within 4.25m and change of angle <9°
        var n3 = iD.osmNode({id: 'n-3', loc: [0.0003379, 22.4423861]});
        var n4 = iD.osmNode({id: 'n-4', loc: [0.0004354, 22.4421312]});
        var w2 = iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'path' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function closeEndNodesBigAngle() {
        // Vertical path
        var n1 = iD.osmNode({id: 'n-1', loc: [0, 22.4427453]});
        var n2 = iD.osmNode({id: 'n-2', loc: [0, 22.4429806]});
        var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: { highway: 'path' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w1)
        );

        // Horizontal path with end node within 4.25m and change of angle >9°
        var n3 = iD.osmNode({id: 'n-3', loc: [0.0000199, 22.4427801]});
        var n4 = iD.osmNode({id: 'n-4', loc: [0.0002038, 22.4427801]});
        var w2 = iD.osmWay({id: 'w-2', nodes: ['n-3', 'n-4'], tags: { highway: 'path' }});

        context.perform(
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w2)
        );
    }

    function closeEndNodesSmallAngleSelf() {
        // Square path that ends within 4.25m of itself and change of angle <9°
        var n1 = iD.osmNode({id: 'n-1', loc: [0, 22.4427453]});
        var n2 = iD.osmNode({id: 'n-2', loc: [0, 22.4429811]});
        var n3 = iD.osmNode({id: 'n-3', loc: [0.0001923, 22.4429811]});
        var n4 = iD.osmNode({id: 'n-4', loc: [0.0001923, 22.4427523]});
        var n5 = iD.osmNode({id: 'n-5', loc: [0.0000134, 22.4427523]});
        var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3', 'n-4', 'n-5'], tags: { highway: 'path' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(n5),
            iD.actionAddEntity(w1)
        );
    }

    function closeEndNodesBothSmallAngle() {
        // Square path with both endpoints near each other
        var n1 = iD.osmNode({id: 'n-1', loc: [0, 22.4427453]});
        var n2 = iD.osmNode({id: 'n-2', loc: [0, 22.4429810]});
        var n3 = iD.osmNode({id: 'n-3', loc: [0.0000063, 22.4429810]});
        var n4 = iD.osmNode({id: 'n-4', loc: [0.0000063, 22.4427483]});
        var w1 = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3', 'n-4'], tags: { highway: 'path' }});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(n4),
            iD.actionAddEntity(w1)
        );

        // Horizontal path with end node within 4.25m and change of angle >9° (to both endpoints)
        var n5 = iD.osmNode({id: 'n-5', loc: [0.0000124, 22.4427458]});
        var n6 = iD.osmNode({id: 'n-6', loc: [0.0000445, 22.4427449]});
        var w2 = iD.osmWay({id: 'w-2', nodes: ['n-5', 'n-6'], tags: { highway: 'path' }});

        context.perform(
            iD.actionAddEntity(n5),
            iD.actionAddEntity(n6),
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

    it('flags horizontal and vertical road closer than threshold', function() {
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

    it('flags horizontal and tilted road closer than threshold', function() {
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

    it('ignores horizontal and vertical road further than threshold', function() {
        horizontalVertialFurtherThanThd();
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores horizontal and vertical road closer than threshold, but with noexit tag', function() {
        horizontalVertialWithNoExit();
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores two horizontal roads closer than threshold', function() {
        twoHorizontalCloserThanThd();
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('joins close endpoints if insignificant angle change', function() {
        closeEndNodesSmallAngle();
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('almost_junction');
        expect(issue.subtype).to.eql('highway-highway');
        expect(issue.entityIds).to.have.lengthOf(3);
        expect(issue.entityIds[0]).to.eql('w-2');
        expect(issue.entityIds[1]).to.eql('n-3');
        expect(issue.entityIds[2]).to.eql('w-1');

        issue.fixes(context)[0].onClick(context);
        var w1 = context.entity('w-1');
        var w2 = context.entity('w-2');
        var joined = w2.nodes[0] === w1.nodes[0];
        expect(joined).to.be.true;
    });

    it('won\'t join close endpoints if significant angle change', function() {
        closeEndNodesBigAngle();
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('almost_junction');
        expect(issue.subtype).to.eql('highway-highway');
        expect(issue.entityIds).to.have.lengthOf(3);
        expect(issue.entityIds[0]).to.eql('w-2');
        expect(issue.entityIds[1]).to.eql('n-3');
        expect(issue.entityIds[2]).to.eql('w-1');

        issue.fixes(context)[0].onClick(context);
        var w1 = context.entity('w-1');
        var w2 = context.entity('w-2');
        var joined = w2.nodes[0] === w1.nodes[0];
        expect(joined).not.to.be.true;
    });

    it('joins close endpoints of the same way', function() {
        closeEndNodesSmallAngleSelf();
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('almost_junction');
        expect(issue.subtype).to.eql('highway-highway');
        expect(issue.entityIds).to.have.lengthOf(3);
        expect(issue.entityIds[0]).to.eql('w-1');
        expect(issue.entityIds[1]).to.eql('n-5');
        expect(issue.entityIds[2]).to.eql('w-1');

        issue.fixes(context)[0].onClick(context);
        var w = context.entity('w-1');
        var joined = w.nodes[0] === w.nodes[w.nodes.length - 1];
        expect(joined).to.be.true;
    });


    it('joins to close endpoint with smaller angle change', function() {
        closeEndNodesBothSmallAngle();
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('almost_junction');
        expect(issue.subtype).to.eql('highway-highway');
        expect(issue.entityIds).to.have.lengthOf(3);
        expect(issue.entityIds[0]).to.eql('w-2');
        expect(issue.entityIds[1]).to.eql('n-5');
        expect(issue.entityIds[2]).to.eql('w-1');

        issue.fixes(context)[0].onClick(context);
        var w1 = context.entity('w-1');
        var w2 = context.entity('w-2');
        var joined = w2.nodes[0] === w1.nodes[0];
        expect(joined).to.be.true;
    });
});
