describe('iD.serviceTaginfo', function() {
    var server, taginfo;


    before(function() {
        iD.services.taginfo = iD.serviceTaginfo;
    });

    after(function() {
        delete iD.services.taginfo;
    });

    beforeEach(function() {
        server = window.fakeFetch().create();
        taginfo = iD.services.taginfo;

        // prepopulate popular keys list with "name"
        taginfo.init();
        server.respondWith('GET',
            new RegExp('\/keys\/all.*sortname=values_all'),
            [200, { 'Content-Type': 'application/json' },
                '{"data":[{"count_all":56136034,"key":"name","count_all_fraction":0.0132}]}']
        );
        server.respond();
        server.restore();
        server = window.fakeFetch().create();
    });

    afterEach(function() {
        server.restore();
    });

    function query(url) {
        return iD.utilStringQs(url.substring(url.indexOf('?')));
    }


    describe('#keys', function() {
        it('calls the given callback with the results of the keys query', function(done) {
            var callback = sinon.spy();
            taginfo.keys({query: 'amen'}, callback);

            server.respondWith('GET', /\/keys\/all/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"count_all":5190337,"key":"amenity","count_all_fraction":1.0}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(query(server.requests()[0].url)).to.eql(
                    {query: 'amen', page: '1', rp: '10', sortname: 'count_all', sortorder: 'desc', lang: 'en'}
                );
                expect(callback).to.have.been.calledWith(
                    null, [{'title':'amenity', 'value':'amenity'}]
                );
                done();
            }, 50);
        });

        it('includes popular keys', function(done) {
            var callback = sinon.spy();
            taginfo.keys({query: 'amen'}, callback);

            server.respondWith('GET', /\/keys\/all/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"count_all":5190337,"key":"amenity","count_all_fraction":1.0,"count_nodes_fraction":1.0},'
                          + '{"count_all":1,"key":"amenityother","count_all_fraction":0.0,"count_nodes_fraction":0.0}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(
                    null, [{'title':'amenity', 'value':'amenity'}]
                );
                done();
            }, 50);
        });

        it('includes popular keys with an entity type filter', function(done) {
            var callback = sinon.spy();
            taginfo.keys({query: 'amen', filter: 'nodes'}, callback);

            server.respondWith('GET', /\/keys\/all/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"count_all":5190337,"count_nodes":500000,"key":"amenity","count_all_fraction":1.0, "count_nodes_fraction":1.0},'
                            + '{"count_all":1,"key":"amenityother","count_all_fraction":0.0, "count_nodes":100}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(
                    null, [{'title':'amenity', 'value':'amenity'}]
                );
                done();
            }, 50);
        });

        it('includes unpopular keys with a wiki page', function(done) {
            var callback = sinon.spy();
            taginfo.keys({query: 'amen'}, callback);

            server.respondWith('GET', /\/keys\/all/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"count_all":5190337,"key":"amenity","count_all_fraction":1.0, "count_nodes_fraction":1.0},'
                            + '{"count_all":1,"key":"amenityother","count_all_fraction":0.0, "count_nodes_fraction":0.0, "in_wiki": true}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(null, [
                    {'title':'amenity', 'value':'amenity'},
                    {'title':'amenityother', 'value':'amenityother'}
                ]);
                done();
            }, 50);
        });

        it('sorts keys with \':\' below keys without \':\'', function(done) {
            var callback = sinon.spy();
            taginfo.keys({query: 'ref'}, callback);

            server.respondWith('GET', /\/keys\/all/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"key":"ref:bag","count_all":9790586,"count_all_fraction":0.0028},' +
                            '{"key":"ref","count_all":7933528,"count_all_fraction":0.0023}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(
                    null, [{'title':'ref', 'value':'ref'},{'title':'ref:bag', 'value':'ref:bag'}]
                );
                done();
            }, 50);
        });
    });

    describe('#multikeys', function() {
        it('calls the given callback with the results of the multikeys query', function(done) {
            var callback = sinon.spy();
            taginfo.multikeys({query: 'recycling:'}, callback);

            server.respondWith('GET', /\/keys\/all/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"count_all":69593,"key":"recycling:glass","count_all_fraction":0.0}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(query(server.requests()[0].url)).to.eql(
                    {query: 'recycling:', page: '1', rp: '25', sortname: 'count_all', sortorder: 'desc', lang: 'en'}
                );
                expect(callback).to.have.been.calledWith(
                    null, [{'title':'recycling:glass', 'value':'recycling:glass'}]
                );
                done();
            }, 50);
        });

        it('excludes multikeys with extra colons', function(done) {
            var callback = sinon.spy();
            taginfo.multikeys({query: 'service:bicycle:'}, callback);

            server.respondWith('GET', /\/keys\/all/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"count_all":4426,"key":"service:bicycle:retail","count_all_fraction":0.0},' +
                            '{"count_all":22,"key":"service:bicycle:retail:ebikes","count_all_fraction":0.0}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(
                    null, [{'title':'service:bicycle:retail', 'value':'service:bicycle:retail'}]
                );
                done();
            }, 50);
        });

        it('excludes multikeys with wrong prefix', function(done) {
            var callback = sinon.spy();
            taginfo.multikeys({query: 'service:bicycle:'}, callback);

            server.respondWith('GET', /\/keys\/all/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"count_all":4426,"key":"service:bicycle:retail","count_all_fraction":0.0},' +
                            '{"count_all":22,"key":"disused:service:bicycle","count_all_fraction":0.0}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(
                    null, [{'title':'service:bicycle:retail', 'value':'service:bicycle:retail'}]
                );
                done();
            }, 50);
        });
    });

    describe('#values', function() {
        it('calls the given callback with the results of the values query', function(done) {
            var callback = sinon.spy();
            taginfo.values({key: 'amenity', query: 'par'}, callback);

            server.respondWith('GET', /\/key\/values/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"value":"parking","description":"A place for parking cars", "fraction":0.1}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(query(server.requests()[0].url)).to.eql(
                    {key: 'amenity', query: 'par', page: '1', rp: '25', sortname: 'count_all', sortorder: 'desc', lang: 'en'}
                );
                expect(callback).to.have.been.calledWith(
                    null, [{'value':'parking','title':'A place for parking cars'}]
                );
                done();
            }, 50);
        });

        it('includes popular values', function(done) {
            var callback = sinon.spy();
            taginfo.values({key: 'amenity', query: 'par'}, callback);

            server.respondWith('GET', /\/key\/values/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"value":"parking","description":"A place for parking cars", "fraction":1.0},' +
                              '{"value":"party","description":"A place for partying", "fraction":0.0}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(
                    null, [{'value':'parking','title':'A place for parking cars'}]
                );
                done();
            }, 50);
        });

        it('does not get values for extremely unpopular keys', function(done) {
            var callback = sinon.spy();
            taginfo.values({key: 'name', query: 'ste'}, callback);

            server.respondWith('GET', /\/key\/values/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"value":"Rue Pasteur","description":"", "fraction":0.0001},' +
                              '{"value":"Via Trieste","description":"", "fraction":0.0001}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(null, []);
                done();
            }, 50);
        });

        it('excludes values with capital letters and some punctuation', function(done) {
            var callback = sinon.spy();
            taginfo.values({key: 'amenity', query: 'par'}, callback);

            server.respondWith('GET', /\/key\/values/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"value":"parking","description":"A place for parking cars", "fraction":0.2},'
                            + '{"value":"PArking","description":"A common mispelling", "fraction":0.2},'
                            + '{"value":"parking;partying","description":"A place for parking cars *and* partying", "fraction":0.2},'
                            + '{"value":"parking, partying","description":"A place for parking cars *and* partying", "fraction":0.2},'
                            + '{"value":"*","description":"", "fraction":0.2}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(
                    null, [{'value':'parking','title':'A place for parking cars'}]
                );
                done();
            }, 50);
        });

        it('includes network values with capital letters and some punctuation', function(done) {
            var callback = sinon.spy();
            taginfo.values({key: 'network', query: 'us'}, callback);

            server.respondWith('GET', /\/key\/values/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"value":"US:TX:FM","description":"Farm to Market Roads in the U.S. state of Texas.", "fraction":0.34},'
                            + '{"value":"US:KY","description":"Primary and secondary state highways in the U.S. state of Kentucky.", "fraction":0.31},'
                            + '{"value":"US:US","description":"U.S. routes in the United States.", "fraction":0.19},'
                            + '{"value":"US:I","description":"Interstate highways in the United States.", "fraction":0.11},'
                            + '{"value":"US:MD","description":"State highways in the U.S. state of Maryland.", "fraction":0.06}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(null, [
                    {'value':'US:TX:FM','title':'Farm to Market Roads in the U.S. state of Texas.'},
                    {'value':'US:KY','title':'Primary and secondary state highways in the U.S. state of Kentucky.'},
                    {'value':'US:US','title':'U.S. routes in the United States.'},
                    {'value':'US:I','title':'Interstate highways in the United States.'},
                    {'value':'US:MD','title':'State highways in the U.S. state of Maryland.'}
                ]);
                done();
            }, 50);
        });

        it('includes biological genus values with capital letters', function(done) {
            var callback = sinon.spy();
            taginfo.values({key: 'genus', query: 'qu'}, callback);

            server.respondWith('GET', /\/key\/values/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"value":"Quercus","description":"Oak", "fraction":0.5}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(
                    null, [{'value':'Quercus','title':'Oak'}]
                );
                done();
            }, 50);
        });

        it('includes biological taxon values with capital letters', function(done) {
            var callback = sinon.spy();
            taginfo.values({key: 'taxon', query: 'qu'}, callback);

            server.respondWith('GET', /\/key\/values/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"value":"Quercus robur","description":"Oak", "fraction":0.5}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(
                    null, [{'value':'Quercus robur','title':'Oak'}]
                );
                done();
            }, 50);
        });

        it('includes biological species values with capital letters', function(done) {
            var callback = sinon.spy();
            taginfo.values({key: 'species', query: 'qu'}, callback);

            server.respondWith('GET', /\/key\/values/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"value":"Quercus robur","description":"Oak", "fraction":0.5}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(callback).to.have.been.calledWith(
                    null, [{'value':'Quercus robur','title':'Oak'}]
                );
                done();
            }, 50);
        });
    });

    describe('#roles', function() {
        it('calls the given callback with the results of the roles query', function(done) {
            var callback = sinon.spy();
            taginfo.roles({rtype: 'route', query: 's', geometry: 'relation'}, callback);

            server.respondWith('GET', /\/relation\/roles/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"role":"stop","count_relation_members_fraction":0.1757},' +
                             '{"role":"south","count_relation_members_fraction":0.0035}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(query(server.requests()[0].url)).to.eql(
                    {rtype: 'route', query: 's', page: '1', rp: '25', sortname: 'count_relation_members', sortorder: 'desc', lang: 'en'}
                );
                expect(callback).to.have.been.calledWith(null, [
                    {'value': 'stop', 'title': 'stop'},
                    {'value': 'south', 'title': 'south'}
                ]);
                done();
            }, 50);
        });
    });

    describe('#docs', function() {
        it('calls the given callback with the results of the docs query', function(done) {
            var callback = sinon.spy();
            taginfo.docs({key: 'amenity', value: 'parking'}, callback);

            server.respondWith('GET', /\/tag\/wiki_page/,
                [200, { 'Content-Type': 'application/json' },
                    '{"data":[{"on_way":false,"lang":"en","on_area":true,"image":"File:Car park2.jpg"}]}']
            );
            server.respond();

            window.setTimeout(function() {
                expect(query(server.requests()[0].url)).to.eql(
                    {key: 'amenity', value: 'parking'}
                );
                expect(callback).to.have.been.calledWith(
                    null, [{'on_way':false,'lang':'en','on_area':true,'image':'File:Car park2.jpg'}]
                );
                done();
            }, 50);
        });
    });

});
