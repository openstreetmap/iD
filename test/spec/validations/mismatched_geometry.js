describe('iD.validations.mismatched_geometry', function () {
    var context, _savedAreaKeys;

    beforeEach(function() {
        _savedAreaKeys = iD.osmAreaKeys;
        context = iD.coreContext().init();
        iD.fileFetcher.cache().preset_presets = {
            'Line': { geometry: ['line'], fallback: true, tags: {} },
            'Area': { geometry: ['area'], fallback: true, tags: { area: 'yes' } },
            'Building': { geometry: ['area'], tags: { building: '*' } },
            library: {
                tags: { amenity: 'library' },
                geometry: ['point', 'vertex', 'line', 'area'],
                locationSet: { include: ['NU'] }
            },
            generic_amenity: {
                tags: { amenity: '*' },
                geometry: ['point', 'vertex', 'line', 'area']
            },
        };
    });

    afterEach(function() {
        iD.osmSetAreaKeys(_savedAreaKeys);
    });


    function createPoint(tags) {
        var n1 = iD.osmNode({id: 'n-1', loc: [4,4], tags: tags});
        context.perform(
            iD.actionAddEntity(n1)
        );
    }

    function createOpenWay(tags) {
        var n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        var n3 = iD.osmNode({id: 'n-3', loc: [5,5]});
        var w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3'], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w)
        );
    }

    function createClosedWay(tags) {
        var n1 = iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = iD.osmNode({id: 'n-2', loc: [4,5]});
        var n3 = iD.osmNode({id: 'n-3', loc: [5,5]});
        var w = iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3', 'n-1'], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w)
        );
    }

    function validate() {
        var validator = iD.validationMismatchedGeometry(context);
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

    it('ignores points', function() {
        createPoint({ building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores open way without area tag', function() {
        createOpenWay({});
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores closed way with area tag', function() {
        createClosedWay({ building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('ignores open way with tag that allows both lines and areas', function() {
        createOpenWay({ man_made: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('flags open way with area tag', async () => {
        await iD.presetManager.ensureLoaded(true);
        iD.osmSetAreaKeys({ building: {} });
        createOpenWay({ building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('mismatched_geometry');
        expect(issue.subtype).to.eql('area_as_line');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('flags open way with both area and line tags', function() {
        createOpenWay({ area: 'yes', barrier: 'fence' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('mismatched_geometry');
        expect(issue.subtype).to.eql('area_as_line');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');
    });

    it('does not flag cases whether the entity matches the generic preset, regardless of geometry', async () => {
        // in this test case, waterway=dam is allowed as an area,
        // and there is no preset for waterway=security_lock, so it
        // uses to the fallback preset for all geometries.
        await iD.presetManager.ensureLoaded(true);
        iD.osmSetAreaKeys({ waterway: { dam: true } });

        createOpenWay({ 'disused:waterway': 'security_lock' });
        const issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it('does not error if the best preset is limited to certain regions', async () => {
        await iD.presetManager.ensureLoaded(true);

        createClosedWay({ amenity: 'library' });
        const issues = validate();
        expect(issues).to.have.lengthOf(0);
    });
});
