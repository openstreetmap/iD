describe('iD.coreFileFetcher', function() {

    before(function() {
        iD.fileFetcher.cache().test = { hello: 'world' };
    });

    after(function() {
        delete iD.fileFetcher.cache().test;
    });


    describe('#fileMap', function() {
        it('gets the fileMap', function() {
            var data = iD.coreFileFetcher();
            expect(data.fileMap()).to.be.a('object');
        });
        it('sets the fileMap', function() {
            var data = iD.coreFileFetcher();
            var files = { 'intro_graph': 'data/intro_graph.min.json' };
            expect(data.fileMap(files)).to.be.ok;
        });
    });

    describe('#get', function() {
        it('returns a promise resolved if we already have the data', function(done) {
            var data = iD.coreFileFetcher();
            var prom = data.get('test');
            // expect(prom).to.be.a('promise');   // these are polyfilled in phantomjs
            prom
                .then(function(data) {
                    expect(data).to.be.a('object');
                    expect(data.hello).to.eql('world');
                })
                .finally(done);

            window.setTimeout(function() {}, 20); // async - to let the promise settle in phantomjs
        });

        it('returns a promise rejected if we can not get the data', function(done) {
            var data = iD.coreFileFetcher();
            var prom = data.get('wat');
            prom
                .then(function(data) {
                    throw new Error('We were not supposed to get data but did: ' + data);
                })
                .catch(function(err) {
                    expect(/^Unknown data file/.test(err)).to.be.true;
                })
                .finally(done);

            window.setTimeout(function() {}, 20);  // async - to let the promise settle in phantomjs
        });

        it('returns a promise to fetch data if we do not already have the data', function(done) {
            var files = { 'intro_graph': 'data/intro_graph.min.json' };
            var data = iD.coreFileFetcher().fileMap(files);
            var prom = data.get('intro_graph');
            // expect(prom).to.be.a('promise');   // these are polyfilled in phantomjs
            prom
                .then(function(data) {
                    expect(data).to.be.a('object');
                    expect(data.n1.tags.name).to.eql('Three Rivers City Hall');
                })
                .finally(done);

            window.setTimeout(function() {}, 20);  // async - to let the promise settle in phantomjs
        });
    });

});
