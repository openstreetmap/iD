describe('iD.Features', function() {
    var context, features;

    beforeEach(function() {
        context = iD();
        features = context.features();
    });

    it('returns feature keys', function() {
        var keys = features.keys();
        expect(keys).to.have.members([
            'points', 'major_roads', 'minor_roads', 'paths',
            'buildings', 'landuse', 'boundaries', 'water', 'rail',
            'power', 'past_future', 'others'
        ]);
    });

    it('disables and enables features', function() {
        var enabled, disabled;

        features.disable('water');
        features.disable('rail');
        enabled = features.enabled();
        disabled = features.disabled();

        expect(enabled).to.not.have.members(['water', 'rail']);
        expect(disabled).to.have.members(['water', 'rail']);

        features.enable('water');
        enabled = features.enabled();
        disabled = features.disabled();

        expect(enabled).to.include('water');
        expect(enabled).to.not.include('rail');
        expect(disabled).to.include('rail');
        expect(disabled).to.not.include('water');
        features.enable('rail');
    });

    describe("matching", function() {
        var graph = iD.Graph([
            // Points
            iD.Node({id: 'point_bar', tags: {amenity: 'bar'}, version: 1}),
            iD.Node({id: 'point_dock', tags: {waterway: 'dock'}, version: 1}),
            iD.Node({id: 'point_rail_station', tags: {railway: 'station'}, version: 1}),
            iD.Node({id: 'point_generator', tags: {power: 'generator'}, version: 1}),
            iD.Node({id: 'point_old_rail_station', tags: {railway: 'station', disused: 'yes'}, version: 1}),

            // Major Roads
            iD.Way({id: 'motorway', tags: {highway: 'motorway'}, version: 1}),
            iD.Way({id: 'motorway_link', tags: {highway: 'motorway_link'}, version: 1}),
            iD.Way({id: 'trunk', tags: {highway: 'trunk'}, version: 1}),
            iD.Way({id: 'trunk_link', tags: {highway: 'trunk_link'}, version: 1}),
            iD.Way({id: 'primary', tags: {highway: 'primary'}, version: 1}),
            iD.Way({id: 'primary_link', tags: {highway: 'primary_link'}, version: 1}),
            iD.Way({id: 'secondary', tags: {highway: 'secondary'}, version: 1}),
            iD.Way({id: 'secondary_link', tags: {highway: 'secondary_link'}, version: 1}),
            iD.Way({id: 'tertiary', tags: {highway: 'tertiary'}, version: 1}),
            iD.Way({id: 'tertiary_link', tags: {highway: 'tertiary_link'}, version: 1}),
            iD.Way({id: 'residential', tags: {highway: 'residential'}, version: 1}),

            // Minor Roads
            iD.Way({id: 'service', tags: {highway: 'service'}, version: 1}),
            iD.Way({id: 'living_street', tags: {highway: 'living_street'}, version: 1}),
            iD.Way({id: 'road', tags: {highway: 'road'}, version: 1}),
            iD.Way({id: 'unclassified', tags: {highway: 'unclassified'}, version: 1}),
            iD.Way({id: 'track', tags: {highway: 'track'}, version: 1}),

            // Paths
            iD.Way({id: 'path', tags: {highway: 'path'}, version: 1}),
            iD.Way({id: 'footway', tags: {highway: 'footway'}, version: 1}),
            iD.Way({id: 'cycleway', tags: {highway: 'cycleway'}, version: 1}),
            iD.Way({id: 'bridleway', tags: {highway: 'bridleway'}, version: 1}),
            iD.Way({id: 'steps', tags: {highway: 'steps'}, version: 1}),
            iD.Way({id: 'pedestrian', tags: {highway: 'pedestrian'}, version: 1}),

            // Buildings
            iD.Way({id: 'building_yes', tags: {area: 'yes', amenity: 'school', building: 'yes'}, version: 1}),
            iD.Way({id: 'building_no', tags: {area: 'yes', amenity: 'school', building: 'no'}, version: 1}),
            iD.Way({id: 'building_part', tags: { 'building:part': 'yes'}, version: 1}),
            iD.Way({id: 'shelter', tags: {area: 'yes', amenity: 'shelter'}, version: 1}),
            iD.Way({id: 'garage1', tags: {area: 'yes', amenity: 'parking', parking: 'multi-storey'}, version: 1}),
            iD.Way({id: 'garage2', tags: {area: 'yes', amenity: 'parking', parking: 'sheds'}, version: 1}),
            iD.Way({id: 'garage3', tags: {area: 'yes', amenity: 'parking', parking: 'carports'}, version: 1}),
            iD.Way({id: 'garage4', tags: {area: 'yes', amenity: 'parking', parking: 'garage_boxes'}, version: 1}),

            // Landuse
            iD.Way({id: 'forest', tags: {area: 'yes', landuse: 'forest'}, version: 1}),
            iD.Way({id: 'scrub', tags: {area: 'yes', natural: 'scrub'}, version: 1}),
            iD.Way({id: 'industrial', tags: {area: 'yes', landuse: 'industrial'}, version: 1}),
            iD.Way({id: 'parkinglot', tags: {area: 'yes', amenity: 'parking', parking: 'surface'}, version: 1}),

            // Boundaries
            iD.Way({id: 'boundary', tags: {boundary: 'administrative'}, version: 1}),

            // Water
            iD.Way({id: 'water', tags: {area: 'yes', natural: 'water'}, version: 1}),
            iD.Way({id: 'coastline', tags: {natural: 'coastline'}, version: 1}),
            iD.Way({id: 'bay', tags: {area: 'yes', natural: 'bay'}, version: 1}),
            iD.Way({id: 'pond', tags: {area: 'yes', landuse: 'pond'}, version: 1}),
            iD.Way({id: 'basin', tags: {area: 'yes', landuse: 'basin'}, version: 1}),
            iD.Way({id: 'reservoir', tags: {area: 'yes', landuse: 'reservoir'}, version: 1}),
            iD.Way({id: 'salt_pond', tags: {area: 'yes', landuse: 'salt_pond'}, version: 1}),
            iD.Way({id: 'river', tags: {waterway: 'river'}, version: 1}),

            // Rail
            iD.Way({id: 'railway', tags: {railway: 'rail'}, version: 1}),
            iD.Way({id: 'rail_landuse', tags: {area: 'yes', landuse: 'railway'}, version: 1}),
            iD.Way({id: 'rail_disused', tags: {railway: 'disused'}, version: 1}),
            iD.Way({id: 'rail_streetcar', tags: {railway: 'tram', highway: 'residential'}, version: 1}),
            iD.Way({id: 'rail_trail', tags: {railway: 'disused', highway: 'cycleway'}, version: 1}),

            // Power
            iD.Way({id: 'power_line', tags: {power: 'line'}, version: 1}),

            // Past/Future
            iD.Way({id: 'motorway_construction', tags: {highway: 'construction', construction: 'motorway'}, version: 1}),
            iD.Way({id: 'cycleway_proposed', tags: {highway: 'proposed', proposed: 'cycleway'}, version: 1}),
            iD.Way({id: 'landuse_construction', tags: {area: 'yes', landuse: 'construction'}, version: 1}),

            // Others
            iD.Way({id: 'fence', tags: {barrier: 'fence'}, version: 1}),
            iD.Way({id: 'pipeline', tags: {man_made: 'pipeline'}, version: 1})
        ]);

        function doMatch(ids) {
            _.each(ids, function(id) {
                expect(features.isHidden(graph.entity(id)), id).to.be.true;
            });
        }

        function dontMatch(ids) {
            _.each(ids, function(id) {
                expect(features.isHidden(graph.entity(id)), id).to.be.false;
            });
        }


        it("matches points", function () {
            features.disable('points');

            doMatch([
                'point_bar', 'point_dock', 'point_rail_station',
                'point_generator', 'point_old_rail_station'
            ]);

            dontMatch([
                'motorway', 'service', 'path', 'building_yes',
                'forest', 'boundary', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);

            features.enable('points');
        });


        it("matches major roads", function () {
            features.disable('major_roads');

            doMatch([
                'motorway', 'motorway_link', 'trunk', 'trunk_link',
                'primary', 'primary_link', 'secondary', 'secondary_link',
                'tertiary', 'tertiary_link', 'residential'
            ]);

            dontMatch([
                'point_bar', 'service', 'path', 'building_yes',
                'forest', 'boundary', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);

            features.enable('major_roads');
        });


        it("matches minor roads", function () {
            features.disable('minor_roads');

            doMatch([
                'service', 'living_street', 'road', 'unclassified', 'track'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'path', 'building_yes',
                'forest', 'boundary', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);

            features.enable('minor_roads');
        });


        it("matches paths", function () {
            features.disable('paths');

            doMatch([
                'path', 'footway', 'cycleway', 'bridleway',
                'steps', 'pedestrian'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'service', 'building_yes',
                'forest', 'boundary', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);

            features.enable('paths');
        });


        it("matches buildings", function () {
            features.disable('buildings');

            doMatch([
                'building_yes', 'building_part', 'shelter',
                'garage1', 'garage2', 'garage3', 'garage4'
            ]);

            dontMatch([
                'building_no', 'point_bar', 'motorway', 'service', 'path',
                'forest', 'boundary', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);

            features.enable('buildings');
        });


        it("matches landuse", function () {
            features.disable('landuse');

            doMatch([
                'forest', 'scrub', 'industrial', 'parkinglot', 'building_no',
                'rail_landuse', 'landuse_construction'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'boundary', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);

            features.enable('landuse');
        });


        it("matches boundaries", function () {
            features.disable('boundaries');

            doMatch([
                'boundary'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'forest', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);

            features.enable('boundaries');
        });


        it("matches water", function () {
            features.disable('water');

            doMatch([
                'point_dock', 'water', 'coastline', 'bay', 'pond',
                'basin', 'reservoir', 'salt_pond', 'river'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'forest', 'boundary', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);

            features.enable('water');
        });


        it("matches rail", function () {
            features.disable('rail');

            doMatch([
                'point_rail_station', 'point_old_rail_station',
                'railway', 'rail_landuse', 'rail_disused'
            ]);

            dontMatch([
                'rail_streetcar', 'rail_trail',  // because rail also used as highway
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'forest', 'boundary', 'water', 'power_line',
                'motorway_construction', 'fence'
            ]);

            features.enable('rail');
        });


        it("matches power", function () {
            features.disable('power');

            doMatch([
                'point_generator', 'power_line'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'forest', 'boundary', 'water', 'railway',
                'motorway_construction', 'fence'
            ]);

            features.enable('power');
        });


        it("matches past/future", function () {
            features.disable('past_future');

            doMatch([
                'point_old_rail_station', 'rail_disused',
                'motorway_construction', 'cycleway_proposed', 'landuse_construction'
            ]);

            dontMatch([
                'rail_trail',  // because rail also used as highway
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'forest', 'boundary', 'water', 'railway', 'power_line', 'fence'
            ]);

            features.enable('past_future');
        });


        it("matches others", function () {
            features.disable('others');

            doMatch([
                'fence', 'pipeline'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'forest', 'boundary', 'water', 'railway', 'power_line',
                'motorway_construction',
            ]);

            features.enable('others');
        });

    });

    it('hides child vertices on a hidden way', function() {
        var a = iD.Node({id: 'a', version: 1}),
            b = iD.Node({id: 'b', version: 1}),
            w = iD.Way({id: 'w', nodes: [a.id, b.id], tags: {highway: 'path'}, version: 1}),
            graph = iD.Graph([a, b, w]);

        features.disable('paths');

        expect(features.isHiddenChild(graph.entity('a'))).to.be.true;
        expect(features.isHidden(graph.entity('a'))).to.be.true;

        features.enable('paths');
    });

    it('hides child ways on a hidden relation', function() {
        var a = iD.Node({id: 'a'}),
            b = iD.Node({id: 'b'}),
            c = iD.Node({id: 'c'}),
            d = iD.Node({id: 'd'}),
            e = iD.Node({id: 'e'}),
            f = iD.Node({id: 'f'}),
            outer = iD.Way({id: 'outer', nodes: [a.id, b.id, c.id, a.id], tags: {natural: 'wood'}}),
            inner = iD.Way({id: 'inner', nodes: [d.id, e.id, f.id, d.id]}),
            r = iD.Relation({members: [{id: outer.id, type: 'way'}, {id: inner.id, role: 'inner', type: 'way'}]}),
            graph = iD.Graph([a, b, c, d, e, f, outer, inner, r]);

        features.disable('landuse');

        expect(features.isHiddenChild(graph.entity('inner'))).to.be.true;
        expect(features.isHidden(graph.entity('inner'))).to.be.true;

        features.enable('landuse');
    });

});
