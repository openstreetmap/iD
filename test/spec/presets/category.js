describe('iD.presetCategory', function() {
    var category, residential;

    beforeEach(function() {
        category = {
            'geometry': 'line',
            'icon': 'highway',
            'name': 'roads',
            'members': [
                'highway/residential'
            ]
        };
        residential = iD.presetPreset('highway/residential', {
            tags: {
                highway: 'residential'
            },
            geometry: ['line']
        });
    });

    it('maps members names to preset instances', function() {
        var c = iD.presetCategory('road', category, iD.presetCollection([residential]));
        expect(c.members.collection[0]).to.eql(residential);
    });

    describe('#matchGeometry', function() {
        it('matches the type of an entity', function() {
            var c = iD.presetCategory('road', category, iD.presetCollection([residential]));
            expect(c.matchGeometry('line')).to.eql(true);
            expect(c.matchGeometry('point')).to.eql(false);
        });
    });
});
