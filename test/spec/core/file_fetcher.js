describe('iD.coreFileFetcher', function() {

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
            data.cache().test = { hello: 'world' };

            var prom = data.get('test');
            expect(prom).to.be.a('promise');
            prom
                .then(function(data) {
                    expect(data).to.be.a('object');
                    expect(data.hello).to.eql('world');
                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });

        it('returns a promise rejected if we can not get the data', function(done) {
            var data = iD.coreFileFetcher().assetPath('../dist/');
            var prom = data.get('wat');
            prom
                .then(function(data) {
                    done(new Error('We were not supposed to get data but did: ' + data));
                })
                .catch(function(err) {
                    expect(/^Unknown data file/.test(err)).to.be.true;
                    done();
                });
        });

        it('returns a promise to fetch data if we do not already have the data', function(done) {
            var files = { 'intro_graph': 'data/intro_graph.min.json' };
            var data = iD.coreFileFetcher().assetPath('../dist/').fileMap(files);
            var prom = data.get('intro_graph');
            expect(prom).to.be.a('promise');
            prom
                .then(function(data) {
                    expect(data).to.be.a('object');
                    expect(data.n2061.tags.name).to.eql('Three Rivers City Hall');
                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });
    });

});
