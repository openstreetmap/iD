describe('iD.utilSessionMutex', function() {
    var a, b;

    afterEach(function() {
        if (a) a.unlock();
        if (b) b.unlock();
    });

    describe('#lock', function() {
        it('returns true when it gets a lock', function() {
            a = iD.utilSessionMutex('name');
            expect(a.lock()).toEqual(true);
        });

        it('returns true when already locked', function() {
            a = iD.utilSessionMutex('name');
            a.lock();
            expect(a.lock()).toEqual(true);
        });

        it('returns false when the lock is held by another session', function() {
            a = iD.utilSessionMutex('name');
            a.lock();

            b = iD.utilSessionMutex('name');
            expect(b.lock()).toEqual(false);
        });
    });

    describe('#locked', function() {
        it('returns false by default', function() {
            a = iD.utilSessionMutex('name');
            expect(a.locked()).toEqual(false);
        });

        it('returns true when locked', function() {
            a = iD.utilSessionMutex('name');
            a.lock();
            expect(a.locked()).toEqual(true);
        });

        it('returns false when unlocked', function() {
            a = iD.utilSessionMutex('name');
            a.lock();
            a.unlock();
            expect(a.locked()).toEqual(false);
        });
    });

    describe('#unlock', function() {
        it('unlocks the mutex', function() {
            a = iD.utilSessionMutex('name');
            a.lock();
            a.unlock();

            b = iD.utilSessionMutex('name');
            expect(b.lock()).toEqual(true);
        });

        it('does nothing when the lock is held by another session', function() {
            a = iD.utilSessionMutex('name');
            a.lock();

            b = iD.utilSessionMutex('name');
            b.unlock();

            expect(a.locked()).toEqual(true);
        });

        it('does nothing when not locked', function() {
            a = iD.utilSessionMutex('name');
            a.unlock();
            expect(a.locked()).toEqual(false);
        });
    });

    it('namespaces locks', function() {
        a = iD.utilSessionMutex('a');
        a.lock();

        b = iD.utilSessionMutex('b');
        expect(b.locked()).toEqual(false);
        expect(b.lock()).toEqual(true);
    });

    it.skip('automatically unlocks when a session crashes', function() {
        // Tested manually.
    });
});
