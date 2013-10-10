describe("iD.util.SessionMutex", function() {
    var clock, a, b;

    beforeEach(function () {
        clock = sinon.useFakeTimers(Date.now());
    });

    afterEach(function() {
        clock.restore();
        if (a) a.unlock();
        if (b) b.unlock();
    });

    describe("#lock", function() {
        it("returns true when it gets a lock", function() {
            a = iD.util.SessionMutex('name');
            expect(a.lock()).to.equal(true);
        });

        it("returns true when already locked", function() {
            a = iD.util.SessionMutex('name');
            a.lock();
            expect(a.lock()).to.equal(true);
        });

        it("returns false when the lock is held by another session", function() {
            a = iD.util.SessionMutex('name');
            a.lock();

            b = iD.util.SessionMutex('name');
            expect(b.lock()).to.equal(false);
        });
    });

    describe("#locked", function() {
        it("returns false by default", function() {
            a = iD.util.SessionMutex('name');
            expect(a.locked()).to.equal(false);
        });

        it("returns true when locked", function() {
            a = iD.util.SessionMutex('name');
            a.lock();
            expect(a.locked()).to.equal(true);
        });

        it("returns false when unlocked", function() {
            a = iD.util.SessionMutex('name');
            a.lock();
            a.unlock();
            expect(a.locked()).to.equal(false);
        });
    });

    describe("#unlock", function() {
        it("unlocks the mutex", function() {
            a = iD.util.SessionMutex('name');
            a.lock();
            a.unlock();

            b = iD.util.SessionMutex('name');
            expect(b.lock()).to.equal(true);
        });

        it("does nothing when the lock is held by another session", function() {
            a = iD.util.SessionMutex('name');
            a.lock();

            b = iD.util.SessionMutex('name');
            b.unlock();

            expect(a.locked()).to.equal(true);
        });

        it("does nothing when not locked", function() {
            a = iD.util.SessionMutex('name');
            a.unlock();
            expect(a.locked()).to.equal(false);
        });
    });

    it("namespaces locks", function() {
        a = iD.util.SessionMutex('a');
        a.lock();

        b = iD.util.SessionMutex('b');
        expect(b.locked()).to.equal(false);
        expect(b.lock()).to.equal(true);
    });

    it("automatically unlocks when a session crashes", function() {
        // Tested manually.
    });
});
