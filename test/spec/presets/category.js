describe('iD.presetCategory', function() {
    const category = {
        'geometry': 'line',
        'icon': 'highway',
        'name': 'roads',
        'members': [ 'highway/residential' ]
    };

    const residential = iD.presetPreset('highway/residential',
        { tags: { highway: 'residential' }, geometry: ['line'] }
    );
    const allPresets = { 'highway/residential': residential };


    it('maps members names to preset instances', function() {
        const c = iD.presetCategory('road', category, allPresets);
        expect(c.members.collection[0]).to.eql(residential);
    });

    describe('#matchGeometry', function() {
        it('matches the type of an entity', function() {
            const c = iD.presetCategory('road', category, allPresets);
            expect(c.matchGeometry('line')).to.eql(true);
            expect(c.matchGeometry('point')).to.eql(false);
        });
    });
});
