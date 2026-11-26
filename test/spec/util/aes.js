describe('iD.utilAes', function() {

    it('encrypting and decrypting nothing yields nothing', function() {
        expect(iD.utilAesEncrypt('')).to.eql('');
        expect(iD.utilAesDecrypt('')).to.eql('');
    });

    it('encrypts and decrypts with default key', function() {
        var text = 'Hello iD!';
        var encrypted = '5597506f958c68543c';
        expect(iD.utilAesEncrypt(text)).to.eql(encrypted);
        expect(iD.utilAesDecrypt(encrypted)).to.eql(text);
    });

    it('encrypts and decrypts with a custom 16-bit key', function() {
        var key = [
            216, 159, 213, 140, 129,  75,  80, 121,
             67, 201, 179, 120,  71, 237, 185,  42
        ];
        var text = 'Hello iD!';
        var encrypted = '9ff50e32b04f86640a';
        expect(iD.utilAesEncrypt(text, key)).to.eql(encrypted);
        expect(iD.utilAesDecrypt(encrypted, key)).to.eql(text);
    });

    it('encrypts and decrypts with a custom 24-bit key', function() {
        var key = [
            180, 138, 124,  87, 157, 23, 209, 147,
             64,  65,  68, 206, 212, 79, 215, 114,
             37,  18, 159,  94, 168, 68, 177, 202
        ];
        var text = 'Hello iD!';
        var encrypted = '85fc05011fa7848417';
        expect(iD.utilAesEncrypt(text, key)).to.eql(encrypted);
        expect(iD.utilAesDecrypt(encrypted, key)).to.eql(text);
    });

    it('encrypts and decrypts with a custom 32-bit key', function() {
        var key = [
              4,  48, 130, 253, 213, 139, 96,  178,
            170, 108, 127, 233, 167, 137, 181,  41,
            145,  62, 251,   9,  82, 159, 103, 198,
             63, 200, 158, 104, 188,  77, 193,  16
        ];
        var text = 'Hello iD!';
        var encrypted = '13c21d3dc25165c57c';
        expect(iD.utilAesEncrypt(text, key)).to.eql(encrypted);
        expect(iD.utilAesDecrypt(encrypted, key)).to.eql(text);
    });
});
