describe('Map', function() {
    var node, foo;

    beforeEach(function() {
        foo = document.body.appendChild(document.createElement('div'));
        foo.id = 'foo';
        map = iD.Map({
            selector: '#foo',
            connection: iD.Connection()
        });
    });

    afterEach(function() {
        foo.parentNode.removeChild(foo);
    });

    it('can set and get its zoom level', function() {
        expect(map.setZoom(4)).toEqual(map);
        expect(map.getZoom()).toEqual(4);
    });

    it('can zoom out and in', function() {
        expect(map.setZoom(4)).toEqual(map);
        expect(map.getZoom()).toEqual(4);
        expect(map.zoomOut()).toEqual(map);
        expect(map.getZoom()).toEqual(3);
        expect(map.zoomIn()).toEqual(map);
        expect(map.getZoom()).toEqual(4);
    });
});
