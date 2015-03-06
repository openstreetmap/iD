describe("diff3", function() {
    function split(s) {
        return s ? s.split(/ /) : [];
    }

    it('performs diff3 merge', function() {
        var o = split('AA ZZ 00 M 99'),
            a = split('AA a b c ZZ new 00 a a M 99'),
            b = split('AA a d c ZZ 11 M z z 99'),
            res = Diff3.diff3_merge(a, o, b);

        /*
        AA
        <<<<<<< a
        a
        b
        c
        ||||||| o
        =======
        a
        d
        c
        >>>>>>> b
        ZZ
        <<<<<<< a
        new
        00
        a
        a
        ||||||| o
        00
        =======
        11
        >>>>>>> b
        M
        z
        z
        99
        */

        expect(res[0].ok).to.eql(['AA']);
        expect(res[0].conflict).to.be.undefined;

        expect(res[1].ok).to.be.undefined;
        expect(res[1].conflict.o).to.eql([]);
        expect(res[1].conflict.a).to.eql(['a', 'b', 'c']);
        expect(res[1].conflict.b).to.eql(['a', 'd', 'c']);

        expect(res[2].ok).to.eql(['ZZ']);
        expect(res[2].conflict).to.be.undefined;

        expect(res[3].ok).to.be.undefined;
        expect(res[3].conflict.o).to.eql(['00']);
        expect(res[3].conflict.a).to.eql(['new', '00', 'a', 'a']);
        expect(res[3].conflict.b).to.eql(['11']);

        expect(res[4].ok).to.eql(['M', 'z', 'z', '99']);
        expect(res[4].conflict).to.be.undefined;
    });

    it('can include false conflicts', function() {
        var o = split('AA ZZ'),
            a = split('AA a b c ZZ'),
            b = split('AA a b c ZZ'),
            res = Diff3.diff3_merge(a, o, b, false);

        expect(res[0].ok).to.eql(['AA']);
        expect(res[0].conflict).to.be.undefined;

        expect(res[1].ok).to.be.undefined;
        expect(res[1].conflict.o).to.eql([]);
        expect(res[1].conflict.a).to.eql(['a', 'b', 'c']);
        expect(res[1].conflict.b).to.eql(['a', 'b', 'c']);

        expect(res[2].ok).to.eql(['ZZ']);
        expect(res[2].conflict).to.be.undefined;
    });

    it('can exclude false conflicts', function() {
        var o = split('AA ZZ'),
            a = split('AA a b c ZZ'),
            b = split('AA a b c ZZ'),
            res = Diff3.diff3_merge(a, o, b, true);

        expect(res[0].ok).to.eql(['AA', 'a', 'b', 'c', 'ZZ']);
        expect(res[0].conflict).to.be.undefined;
    });

});
