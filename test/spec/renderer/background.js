describe('iD.Background', function() {
    var c, d;

    beforeEach(function() {
        d = d3.select(document.createElement('div'));
        c = iD.Background(d).projection(d3.geo.mercator());
        d.call(c);
    });

    afterEach(function() {
        d.remove();
    });

    describe('iD.Background', function() {
        it('is instantiated', function() {
            expect(c).to.be.ok;
        });

        it('#size', function() {
            expect(c.size([100, 100])).to.equal(c);
            expect(c.size()).to.eql([100,100]);
        });

        it('#source', function() {
            expect(c.source(iD.BackgroundSource.Bing)).to.equal(c);
            expect(c.source()).to.equal(iD.BackgroundSource.Bing);
        });
    });

    describe('iD.BackgroundSource.Template', function() {
        it('does not error with blank template', function() {
            var source = iD.BackgroundSource.template({ template: '' });
            expect(source([0,1,2])).to.equal('');
        });
        it('generates a tile-generating source', function() {
            var source = iD.BackgroundSource.template({ template: '{z}/{x}/{y}' });
            expect(source([0,1,2])).to.equal('2/0/1');
        });
        it('supports subdomains', function() {
            var source = iD.BackgroundSource.template({ template: '{t}/{z}/{x}/{y}', subdomains: ['apples', 'oranges'] });
            expect(source([0,1,2])).to.equal('apples/2/0/1');
        });
        it('distributes requests between subdomains', function() {
            var source = iD.BackgroundSource.template({ template: '{t}/{z}/{x}/{y}', subdomains: ['apples', 'oranges'] });
            expect(source([0,1,1])).to.equal('oranges/1/0/1');
        });
    });

});
