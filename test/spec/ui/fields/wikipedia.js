describe('iD.uiFieldWikipedia', function() {
    var entity, context, selection, field;

    function changeTags(changed) {
        var e = context.entity(entity.id),
            annotation = 'Changed tags.',
            tags = _.clone(e.tags);

        _.forEach(changed, function(v, k) {
            if (v !== undefined || tags.hasOwnProperty(k)) {
                tags[k] = v;
            }
        });

        if (!_.isEqual(e.tags, tags)) {
            context.perform(iD.actionChangeTags(e.id, tags), annotation);
        }
    }

    before(function() {
        iD.services.wikipedia = iD.serviceWikipedia;
        iD.services.wikidata = iD.serviceWikidata;
    });

    after(function() {
        delete iD.services.wikipedia;
        delete iD.services.wikidata;
    });

    beforeEach(function() {
        entity = iD.Node({id: 'n12345'});
        context = iD.Context();
        context.history().merge([entity]);
        selection = d3.select(document.createElement('div'));
        field = context.presets().field('wikipedia');
        window.JSONP_DELAY = 0;
        window.JSONP_FIX = {
            entities: {
                Q216353: { id: 'Q216353' }
            }
        };
    });

    afterEach(function() {
        window.JSONP_FIX = undefined;
    });

    it('recognizes lang:title format', function() {
        var wikipedia = iD.uiFieldWikipedia(field, context);
        selection.call(wikipedia);
        wikipedia.tags({wikipedia: 'en:Title'});

        expect(iD.utilGetSetValue(selection.selectAll('.wiki-lang'))).to.equal('English');
        expect(iD.utilGetSetValue(selection.selectAll('.wiki-title'))).to.equal('Title');
    });

    it('sets language, value', function() {
        var wikipedia = iD.uiFieldWikipedia(field, context).entity(entity);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);

        var spy = sinon.spy();
        wikipedia.on('change.spy', spy);

        iD.utilGetSetValue(selection.selectAll('.wiki-lang'), 'Deutsch');
        happen.once(selection.selectAll('.wiki-lang').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-lang').node(), { type: 'blur' });

        iD.utilGetSetValue(selection.selectAll('.wiki-title'), 'Title');
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'blur' });

        expect(spy.callCount).to.equal(4);
        expect(spy.getCall(0)).to.have.been.calledWith({ wikipedia: undefined, wikidata: undefined });  // lang on change
        expect(spy.getCall(1)).to.have.been.calledWith({ wikipedia: undefined, wikidata: undefined });  // lang on blur
        expect(spy.getCall(2)).to.have.been.calledWith({ wikipedia: 'de:Title' });   // title on change
        expect(spy.getCall(3)).to.have.been.calledWith({ wikipedia: 'de:Title' });   // title on blur
    });

    it('recognizes pasted URLs', function() {
        var wikipedia = iD.uiFieldWikipedia(field, context).entity(entity);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);

        iD.utilGetSetValue(selection.selectAll('.wiki-title'), 'http://de.wikipedia.org/wiki/Title');
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });

        expect(iD.utilGetSetValue(selection.selectAll('.wiki-lang'))).to.equal('Deutsch');
        expect(iD.utilGetSetValue(selection.selectAll('.wiki-title'))).to.equal('Title');
    });

    it('preserves existing language', function() {
        selection.call(iD.uiFieldWikipedia(field, context));
        iD.utilGetSetValue(selection.selectAll('.wiki-lang'), 'Deutsch');

        var wikipedia = iD.uiFieldWikipedia(field, context);
        selection.call(wikipedia);
        wikipedia.tags({});

        expect(iD.utilGetSetValue(selection.selectAll('.wiki-lang'))).to.equal('Deutsch');
    });

    it('does not set delayed wikidata tag if graph has changed', function(done) {
        var wikipedia = iD.uiFieldWikipedia(field, context).entity(entity);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);
        window.JSONP_DELAY = 60;

        var spy = sinon.spy();
        wikipedia.on('change.spy', spy);

        // Set title to "Skip"
        iD.utilGetSetValue(selection.selectAll('.wiki-lang'), 'Deutsch');
        iD.utilGetSetValue(selection.selectAll('.wiki-title'), 'Skip');
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'blur' });

        // t0
        expect(context.entity(entity.id).tags.wikidata).to.be.undefined;

        // t30:  graph change - Set title to "Title"
        window.setTimeout(function() {
            iD.utilGetSetValue(selection.selectAll('.wiki-title'), 'Title');
            happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
            happen.once(selection.selectAll('.wiki-title').node(), { type: 'blur' });
        }, 30);

        // t60:  at t0 + 60ms (JSONP_DELAY), wikidata SHOULD NOT be set because graph has changed.

        // t70:  check that wikidata unchanged
        window.setTimeout(function() {
            expect(context.entity(entity.id).tags.wikidata).to.be.undefined;
        }, 70);

        // t90:  at t30 + 60ms (JSONP_DELAY), wikidata SHOULD be set because graph is unchanged.

        // t100:  check that wikidata has changed
        window.setTimeout(function() {
            expect(context.entity(entity.id).tags.wikidata).to.equal('Q216353');

            expect(spy.callCount).to.equal(4);
            expect(spy.getCall(0)).to.have.been.calledWith({ wikipedia: 'de:Skip' });   // 'Skip' on change
            expect(spy.getCall(1)).to.have.been.calledWith({ wikipedia: 'de:Skip' });   // 'Skip' on blur
            expect(spy.getCall(2)).to.have.been.calledWith({ wikipedia: 'de:Title' });  // 'Title' on change +10ms
            expect(spy.getCall(3)).to.have.been.calledWith({ wikipedia: 'de:Title' });  // 'Title' on blur   +10ms
            done();
        }, 100);

    });
});
