describe('iD.Features', function() {
    var dimensions = [1000, 1000],
        context,
        features;

    beforeEach(function() {
        context = iD();
        context.map().zoom(16);
        features = iD.Features(context);
    });

    describe('#keys', function() {
        it('returns feature keys', function() {
            var keys = features.keys();
            expect(keys).to.include(
                'points', 'traffic_roads', 'service_roads', 'paths',
                'buildings', 'landuse', 'boundaries', 'water', 'rail',
                'power', 'past_future', 'others'
            );
        });
    });

    describe('#disable', function() {
        it('disables features', function() {
            features.disable('water');
            expect(features.disabled()).to.include('water');
            expect(features.enabled()).to.not.include('water');
        });
    });

    describe('#enable', function() {
        it('enables features', function() {
            features.disable('water');
            features.enable('water');
            expect(features.disabled()).to.not.include('water');
            expect(features.enabled()).to.include('water');
        });
    });

    describe('#toggle', function() {
        it('toggles features', function() {
            features.toggle('water');
            expect(features.disabled()).to.include('water');
            expect(features.enabled()).to.not.include('water');

            features.toggle('water');
            expect(features.disabled()).to.not.include('water');
            expect(features.enabled()).to.include('water');
        });
    });

    describe('#gatherStats', function() {
        it('counts features', function() {
            var graph = iD.Graph([
                    iD.Node({id: 'point_bar', tags: {amenity: 'bar'}, version: 1}),
                    iD.Node({id: 'point_dock', tags: {waterway: 'dock'}, version: 1}),
                    iD.Node({id: 'point_rail_station', tags: {railway: 'station'}, version: 1}),
                    iD.Node({id: 'point_generator', tags: {power: 'generator'}, version: 1}),
                    iD.Node({id: 'point_old_rail_station', tags: {railway: 'station', disused: 'yes'}, version: 1}),
                    iD.Way({id: 'motorway', tags: {highway: 'motorway'}, version: 1}),
                    iD.Way({id: 'building_yes', tags: {area: 'yes', amenity: 'school', building: 'yes'}, version: 1}),
                    iD.Way({id: 'boundary', tags: {boundary: 'administrative'}, version: 1}),
                    iD.Way({id: 'fence', tags: {barrier: 'fence'}, version: 1})
                ]),
                all = _.values(graph.base().entities),
                stats;

            features.gatherStats(all, graph, dimensions);
            stats = features.stats();

            expect(stats.boundaries).to.eql(1);
            expect(stats.buildings).to.eql(1);
            expect(stats.landuse).to.eql(0);
            expect(stats.traffic_roads).to.eql(1);
            expect(stats.service_roads).to.eql(0);
            expect(stats.others).to.eql(1);
            expect(stats.past_future).to.eql(1);
            expect(stats.paths).to.eql(0);
            expect(stats.points).to.eql(5);
            expect(stats.power).to.eql(1);
            expect(stats.rail).to.eql(2);
            expect(stats.water).to.eql(1);
        });
    });

    describe("matching", function() {
        var graph = iD.Graph([
            // Points
            iD.Node({id: 'point_bar', tags: {amenity: 'bar'}, version: 1}),
            iD.Node({id: 'point_dock', tags: {waterway: 'dock'}, version: 1}),
            iD.Node({id: 'point_rail_station', tags: {railway: 'station'}, version: 1}),
            iD.Node({id: 'point_generator', tags: {power: 'generator'}, version: 1}),
            iD.Node({id: 'point_old_rail_station', tags: {railway: 'station', disused: 'yes'}, version: 1}),

            // Traffic Roads
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
            iD.Way({id: 'unclassified', tags: {highway: 'unclassified'}, version: 1}),
            iD.Way({id: 'living_street', tags: {highway: 'living_street'}, version: 1}),

            // Service Roads
            iD.Way({id: 'service', tags: {highway: 'service'}, version: 1}),
            iD.Way({id: 'road', tags: {highway: 'road'}, version: 1}),
            iD.Way({id: 'track', tags: {highway: 'track'}, version: 1}),

            // Paths
            iD.Way({id: 'path', tags: {highway: 'path'}, version: 1}),
            iD.Way({id: 'footway', tags: {highway: 'footway'}, version: 1}),
            iD.Way({id: 'cycleway', tags: {highway: 'cycleway'}, version: 1}),
            iD.Way({id: 'bridleway', tags: {highway: 'bridleway'}, version: 1}),
            iD.Way({id: 'steps', tags: {highway: 'steps'}, version: 1}),
            iD.Way({id: 'pedestrian', tags: {highway: 'pedestrian'}, version: 1}),
            iD.Way({id: 'corridor', tags: {highway: 'corridor'}, version: 1}),

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

            // Landuse Multipolygon
            iD.Way({id: 'outer', version: 1}),
            iD.Way({id: 'inner1', version: 1}),
            iD.Way({id: 'inner2', tags: {barrier: 'fence'}, version: 1}),
            iD.Way({id: 'inner3', tags: {highway: 'residential'}, version: 1}),
            iD.Relation({id: 'retail', tags: {landuse: 'retail', type: 'multipolygon'},
                    members: [
                        {id: 'outer', role: 'outer', type: 'way'},
                        {id: 'inner1', role: 'inner', type: 'way'},
                        {id: 'inner2', role: 'inner', type: 'way'},
                        {id: 'inner3', role: 'inner', type: 'way'}
                    ],
                    version: 1
                }),

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
            iD.Way({id: 'pipeline', tags: {man_made: 'pipeline'}, version: 1}),

            // Site relation
            iD.Relation({id: 'site', tags: {type: 'site'},
                    members: [
                        {id: 'fence', role: 'perimeter'},
                        {id: 'building_yes'}
                    ],
                    version: 1
                }),

        ]),
        all = _.values(graph.base().entities);


        function doMatch(ids) {
            _.each(ids, function(id) {
                var entity = graph.entity(id),
                    geometry = entity.geometry(graph);
                expect(features.isHidden(entity, graph, geometry), 'doMatch: ' + id).to.be.true;
            });
        }

        function dontMatch(ids) {
            _.each(ids, function(id) {
                var entity = graph.entity(id),
                    geometry = entity.geometry(graph);
                expect(features.isHidden(entity, graph, geometry), 'dontMatch: ' + id).to.be.false;
            });
        }


        it("matches points", function () {
            features.disable('points');
            features.gatherStats(all, graph, dimensions);

            doMatch([
                'point_bar', 'point_dock', 'point_rail_station',
                'point_generator', 'point_old_rail_station'
            ]);

            dontMatch([
                'motorway', 'service', 'path', 'building_yes',
                'forest', 'boundary', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);
        });


        it("matches traffic roads", function () {
            features.disable('traffic_roads');
            features.gatherStats(all, graph, dimensions);

            doMatch([
                'motorway', 'motorway_link', 'trunk', 'trunk_link',
                'primary', 'primary_link', 'secondary', 'secondary_link',
                'tertiary', 'tertiary_link', 'residential', 'living_street',
                'unclassified', 'inner3'
            ]);

            dontMatch([
                'point_bar', 'service', 'road', 'track', 'path', 'building_yes',
                'forest', 'boundary', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);
        });


        it("matches service roads", function () {
            features.disable('service_roads');
            features.gatherStats(all, graph, dimensions);

            doMatch([
                'service', 'road', 'track'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'unclassified', 'living_street',
                'path', 'building_yes', 'forest', 'boundary', 'water',
                'railway', 'power_line', 'motorway_construction', 'fence'
            ]);
        });


        it("matches paths", function () {
            features.disable('paths');
            features.gatherStats(all, graph, dimensions);

            doMatch([
                'path', 'footway', 'cycleway', 'bridleway',
                'steps', 'pedestrian', 'corridor'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'service', 'building_yes',
                'forest', 'boundary', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);
        });


        it("matches buildings", function () {
            features.disable('buildings');
            features.gatherStats(all, graph, dimensions);

            doMatch([
                'building_yes', 'building_part', 'shelter',
                'garage1', 'garage2', 'garage3', 'garage4'
            ]);

            dontMatch([
                'building_no', 'point_bar', 'motorway', 'service', 'path',
                'forest', 'boundary', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);
        });


        it("matches landuse", function () {
            features.disable('landuse');
            features.gatherStats(all, graph, dimensions);

            doMatch([
                'forest', 'scrub', 'industrial', 'parkinglot', 'building_no',
                'rail_landuse', 'landuse_construction', 'retail',
                'outer', 'inner1', 'inner2'  // non-interesting members of landuse multipolygon
            ]);

            dontMatch([
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'boundary', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence',
                'inner3'   // member of landuse multipolygon, but tagged as highway
            ]);
        });


        it("matches boundaries", function () {
            features.disable('boundaries');
            features.gatherStats(all, graph, dimensions);

            doMatch([
                'boundary'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'forest', 'water', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);
        });


        it("matches water", function () {
            features.disable('water');
            features.gatherStats(all, graph, dimensions);

            doMatch([
                'point_dock', 'water', 'coastline', 'bay', 'pond',
                'basin', 'reservoir', 'salt_pond', 'river'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'forest', 'boundary', 'railway', 'power_line',
                'motorway_construction', 'fence'
            ]);
        });


        it("matches rail", function () {
            features.disable('rail');
            features.gatherStats(all, graph, dimensions);

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
        });


        it("matches power", function () {
            features.disable('power');
            features.gatherStats(all, graph, dimensions);

            doMatch([
                'point_generator', 'power_line'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'forest', 'boundary', 'water', 'railway',
                'motorway_construction', 'fence'
            ]);
        });


        it("matches past/future", function () {
            features.disable('past_future');
            features.gatherStats(all, graph, dimensions);

            doMatch([
                'point_old_rail_station', 'rail_disused',
                'motorway_construction', 'cycleway_proposed', 'landuse_construction'
            ]);

            dontMatch([
                'rail_trail',  // because rail also used as highway
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'forest', 'boundary', 'water', 'railway', 'power_line', 'fence'
            ]);
        });


        it("matches others", function () {
            features.disable('others');
            features.gatherStats(all, graph, dimensions);

            doMatch([
                'fence', 'pipeline'
            ]);

            dontMatch([
                'point_bar', 'motorway', 'service', 'path', 'building_yes',
                'forest', 'boundary', 'water', 'railway', 'power_line',
                'motorway_construction', 'retail', 'outer', 'inner1', 'inner2', 'inner3'
            ]);
        });
    });


    describe('hiding', function() {
        it('hides child vertices on a hidden way', function() {
            var a = iD.Node({id: 'a', version: 1}),
                b = iD.Node({id: 'b', version: 1}),
                w = iD.Way({id: 'w', nodes: [a.id, b.id], tags: {highway: 'path'}, version: 1}),
                graph = iD.Graph([a, b, w]),
                geometry = a.geometry(graph),
                all = _.values(graph.base().entities);

            features.disable('paths');
            features.gatherStats(all, graph, dimensions);

            expect(features.isHiddenChild(a, graph, geometry)).to.be.true;
            expect(features.isHiddenChild(b, graph, geometry)).to.be.true;
            expect(features.isHidden(a, graph, geometry)).to.be.true;
            expect(features.isHidden(b, graph, geometry)).to.be.true;
        });

        it('hides uninteresting (e.g. untagged or "other") member ways on a hidden multipolygon relation', function() {
            var outer = iD.Way({id: 'outer', tags: {area: 'yes', natural: 'wood'}, version: 1}),
                inner1 = iD.Way({id: 'inner1', tags: {barrier: 'fence'}, version: 1}),
                inner2 = iD.Way({id: 'inner2', version: 1}),
                inner3 = iD.Way({id: 'inner3', tags: {highway: 'residential'}, version: 1}),
                r = iD.Relation({
                    id: 'r',
                    tags: {type: 'multipolygon'},
                    members: [
                        {id: outer.id, role: 'outer', type: 'way'},
                        {id: inner1.id, role: 'inner', type: 'way'},
                        {id: inner2.id, role: 'inner', type: 'way'},
                        {id: inner3.id, role: 'inner', type: 'way'}
                    ],
                    version: 1
                }),
                graph = iD.Graph([outer, inner1, inner2, inner3, r]),
                all = _.values(graph.base().entities);

            features.disable('landuse');
            features.gatherStats(all, graph, dimensions);

            expect(features.isHidden(outer, graph, outer.geometry(graph))).to.be.true;     // #2548
            expect(features.isHidden(inner1, graph, inner1.geometry(graph))).to.be.true;   // #2548
            expect(features.isHidden(inner2, graph, inner2.geometry(graph))).to.be.true;   // #2548
            expect(features.isHidden(inner3, graph, inner3.geometry(graph))).to.be.false;  // #2887
        });

        it('hides only versioned entities', function() {
            var a = iD.Node({id: 'a', version: 1}),
                b = iD.Node({id: 'b'}),
                graph = iD.Graph([a, b]),
                ageo = a.geometry(graph),
                bgeo = b.geometry(graph),
                all = _.values(graph.base().entities);

            features.disable('points');
            features.gatherStats(all, graph, dimensions);

            expect(features.isHidden(a, graph, ageo)).to.be.true;
            expect(features.isHidden(b, graph, bgeo)).to.be.false;
        });

        it('auto-hides features', function() {
            var graph = iD.Graph([]),
                maxPoints = 200,
                all, hidden, autoHidden, i, msg;

            for (i = 0; i < maxPoints; i++) {
                graph.rebase([iD.Node({version: 1})], [graph]);
            }

            all = _.values(graph.base().entities);
            features.gatherStats(all, graph, dimensions);
            hidden = features.hidden();
            autoHidden = features.autoHidden();
            msg = i + ' points';

            expect(hidden, msg).to.not.include('points');
            expect(autoHidden, msg).to.not.include('points');

            graph.rebase([iD.Node({version: 1})], [graph]);

            all = _.values(graph.base().entities);
            features.gatherStats(all, graph, dimensions);
            hidden = features.hidden();
            autoHidden = features.autoHidden();
            msg = ++i + ' points';

            expect(hidden, msg).to.include('points');
            expect(autoHidden, msg).to.include('points');
        });

        it('doubles auto-hide threshold when doubling viewport size', function() {
            var graph = iD.Graph([]),
                maxPoints = 400,
                dimensions = [2000, 1000],
                all, hidden, autoHidden, i, msg;

            for (i = 0; i < maxPoints; i++) {
                graph.rebase([iD.Node({version: 1})], [graph]);
            }

            all = _.values(graph.base().entities);
            features.gatherStats(all, graph, dimensions);
            hidden = features.hidden();
            autoHidden = features.autoHidden();
            msg = i + ' points';

            expect(hidden, msg).to.not.include('points');
            expect(autoHidden, msg).to.not.include('points');

            graph.rebase([iD.Node({version: 1})], [graph]);

            all = _.values(graph.base().entities);
            features.gatherStats(all, graph, dimensions);
            hidden = features.hidden();
            autoHidden = features.autoHidden();
            msg = ++i + ' points';

            expect(hidden, msg).to.include('points');
            expect(autoHidden, msg).to.include('points');
        });
    });

});
