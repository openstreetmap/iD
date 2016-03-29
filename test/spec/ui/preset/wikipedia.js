describe('iD.ui.preset.wikipedia', function() {
    var selection, field;

    beforeEach(function() {
        selection = d3.select(document.createElement('div'));
        field = iD().presets(iD.data.presets).presets().field('wikipedia');
    });

    it('recognizes lang:title format', function() {
        var wikipedia = iD.ui.preset.wikipedia(field, {});
        selection.call(wikipedia);
        wikipedia.tags({wikipedia: 'en:Title'});
        expect(selection.selectAll('.wiki-lang').value()).to.equal('English');
        expect(selection.selectAll('.wiki-title').value()).to.equal('Title');
        expect(selection.selectAll('.wiki-link').attr('href')).to.equal('https://en.wikipedia.org/wiki/Title');
    });

    it('sets a new value', function() {
        var wikipedia = iD.ui.preset.wikipedia(field, {});
        selection.call(wikipedia);

        wikipedia.on('change', function(tags) {
            expect(tags).to.eql({wikipedia: undefined});
        });

        selection.selectAll('.wiki-lang').value('Deutsch');
        happen.once(selection.selectAll('.wiki-lang').node(), {type: 'change'});

        wikipedia.on('change', function(tags) {
            expect(tags).to.eql({wikipedia: 'de:Title'});
        });

        selection.selectAll('.wiki-title').value('Title');
        happen.once(selection.selectAll('.wiki-title').node(), {type: 'change'});
    });

    it('recognizes pasted URLs', function() {
        var wikipedia = iD.ui.preset.wikipedia(field, {});
        selection.call(wikipedia);

        selection.selectAll('.wiki-title').value('http://de.wikipedia.org/wiki/Title');
        happen.once(selection.selectAll('.wiki-title').node(), {type: 'change'});

        expect(selection.selectAll('.wiki-lang').value()).to.equal('Deutsch');
        expect(selection.selectAll('.wiki-title').value()).to.equal('Title');
    });

    it('preserves existing language', function() {
        selection.call(iD.ui.preset.wikipedia(field, {}));
        selection.selectAll('.wiki-lang').value('Deutsch');

        var wikipedia = iD.ui.preset.wikipedia(field, {});
        selection.call(wikipedia);
        wikipedia.tags({});

        expect(selection.selectAll('.wiki-lang').value()).to.equal('Deutsch');
    });
});
