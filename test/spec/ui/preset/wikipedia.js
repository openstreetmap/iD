describe('iD.ui.preset.wikipedia', function() {
    var entity, context, selection, field, wikiDelay, selectedId;

    function wikidataStub() {
        wikidataStub.itemsByTitle = function(lang, title, callback) {
            var data = {Q216353: {id: 'Q216353'}};
            if (wikiDelay) {
                window.setTimeout(function () { callback(title, data); }, wikiDelay);
            }
            else {
                callback(title, data);
            }
        }
        return wikidataStub;
    }

    function changeTags(changed) {
        var annotation = t('operations.change_tags.annotation');
        var tags = _.extend({}, entity.tags, changed);
        context.perform(iD.actions.ChangeTags(entity.id, tags), annotation);
    }

    beforeEach(function() {
        entity = iD.Node({id: 'n12345'});
        selectedId = entity.id;
        context = iD();
        context.history().merge([entity]);
        selection = d3.select(document.createElement('div'));
        field = context.presets(iD.data.presets).presets().field('wikipedia');
        wikiDelay = 0;

        sinon.stub(iD.services, 'wikidata', wikidataStub);
        sinon.stub(context, 'selectedIDs', function() { return [selectedId]; });
    });

    afterEach(function() {
        iD.services.wikidata.restore();
        context.selectedIDs.restore();
    });


    it('recognizes lang:title format', function() {
        var wikipedia = iD.ui.preset.wikipedia(field, context);
        selection.call(wikipedia);
        wikipedia.tags({wikipedia: 'en:Title'});
        expect(selection.selectAll('.wiki-lang').value()).to.equal('English');
        expect(selection.selectAll('.wiki-title').value()).to.equal('Title');
        expect(selection.selectAll('.wiki-link').attr('href')).to.equal('https://en.wikipedia.org/wiki/Title');
    });

    it('sets language, value, wikidata', function() {
        var wikipedia = iD.ui.preset.wikipedia(field, context).entity(entity);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);

        var spy = sinon.spy();
        wikipedia.on('change.spy', spy);
        selection.selectAll('.wiki-lang').value('Deutsch');
        happen.once(selection.selectAll('.wiki-lang').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-lang').node(), { type: 'blur' });
        expect(spy.callCount).to.equal(2);
        expect(spy.firstCall).to.have.been.calledWith({ wikipedia: undefined });   // on change
        expect(spy.secondCall).to.have.been.calledWith({ wikipedia: undefined });  // on blur

        spy = sinon.spy();
        wikipedia.on('change.spy', spy);
        selection.selectAll('.wiki-title').value('Title');
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'blur' });
        expect(spy.callCount).to.equal(3);
        expect(spy.firstCall).to.have.been.calledWith({ wikipedia: 'de:Title', wikidata: undefined });   // on change
        expect(spy.secondCall).to.have.been.calledWith({ wikipedia: 'de:Title', wikidata: 'Q216353' });  // wikidata async
        expect(spy.thirdCall).to.have.been.calledWith({ wikipedia: 'de:Title' });                        // on blur
    });

    it('recognizes pasted URLs', function() {
        var wikipedia = iD.ui.preset.wikipedia(field, context).entity(entity);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);

        selection.selectAll('.wiki-title').value('http://de.wikipedia.org/wiki/Title');
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
        expect(selection.selectAll('.wiki-lang').value()).to.equal('Deutsch');
        expect(selection.selectAll('.wiki-title').value()).to.equal('Title');
    });

    it('preserves existing language', function() {
        selection.call(iD.ui.preset.wikipedia(field, context));
        selection.selectAll('.wiki-lang').value('Deutsch');

        var wikipedia = iD.ui.preset.wikipedia(field, context);
        selection.call(wikipedia);
        wikipedia.tags({});

        expect(selection.selectAll('.wiki-lang').value()).to.equal('Deutsch');
    });

    it('does not set delayed wikidata tag if wikipedia field has changed', function(done) {
        var wikipedia = iD.ui.preset.wikipedia(field, context).entity(entity);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);
        wikiDelay = 20;

        var spy = sinon.spy();
        wikipedia.on('change.spy', spy);
        selection.selectAll('.wiki-lang').value('Deutsch');
        selection.selectAll('.wiki-title').value('Skip');
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'blur' });

        window.setTimeout(function() {
            selection.selectAll('.wiki-title').value('Title');
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
        }, 50);
    });

    it('does not set delayed wikidata tag if selected entity has changed', function(done) {
        var wikipedia = iD.ui.preset.wikipedia(field, context).entity(entity);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);
        wikiDelay = 20;

        var spy = sinon.spy();
        wikipedia.on('change.spy', spy);
        selection.selectAll('.wiki-lang').value('Deutsch');
        selection.selectAll('.wiki-title').value('Title');
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
        }, 50);
    });

});
