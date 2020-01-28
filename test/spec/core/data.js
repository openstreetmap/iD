describe('iD.coreData', function() {
    var _context;
    var _oldData;

    before(function() {
        iD.data.test = { hello: 'world' };
    });

    after(function() {
        delete iD.data.test;
    });

    beforeEach(function() {
        _context = iD.coreContext();
    });


    describe('#fileMap', function() {
        it('gets the fileMap', function() {
            var data = iD.coreData(_context);
            expect(data.fileMap()).to.be.a('object');
        });
        it('sets the fileMap', function() {
            var data = iD.coreData(_context);
            var files = { 'intro_graph': 'data/intro_graph.json' };
            expect(data.fileMap(files)).to.be.ok;
        });
    });

    describe('#get', function() {
        it('returns a promise resolved if we already have the data', function(done) {
            var data = iD.coreData(_context);
            var prom = data.get('test');
            expect(prom).to.be.a('promise');
            prom.then(function (data) {
                expect(data).to.be.a('object');
                expect(data.hello).to.eql('world');
                done();
            });
        });
        it('returns a promise rejected if we can not get the data', function(done) {
            var data = iD.coreData(_context);
            var prom = data.get('wat');
            prom.catch(function (err) {
                expect(/^Unknown data file/.test(err)).to.be.true;
                done();
            });
        });
        it('returns a promise to fetch data if we do not already have the data', function(done) {
            var files = { 'intro_graph': 'data/intro_graph.json' };
            var data = iD.coreData(_context).fileMap(files);
            var prom = data.get('intro_graph');
            expect(prom).to.be.a('promise');
            prom.then(function (data) {
                expect(data).to.be.a('object');
                expect(data.n1.tags.name).to.eql('Three Rivers City Hall');
                done();
            });
        });
    });

});
