import { select as d3_select } from 'd3-selection';

describe('iD.validations.mismatched_geometry', function () {
    var context, _savedAreaKeys;

    beforeEach(function() {
        _savedAreaKeys = iD.osmAreaKeys;
        context = iD.coreContext().init();
        iD.fileFetcher.cache().preset_presets = {
            'Line': { geometry: ['line'], fallback: true, tags: {} },
            'Area': { geometry: ['area'], fallback: true, tags: { area: 'yes' } },
            'Building': { geometry: ['area'], tags: { building: '*' } },
            Barrier: { geometry: ['point', 'vertex', 'line', 'area'], tags: { barrier: '*' } },
            Rigger: { geometry: ['point'], tags: { craft: 'rigger' } },
            Gate: { geometry: ['vertex', 'line'], tags: { barrier: 'gate' } },
            Junction: { geometry: ['vertex', 'area'], tags: { junction: 'yes' } },
            library: {
                tags: { amenity: 'library' },
                geometry: ['point', 'vertex', 'line', 'area'],
                locationSet: { include: ['NU'] }
            },
            generic_amenity: {
                tags: { amenity: '*' },
                geometry: ['point', 'vertex', 'line', 'area']
            },
            chicane: {
                tags: { traffic_calming: 'chicane' },
                geometry: ['vertex']
            },
        };
    });

    afterEach(function() {
        iD.osmSetAreaKeys(_savedAreaKeys);
    });


    function createPoint(tags) {
        var n1 = new iD.osmNode({id: 'n-1', loc: [4,4], tags: tags});
        context.perform(
            iD.actionAddEntity(n1)
        );
    }

    function createOpenWay(tags) {
        var n1 = new iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = new iD.osmNode({id: 'n-2', loc: [4,5]});
        var n3 = new iD.osmNode({id: 'n-3', loc: [5,5]});
        var w = new iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3'], tags: tags});

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w)
        );
        return w;
    }

    function createClosedWay(tags) {
        var n1 = new iD.osmNode({id: 'n-1', loc: [4,4]});
        var n2 = new iD.osmNode({id: 'n-2', loc: [4,5]});
        var n3 = new iD.osmNode({id: 'n-3', loc: [5,5]});
        var w = new iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3', 'n-1'], tags: tags});

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

    it('flags open way with area tag, and has autofix to connect the ends', async () => {
        await iD.presetManager.ensureLoaded(true);
        iD.osmSetAreaKeys({ building: {} });
        const way = createOpenWay({ building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('mismatched_geometry');
        expect(issue.subtype).to.eql('area_as_line');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');

        expect(issue.dynamicFixes(context)).toHaveLength(2);
        const fix0 = d3_select(document.createElement('div'));
        issue.fixes(context)[0].title(fix0);
        expect(fix0.text()).toBe('Connect the ends');

        // ensure that the way's nodes are modified
        issue.fixes(context)[0].onClick(context);
        expect(context.entity(way.id).nodes).toStrictEqual(['n-1', 'n-2', 'n-3', 'n-1']);
    });

    it('flags open way with area tag, and has autofix to remove the area tag', async () => {
        await iD.presetManager.ensureLoaded(true);
        iD.osmSetAreaKeys({ building: {} });
        const way = createOpenWay({ building: 'yes' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('mismatched_geometry');
        expect(issue.subtype).to.eql('area_as_line');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');

        expect(issue.dynamicFixes(context)).toHaveLength(2);

        const container = d3_select(document.createElement('div'));
        issue.fixes(context)[1].title(container);
        expect(container.text()).toBe('Remove the tag');

        // ensure that the tags are modified
        issue.fixes(context)[1].onClick(context);
        expect(context.entity(way.id).tags).toStrictEqual({});
    });

    it('flags open way with both area and line tags', function() {
        const way = createOpenWay({ area: 'yes', barrier: 'fence' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);
        var issue = issues[0];
        expect(issue.type).to.eql('mismatched_geometry');
        expect(issue.subtype).to.eql('area_as_line');
        expect(issue.severity).to.eql('warning');
        expect(issue.entityIds).to.have.lengthOf(1);
        expect(issue.entityIds[0]).to.eql('w-1');

        const container = d3_select(document.createElement('div'));
        issue.fixes(context)[0].title(container);
        expect(container.text()).toBe('Remove the tag');

        // ensure that the tags are modified
        issue.fixes(context)[0].onClick(context);
        expect(context.entity(way.id).tags).toStrictEqual({ barrier: 'fence' });
    });

    it('handles presets which only allow vertex, not point', () => {
        const container = d3_select(document.createElement('div'));
        createOpenWay({ traffic_calming: 'chicane' });

        const issues = validate();
        expect(issues).toHaveLength(1);
        issues[0].message(context)(container); // render it
        expect(container.text()).toBe('chicane should be a point, not a line');
    });

    it('handles points which should be a vertex or line', () => {
        const container = d3_select(document.createElement('div'));

        const n1 = new iD.osmNode({ id: 'n-1', loc: [0,0], tags: { barrier: 'gate' } });
        context.perform(iD.actionAddEntity(n1));

        const issues = validate();
        expect(issues).toHaveLength(1);
        issues[0].message(context)(container); // render it
        expect(container.text()).toBe('Gate should be attached to a line or area based on its tags');
    });

    it('handles vertices which should be a point', () => {
        const container = d3_select(document.createElement('div'));

        const n1 = new iD.osmNode({ id: 'n-1', loc: [1,1] });
        const n2 = new iD.osmNode({ id: 'n-2', loc: [2,2], tags: { craft: 'rigger' } });
        const n3 = new iD.osmNode({ id: 'n-3', loc: [3,3] });
        const w = new iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2', 'n-3'] });
        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w)
        );

        const issues = validate();
        expect(issues).toHaveLength(1);
        issues[0].message(context)(container); // render it
        expect(container.text()).toBe('Rigger should be a standalone point based on its tags');

        container.html('');
        issues[0].fixes(context)[0].title(container); // render it
        expect(container.text()).toBe('Extract this point');
    });

    it('handles closed lines which should be a vertex or area', () => {
        const container = d3_select(document.createElement('div'));

        const n1 = new iD.osmNode({id: 'n-1', loc: [4,4]});
        const n2 = new iD.osmNode({id: 'n-2', loc: [4,5]});
        const n3 = new iD.osmNode({id: 'n-3', loc: [5,5]});
        const w = new iD.osmWay({id: 'w-1', nodes: ['n-1', 'n-2', 'n-3', 'n-1'], tags: { junction: 'yes' } });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(n3),
            iD.actionAddEntity(w)
        );

        const issues = validate();
        expect(issues).toHaveLength(1);
        issues[0].message(context)(container); // render it
        expect(container.text()).toBe('Junction should be a closed area, not a line');

        // this test case is already a closed line, so there should be
        // an autofixer to add the `area=yes` tag.
        expect(issues[0].dynamicFixes()).toHaveLength(1);
        issues[0].fixes(context)[0].onClick(context);
        const fixedEntity = context.entity(w.id);
        expect(fixedEntity.tags).toStrictEqual({
            junction: 'yes',
            area: 'yes',
        });
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
