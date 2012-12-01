describe('Map', function() {
    var map, foo;

    beforeEach(function() {
        foo = document.body.appendChild(document.createElement('div'));
        foo.id = 'foo';
        map = iD.Map(d3.select('#foo').node());
    });

    afterEach(function() {
        foo.parentNode.removeChild(foo);
    });

    describe('#zoom', function() {
        it('gets and sets zoom level', function() {
            expect(map.zoom(4)).toEqual(map);
            expect(map.zoom()).toEqual(4);
        });
    });

    describe('#zoomIn', function() {
        it('increments zoom', function() {
            expect(map.zoom(4)).toEqual(map);
            expect(map.zoomIn()).toEqual(map);
            expect(map.zoom()).toEqual(5);
        });
    });

    describe('#zoomOut', function() {
        it('decrements zoom', function() {
            expect(map.zoom(4)).toEqual(map);
            expect(map.zoomOut()).toEqual(map);
            expect(map.zoom()).toEqual(3);
        });
    });

    describe('#center', function() {
        it('gets and sets center', function() {
            expect(map.center([0, 0])).toEqual(map);
            expect(map.center()).toEqual([0, 0]);
            expect(map.center([10, 15])).toEqual(map);
            expect(map.center()[0]).toBeCloseTo(10);
            expect(map.center()[1]).toBeCloseTo(15);
        });
    });

    describe('#extent', function() {
        it('reports extent', function() {
            expect(map.size([100, 100])).toEqual(map);
            expect(map.center([0, 0])).toEqual(map);
            expect(map.extent()[0][0]).toBeCloseTo(-36);
            expect(map.extent()[1][0]).toBeCloseTo(36);
        });
    });
});
