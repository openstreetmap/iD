describe('iD.validations.time_ranges', function () {
    var context;

    beforeEach(function () {
        context = iD.coreContext().assetPath('../dist/').init();
    });

    function createWay(tags) {
        var n1 = iD.osmNode({ id: 'n-1', loc: [4, 4] });
        var n2 = iD.osmNode({ id: 'n-2', loc: [4, 5] });
        var w = iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2'], tags: tags });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
    }

    function validate() {
        var validator = iD.validationTimeRange(context);
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function (entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    it('has no errors on init', function () {
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores non time range key ', function () {
        createWay({ name: 'Main–Street' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags invalid syntax in time range keys', function () {
        createWay({ opening_hours: 'Mon-Fr 10:00-18:00' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);

        var issue = issues[0];
        expect(issue.type).to.eql('invalid_time_range');
        expect(issue.subtype).to.eql('invalid_time_range_syntax');
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('ignores correct syntax', function () {
        createWay({ opening_hours: ' Mo-Fr 10:00-18:00 ' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags multiple  syntax errors in time range keys', function () {
        createWay({
            opening_hours: 'mo-Fr 10:00~18:00',
            service_times: '10~20',
        });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);

        var issue = issues[0];
        expect(issue.entityIds).to.include('w-1');
        expect(issue.data).to.eql('_multi');
    });
    it('fixes invalid syntax in single time range key', function () {
        createWay({ opening_hours: 'Mo~Fr 10:00~18:00' });

        var issues = validate();
        expect(issues).to.have.lengthOf(1);

        var replaceFix = issues[0]
            .dynamicFixes(context)
            .find(
                (f) => f.title.stringId === 'issues.fix.fix_time_range.title'
            );
        replaceFix.onClick.call({ issue: issues[0] }, context);
        var entity = context.hasEntity('w-1');
        expect(entity.tags.opening_hours).to.eql('Mo-Fr 10:00-18:00');
    });

    it('fixes multiple syntax errors in different  time range keys', function () {
        createWay({
            opening_hours: 'Mo–Fr 10:00–18:00', //two en dashes
            service_times: '10~20',
        });

        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var replaceFix = issues[0]
            .dynamicFixes(context)
            .find(
                (f) => f.title.stringId === 'issues.fix.fix_time_range.title'
            );
        replaceFix.onClick.call({ issue: issues[0] }, context);
        var entity = context.hasEntity('w-1');
        expect(entity.tags.opening_hours).to.eql('Mo-Fr 10:00-18:00');
        expect(entity.tags.service_times).to.eql('10:00-20:00');
    });
});
