import { setTimeout } from 'node:timers/promises';
import { fn } from '@vitest/spy';

describe('iD.uiFieldWikipedia', function() {
    var entity, context, selection, field;

    before(function() {
        iD.fileFetcher.cache().wmf_sitematrix = [
          ['German','Deutsch','de'],
          ['English','English','en']
        ];
        iD.services.wikipedia = iD.serviceWikipedia;
        iD.services.wikidata = iD.serviceWikidata;
    });

    after(function() {
        delete iD.fileFetcher.cache().wmf_sitematrix;
        delete iD.services.wikipedia;
        delete iD.services.wikidata;
    });

    beforeEach(function() {
        entity = new iD.osmNode({id: 'n12345'});
        context = iD.coreContext().assetPath('../dist/').init();
        context.history().merge([entity]);
        selection = d3.select(document.createElement('div'));
        field = iD.presetField('wikipedia', {
            key: 'wikipedia',
            keys: ['wikipedia', 'wikidata'],
            type: 'wikipedia'
        });
        fetchMock.reset();
        fetchMock.mock(new RegExp('\/w\/api\.php.*action=wbgetentities'), {
            body: '{"entities":{"Q216353":{"id":"Q216353"}}}',
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    });

    afterEach(function() {
        fetchMock.reset();
    });


    function changeTags(changed) {
        var e = context.entity(entity.id);
        var annotation = 'Changed tags.';
        var tags = JSON.parse(JSON.stringify(e.tags));   // deep copy
        var didChange = false;

        for (var k in changed) {
            if (changed.hasOwnProperty(k)) {
                var v = changed[k];
                if (tags[k] !== v && (v !== undefined || tags.hasOwnProperty(k))) {
                    tags[k] = v;
                    didChange = true;
                }
            }
        }

        if (didChange) {
            context.perform(iD.actionChangeTags(e.id, tags), annotation);
        }
    }

    it('recognizes lang:title format', async () => {
        var wikipedia = iD.uiFieldWikipedia(field, context);
        await setTimeout(20);
        selection.call(wikipedia);
        wikipedia.tags({wikipedia: 'en:Title'});

        expect(iD.utilGetSetValue(selection.selectAll('.wiki-lang'))).toEqual('English');
        expect(iD.utilGetSetValue(selection.selectAll('.wiki-title'))).toEqual('Title');
    });

    it('sets language, value', async () => {
        var wikipedia = iD.uiFieldWikipedia(field, context).entityIDs([entity.id]);
        await setTimeout(20);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);

        const spy = fn();
        wikipedia.on('change.spy', spy);

        iD.utilGetSetValue(selection.selectAll('.wiki-lang'), 'Deutsch');
        happen.once(selection.selectAll('.wiki-lang').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-lang').node(), { type: 'blur' });

        iD.utilGetSetValue(selection.selectAll('.wiki-title'), 'Title');
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'blur' });

        expect(spy).to.have.callCount(4);
        expect(spy).toHaveBeenCalledWith({ wikipedia: undefined});  // lang on change
        expect(spy).toHaveBeenCalledWith({ wikipedia: undefined});  // lang on blur
        expect(spy).toHaveBeenCalledWith({ wikipedia: 'de:Title' });   // title on change
        expect(spy).toHaveBeenCalledWith({ wikipedia: 'de:Title' });   // title on blur
    });

    it('recognizes pasted URLs', async () => {
        var wikipedia = iD.uiFieldWikipedia(field, context).entityIDs([entity.id]);
        await setTimeout(20);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);

        iD.utilGetSetValue(selection.selectAll('.wiki-title'), 'http://de.wikipedia.org/wiki/Title');
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });

        expect(iD.utilGetSetValue(selection.selectAll('.wiki-lang'))).toEqual('Deutsch');
        expect(iD.utilGetSetValue(selection.selectAll('.wiki-title'))).toEqual('Title');
    });

    describe('encodePath', function() {
        it('returns an encoded URI component that contains the title with spaces replaced by underscores', () => {
            var wikipedia = iD.uiFieldWikipedia(field, context).entityIDs([entity.id]);
            expect(wikipedia.encodePath('? (film)', undefined)).toEqual('%3F_(film)');
        });

        it('returns an encoded URI component that includes an anchor fragment', () => {
            var wikipedia = iD.uiFieldWikipedia(field, context).entityIDs([entity.id]);
            // this can be tested manually by entering '? (film)#Themes and style in the search box before focusing out'
            expect(wikipedia.encodePath('? (film)', 'Themes and style')).toEqual('%3F_(film)#Themes_and_style');
        });
    });

    describe('encodeURIAnchorFragment', function() {
        it('returns an encoded URI anchor fragment', () => {
            var wikipedia = iD.uiFieldWikipedia(field, context).entityIDs([entity.id]);
            // this can be similarly tested by entering 'Section#Arts, entertainment and media' in the search box before focusing out'
            expect(wikipedia.encodeURIAnchorFragment('Theme?')).toEqual('#Theme%3F');
        });

        it('replaces all whitespace characters with underscore', () => {
            var wikipedia = iD.uiFieldWikipedia(field, context).entityIDs([entity.id]);
            expect(wikipedia.encodeURIAnchorFragment('Themes And Styles')).toEqual('#Themes_And_Styles');
        });

        it('encodes % characters, does not replace them with a dot', () => {
            var wikipedia = iD.uiFieldWikipedia(field, context).entityIDs([entity.id]);
            expect(wikipedia.encodeURIAnchorFragment('Is%this_100% correct')).toEqual('#Is%25this_100%25_correct');
        });

        it('encodes characters that are URI encoded characters', () => {
            var wikipedia = iD.uiFieldWikipedia(field, context).entityIDs([entity.id]);
            expect(wikipedia.encodeURIAnchorFragment('Section %20%25')).toEqual('#Section_%2520%2525');
        });
    });

    // note - currently skipping the tests that use `options` to delay responses
    it('preserves existing language', async () => {
        var wikipedia1 = iD.uiFieldWikipedia(field, context);
        await setTimeout(20);
        selection.call(wikipedia1);
        iD.utilGetSetValue(selection.selectAll('.wiki-lang'), 'Deutsch');

        var wikipedia2 = iD.uiFieldWikipedia(field, context);
        await setTimeout(20);
        selection.call(wikipedia2);
        wikipedia2.tags({});
        expect(iD.utilGetSetValue(selection.selectAll('.wiki-lang'))).toEqual('Deutsch');
    });

    it.skip('does not set delayed wikidata tag if graph has changed', async () => {
        var wikipedia = iD.uiFieldWikipedia(field, context).entityIDs([entity.id]);
        wikipedia.on('change', changeTags);
        selection.call(wikipedia);

        var spy = fn();
        wikipedia.on('change.spy', spy);

        // Create an XHR server that will respond after 60ms
        fetchMock.reset();
        fetchMock.mock(new RegExp('\/w\/api\.php.*action=wbgetentities'), {
            body: '{"entities":{"Q216353":{"id":"Q216353"}}}',
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }, {
            delay: 60
        });

        // Set title to "Skip"
        iD.utilGetSetValue(selection.selectAll('.wiki-lang'), 'Deutsch');
        iD.utilGetSetValue(selection.selectAll('.wiki-title'), 'Skip');
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
        happen.once(selection.selectAll('.wiki-title').node(), { type: 'blur' });

        // t0
        expect(context.entity(entity.id).tags.wikidata).toBeUndefined();

        // Create a new XHR server that will respond after 60ms to
        // separate requests after this point from those before
        fetchMock.reset();
        fetchMock.mock(new RegExp('\/w\/api\.php.*action=wbgetentities'), {
            body: '{"entities":{"Q216353":{"id":"Q216353"}}}',
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }, {
            delay: 60
        });

        // t30:  graph change - Set title to "Title"
        window.setTimeout(function() {
            iD.utilGetSetValue(selection.selectAll('.wiki-title'), 'Title');
            happen.once(selection.selectAll('.wiki-title').node(), { type: 'change' });
            happen.once(selection.selectAll('.wiki-title').node(), { type: 'blur' });
        }, 30);

        // t60:  at t0 + 60ms (delay), wikidata SHOULD NOT be set because graph has changed.

        // t70:  check that wikidata unchanged
        window.setTimeout(function() {
            expect(context.entity(entity.id).tags.wikidata).toBeUndefined();
        }, 70);

        // t90:  at t30 + 60ms (delay), wikidata SHOULD be set because graph is unchanged.

        // t100:  check that wikidata has changed
        await setTimeout(100);
        expect(context.entity(entity.id).tags.wikidata).toEqual('Q216353');

        expect(spy.callCount).toEqual(4);
        expect(spy.getCall(0)).toHaveBeenCalledWith({ wikipedia: 'de:Skip' });   // 'Skip' on change
        expect(spy.getCall(1)).toHaveBeenCalledWith({ wikipedia: 'de:Skip' });   // 'Skip' on blur
        expect(spy.getCall(2)).toHaveBeenCalledWith({ wikipedia: 'de:Title' });  // 'Title' on change +10ms
        expect(spy.getCall(3)).toHaveBeenCalledWith({ wikipedia: 'de:Title' });  // 'Title' on blur   +10ms
    });
});
