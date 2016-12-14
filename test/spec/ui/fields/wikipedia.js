describe('iD.uiFieldWikipedia', function() {
    var entity, context, selection, field, selectedId;


    function changeTags(changed) {
        var annotation = 'Changed tags.';
        var tags = _.extend({}, entity.tags, changed);
        context.perform(iD.actionChangeTags(entity.id, tags), annotation);
    }

    beforeEach(function() {
        entity = iD.Node({id: 'n12345'});
        selectedId = entity.id;
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

        sinon.stub(context, 'selectedIDs', function() { return [selectedId]; });
    });

    afterEach(function() {
        window.JSONP_FIX = undefined;
        context.selectedIDs.restore();
    });

    it('recognizes lang:title format', function() {
        var wikipedia = iD.uiFieldWikipedia(field, context);
        selection.call(wikipedia);
        wikipedia.tags({wikipedia: 'en:Title'});
        expect(iD.utilGetSetValue(selection.selectAll('.wiki-lang'))).to.equal('English');
        expect(iD.utilGetSetValue(selection.selectAll('.wiki-title'))).to.equal('Title');
        expect(selection.selectAll('.wiki-link').attr('href')).to.equal('https://en.wikipedia.org/wiki/Title');
    });

    it('sets language, value, wikidata', function() {
        var wikipedia = iD.uiFieldWikipedia(field, context).entity(entity);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);

        var spy = sinon.spy();
        wikipedia.on('change.spy', spy);
        iD.utilGetSetValue(selection.selectAll('.wiki-lang'), 'Deutsch');
        happen.once(selection.selectAll('.wiki-lang').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-lang').node(), { type: 'blur' });
        expect(spy.callCount).to.equal(2);
        expect(spy.firstCall).to.have.been.calledWith({ wikipedia: undefined });   // on change
        expect(spy.secondCall).to.have.been.calledWith({ wikipedia: undefined });  // on blur

        spy = sinon.spy();
        wikipedia.on('change.spy', spy);
        iD.utilGetSetValue(selection.selectAll('.wiki-title'), 'Title');
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'blur' });
        expect(spy.callCount).to.equal(3);
        expect(spy.firstCall).to.have.been.calledWith({ wikipedia: 'de:Title', wikidata: undefined });   // on change
        expect(spy.secondCall).to.have.been.calledWith({ wikipedia: 'de:Title', wikidata: 'Q216353' });  // wikidata async
        expect(spy.thirdCall).to.have.been.calledWith({ wikipedia: 'de:Title' });                        // on blur
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

    it('does not set delayed wikidata tag if wikipedia field has changed', function(done) {
        var wikipedia = iD.uiFieldWikipedia(field, context).entity(entity);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);
        window.JSONP_DELAY = 20;

        var spy = sinon.spy();
        wikipedia.on('change.spy', spy);
        iD.utilGetSetValue(selection.selectAll('.wiki-lang'), 'Deutsch');
        iD.utilGetSetValue(selection.selectAll('.wiki-title'), 'Skip');
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'blur' });

        window.setTimeout(function() {
            iD.utilGetSetValue(selection.selectAll('.wiki-title'), 'Title');
            happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
            happen.once(selection.selectAll('.wiki-title').node(), { type: 'blur' });
        }, 10);

        window.setTimeout(function() {
            expect(spy.callCount).to.equal(5);
            expect(spy.getCall(0)).to.have.been.calledWith({ wikipedia: 'de:Skip', wikidata: undefined });   // 'Skip' on change
            expect(spy.getCall(1)).to.have.been.calledWith({ wikipedia: 'de:Skip' });                        // 'Skip' on blur
            expect(spy.getCall(2)).to.have.been.calledWith({ wikipedia: 'de:Title', wikidata: undefined });  // 'Title' on change +10ms
            expect(spy.getCall(3)).to.have.been.calledWith({ wikipedia: 'de:Title' });                       // 'Title' on blur   +10ms
            // skip delayed wikidata for 'Skip'                                                              // 'Skip' wikidata +20ms
            expect(spy.getCall(4)).to.have.been.calledWith({ wikipedia: 'de:Title', wikidata: 'Q216353' });  // 'Title' wikidata +40ms
            done();
        }, 100);
    });

    it('does not set delayed wikidata tag if selected entity has changed', function(done) {
        var wikipedia = iD.uiFieldWikipedia(field, context).entity(entity);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);
        window.JSONP_DELAY = 20;

        var spy = sinon.spy();
        wikipedia.on('change.spy', spy);
        iD.utilGetSetValue(selection.selectAll('.wiki-lang'), 'Deutsch');
        iD.utilGetSetValue(selection.selectAll('.wiki-title'), 'Title');
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'blur' });

        window.setTimeout(function() {
            selectedId = 'w-123';   // user clicked on something else..
        }, 10);

        window.setTimeout(function() {
            expect(spy.callCount).to.equal(2);
            expect(spy.getCall(0)).to.have.been.calledWith({ wikipedia: 'de:Title', wikidata: undefined });  // 'Title' on change
            expect(spy.getCall(1)).to.have.been.calledWith({ wikipedia: 'de:Title' });                       // 'Title' on blur
            // wikidata tag not changed because another entity is now selected
            done();
        }, 100);
    });

});
