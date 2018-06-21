describe('iD.serviceNotes', function () {
    var dimensions = [64, 64],
        ua = navigator.userAgent,
        isPhantom = (navigator.userAgent.match(/PhantomJS/) !== null),
        uaMock = function () { return ua; },
        context, server, notes, orig;


    before(function() {
        iD.services.notes = iD.serviceNotes;
    });

    after(function() {
        delete iD.services.notes;
    });

    beforeEach(function() {
        context = iD.Context().assetPath('../dist/');
        context.projection
            .scale(667544.214430109)  // z14
            .translate([-116508, 0])  // 10,0
            .clipExtent([[0,0], dimensions]);

        server = sinon.fakeServer.create();
        notes = iD.services.notes;
        notes.reset();

        /* eslint-disable no-global-assign */
        /* mock userAgent */
        if (isPhantom) {
            orig = navigator;
            navigator = Object.create(orig, { userAgent: { get: uaMock }});
        } else {
            orig = navigator.__lookupGetter__('userAgent');
            navigator.__defineGetter__('userAgent', uaMock);
        }
    });

    afterEach(function() {
        server.restore();

        /* restore userAgent */
        if (isPhantom) {
            navigator = orig;
        } else {
            navigator.__defineGetter__('userAgent', orig);
        }
        /* eslint-enable no-global-assign */
    });

    describe('#init', function () {
        it('Initializes cache one time', function () {
            var cache = notes.cache();
            expect(cache).to.have.property('notes');

            notes.init();
            var cache2 = notes.cache();
            expect(cache).to.equal(cache2);
        });
    });

});