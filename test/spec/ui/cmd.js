describe('iD.uiCmd', function () {
    var orig;
    var ua = navigator.userAgent;
    var isPhantom = (navigator.userAgent.match(/PhantomJS/) !== null);
    var uaMock = function () { return ua; };

    beforeEach(function() {
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
        /* restore userAgent */
        if (isPhantom) {
            navigator = orig;
        } else {
            navigator.__defineGetter__('userAgent', orig);
        }
        /* eslint-enable no-global-assign */
    });

    it('does not overwrite mac keybindings', function () {
        ua = 'Mac';
        iD.utilDetect(true);  // force redetection
        expect(iD.uiCmd('⌘A')).to.eql('⌘A');
    });

    it('changes keys to linux versions', function () {
        ua = 'Linux';
        iD.utilDetect(true);  // force redetection
        expect(iD.uiCmd('⌘⌫')).to.eql('Ctrl+Backspace');
        expect(iD.uiCmd('⌘A')).to.eql('Ctrl+A');
        expect(iD.uiCmd('⇧A')).to.eql('Shift+A');
        expect(iD.uiCmd('⌘⇧A')).to.eql('Ctrl+Shift+A');
        expect(iD.uiCmd('⌘⇧Z')).to.eql('Ctrl+Shift+Z');
    });

    it('changes keys to win versions', function () {
        ua = 'Win';
        iD.utilDetect(true);  // force redetection
        expect(iD.uiCmd('⌘⌫')).to.eql('Ctrl+Backspace');
        expect(iD.uiCmd('⌘A')).to.eql('Ctrl+A');
        expect(iD.uiCmd('⇧A')).to.eql('Shift+A');
        expect(iD.uiCmd('⌘⇧A')).to.eql('Ctrl+Shift+A');
        expect(iD.uiCmd('⌘⇧Z')).to.eql('Ctrl+Y');  // special case
    });

    it('handles multi-character keys', function () {
        ua = 'Win';
        iD.utilDetect(true);  // force redetection
        expect(iD.uiCmd('f11')).to.eql('f11');
        expect(iD.uiCmd('⌘plus')).to.eql('Ctrl+plus');
    });

});
