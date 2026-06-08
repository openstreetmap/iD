describe('iD.validations.misplaced_tag', function () {
    var graph;

    beforeEach(function() {
        graph = new iD.coreGraph();
    });

    function createWay(tags) {
        var n1 = new iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = new iD.osmNode({id: 'n-2', loc: [4,5]});
        var w = new iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags});

        graph = new iD.coreGraph([n1, n2, w]);
    }

    function validate() {
        var validator = iD.validationMisplacedTag();
        var entities = Object.values(graph.base().entities);
        var issues = [];
        entities.forEach(function(entity) {
            issues = issues.concat(validator(entity, graph));
        });
        return issues;
    }

    function contextStub() {
        return {
            entity: function(entityId) { return graph.entity(entityId); },
            graph: function() { return graph; },
            hasEntity: function(entityId) { return graph.hasEntity(entityId); },
            perform: function(action) { graph = action(graph); }
        };
    }

    it('has no errors on init', function() {
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags traffic_calming on footway=crossing ways', function() {
        createWay({ highway: 'footway', footway: 'crossing', traffic_calming: 'table' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        expect(issues[0].type).to.eql('misplaced_tag');
        expect(issues[0].subtype).to.eql('traffic_calming_on_crossing_way');
        expect(issues[0].severity).to.eql('warning');
        expect(issues[0].entityIds).to.eql(['w-1']);
    });

    it('flags traffic_calming on cycleway=crossing ways', function() {
        createWay({ highway: 'cycleway', cycleway: 'crossing', traffic_calming: 'table' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        expect(issues[0].type).to.eql('misplaced_tag');
    });

    it('flags traffic_calming on path=crossing ways', function() {
        createWay({ highway: 'path', path: 'crossing', traffic_calming: 'table' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        expect(issues[0].type).to.eql('misplaced_tag');
    });

    it('ignores crossing ways without traffic_calming', function() {
        createWay({ highway: 'footway', footway: 'crossing' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores traffic_calming on roads', function() {
        createWay({ highway: 'residential', traffic_calming: 'table' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('removes traffic_calming from the crossing way', function() {
        createWay({ highway: 'footway', footway: 'crossing', traffic_calming: 'table' });
        var issue = validate()[0];
        var fixes = issue.dynamicFixes();
        expect(fixes).to.have.lengthOf(1);

        fixes[0].onClick.call({ issue: issue }, contextStub());
        expect(graph.entity('w-1').tags).to.eql({ highway: 'footway', footway: 'crossing' });
    });
});
