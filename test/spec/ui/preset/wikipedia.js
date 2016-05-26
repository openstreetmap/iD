describe('iD.ui.preset.wikipedia', function() {
    var entity, context, selection, field, entity;

    beforeEach(function() {
        entity = iD.Node({id: 'n12345'});
        context = iD();
        context.history().merge([entity]);
        selection = d3.select(document.createElement('div'));
        field = context.presets(iD.data.presets).presets().field('wikipedia');
    });

    it('recognizes lang:title format', function() {
        var wikipedia = iD.ui.preset.wikipedia(field, context).entity(entity);
        selection.call(wikipedia);
        wikipedia.tags({wikipedia: 'en:Title'});
        expect(selection.selectAll('.wiki-lang').value()).to.equal('English');
        expect(selection.selectAll('.wiki-title').value()).to.equal('Title');
        expect(selection.selectAll('.wiki-link').attr('href')).to.equal('https://en.wikipedia.org/wiki/Title');
    });

    it('sets a new value', function() {
        var wikipedia = iD.ui.preset.wikipedia(field, context).entity(entity);
        selection.call(wikipedia);

        wikipedia.on('change', function(tags) {
            expect(tags).to.eql({wikipedia: undefined, wikidata: undefined});
        });

        selection.selectAll('.wiki-lang').value('Deutsch');
        happen.once(selection.selectAll('.wiki-lang').node(), {type: 'change'});

        wikipedia.on('change', function(tags) {
            expect(tags).to.satisfy(function (tags) {
                return tags.wikipedia === 'de:Title' || 'wikidata' in tags;
            });
        });

        selection.selectAll('.wiki-title').value('Title');
        happen.once(selection.selectAll('.wiki-title').node(), {type: 'change'});
    });

    it('recognizes pasted URLs', function() {
        var wikipedia = iD.ui.preset.wikipedia(field, context).entity(entity);
        selection.call(wikipedia);

        selection.selectAll('.wiki-title').value('http://de.wikipedia.org/wiki/Title');
        happen.once(selection.selectAll('.wiki-title').node(), {type: 'change'});

        expect(selection.selectAll('.wiki-lang').value()).to.equal('Deutsch');
        expect(selection.selectAll('.wiki-title').value()).to.equal('Title');
    });

    it('preserves existing language', function() {
        selection.call(iD.ui.preset.wikipedia(field, context).entity(entity));
        selection.selectAll('.wiki-lang').value('Deutsch');

        var wikipedia = iD.ui.preset.wikipedia(field, context).entity(entity);
        selection.call(wikipedia);
        wikipedia.tags({});

        expect(selection.selectAll('.wiki-lang').value()).to.equal('Deutsch');
    });
});
