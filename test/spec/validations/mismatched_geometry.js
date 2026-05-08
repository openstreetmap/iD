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
        expect(issues).toHaveLength(0);
    });

    it('ignores points', function() {
        createPoint({ building: 'yes' });
        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('ignores open way without area tag', function() {
        createOpenWay({});
        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('ignores closed way with area tag', function() {
        createClosedWay({ building: 'yes' });
        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('ignores open way with tag that allows both lines and areas', function() {
        createOpenWay({ man_made: 'yes' });
        var issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('flags open way with area tag', async () => {
        await iD.presetManager.ensureLoaded(true);
        iD.osmSetAreaKeys({ building: {} });
        createOpenWay({ building: 'yes' });
        var issues = validate();
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('mismatched_geometry');
        expect(issue.subtype).toEqual('area_as_line');
        expect(issue.severity).toEqual('warning');
        expect(issue.entityIds).toHaveLength(1);
        expect(issue.entityIds[0]).toEqual('w-1');
    });

    it('flags open way with both area and line tags', function() {
        createOpenWay({ area: 'yes', barrier: 'fence' });
        var issues = validate();
        expect(issues).toHaveLength(1);
        var issue = issues[0];
        expect(issue.type).toEqual('mismatched_geometry');
        expect(issue.subtype).toEqual('area_as_line');
        expect(issue.severity).toEqual('warning');
        expect(issue.entityIds).toHaveLength(1);
        expect(issue.entityIds[0]).toEqual('w-1');
    });

    it('handles presets which only allow vertex, not point', () => {
        const container = d3_select(document.createElement('div'));
        createOpenWay({ traffic_calming: 'chicane' });

        const issues = validate();
        expect(issues).toHaveLength(1);
        issues[0].message(context)(container); // render it
        expect(container.text()).toBe('chicane should be a point, not a line');
    });

    it('does not flag cases whether the entity matches the generic preset, regardless of geometry', async () => {
        // in this test case, waterway=dam is allowed as an area,
        // and there is no preset for waterway=security_lock, so it
        // uses to the fallback preset for all geometries.
        await iD.presetManager.ensureLoaded(true);
        iD.osmSetAreaKeys({ waterway: { dam: true } });

        createOpenWay({ 'disused:waterway': 'security_lock' });
        const issues = validate();
        expect(issues).toHaveLength(0);
    });

    it('does not error if the best preset is limited to certain regions', async () => {
        await iD.presetManager.ensureLoaded(true);

        createClosedWay({ amenity: 'library' });
        const issues = validate();
        expect(issues).toHaveLength(0);
    });
});
