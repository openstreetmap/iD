describe('iD.ui.preset.access', function() {
    var selection, field;

    beforeEach(function() {
        selection = d3.select(document.createElement('div'));
        field = iD().presets().field('access');
    });

    it('creates inputs for a variety of modes of access', function() {
        var access = iD.ui.preset.access(field, {});
        selection.call(access);
        expect(selection.selectAll('.preset-access-access')[0].length).to.equal(1);
        expect(selection.selectAll('.preset-access-foot')[0].length).to.equal(1);
        expect(selection.selectAll('.preset-access-motor_vehicle')[0].length).to.equal(1);
        expect(selection.selectAll('.preset-access-bicycle')[0].length).to.equal(1);
        expect(selection.selectAll('.preset-access-horse')[0].length).to.equal(1);
    });

    it('does not include a "yes" option for general access (#934)', function() {
        var access = iD.ui.preset.access(field, {});
        expect(_.pluck(access.options('access'), 'value')).not.to.include('yes');
    });
});
