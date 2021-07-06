describe('iD.presetCategory', function() {
    var category = {
        'geometry': 'line',
        'icon': 'highway',
        'name': 'roads',
        'members': [ 'highway/residential' ]
    };

    var residential = iD.presetPreset('highway/residential',
        { tags: { highway: 'residential' }, geometry: ['line'] }
    );
    var allPresets = { 'highway/residential': residential };


    it('maps members names to preset instances', function() {
        var c = iD.presetCategory('road', category, allPresets);
        expect(c.members.collection[0]).to.eql(residential);
    });

    describe('#matchGeometry', function() {
        it('matches the type of an entity', function() {
            var c = iD.presetCategory('road', category, allPresets);
            expect(c.matchGeometry('line')).to.eql(true);
            expect(c.matchGeometry('point')).to.eql(false);
        });
    });
});
