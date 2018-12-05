describe('iD.serviceOsmWikibase', function() {
    var server, wikibase;


    before(function() {
        iD.services.osmWikibase = iD.serviceOsmWikibase;
    });

    after(function() {
        delete iD.services.osmWikibase;
    });

    beforeEach(function() {
        wikibase = iD.services.osmWikibase;
        wikibase.init();
        server = sinon.fakeServer.create();
    });

    afterEach(function() {
        server.restore();
    });


    function query(url) {
        return iD.utilStringQs(url.substring(url.indexOf('?') + 1));
    }


    describe('#docs', function() {
        it('calls the given callback with the results of the docs query', function() {
            var callback = sinon.spy();
            wikibase.docs({key: 'amenity', value: 'parking'}, callback);

            server.respondWith('GET', /\/tag\/wiki_page/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"on_way":false,"lang":"en","on_area":true,"image":"File:Car park2.jpg"}]}']
            );
            server.respond();

            expect(query(server.requests[0].url)).to.eql(
                {key: 'amenity', value: 'parking'}
            );
            expect(callback).to.have.been.calledWith(
                null, [{'on_way':false,'lang':'en','on_area':true,'image':'File:Car park2.jpg'}]
            );
        });
    });

});
