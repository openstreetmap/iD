import { fileFetcher } from '../core/file_fetcher';
import * as countryCoder from '@ideditor/country-coder';

let _addressFormatsHolder = addressFormatsInit(); // singleton
export { _addressFormatsHolder as addressFormatsHolder };

//
// TODO 
function addressFormatsInit() {
  let _this = {};
  _this.addressFormats = null;

  let _loadPromise;
  _this.ensureLoaded = () => {
    if (_loadPromise) return _loadPromise;

    //todo promise.all for just one
    return _loadPromise = Promise.all([fileFetcher.get('address_formats')])
      .then(function(d) {
        _this.addressFormats = d[0];
      })
      .catch(function() { /* ignore */ });
  };

  return _this;
}

export function utilDisplayNameForAddress(entity) {
  let format = utilEntityToAddressFormat(entity);
  let displayName = '';

  for (let i = 0; i < format.length; i++){
      for (let j = 0; j < format[i].length; j++){
          let item = entity.tags[`addr:${format[i][j]}`];
          if (!item) continue;
          displayName = displayName + item + ' ';
      }
  }
  return displayName;
}

export function utilEntityToAddressFormat(entity){
  //Todo double check if entity is node for extent to work with no resolver
  let addressFormats = _addressFormatsHolder.addressFormats;

  let countryCode = countryCoder.iso1A2Code(entity.extent().center()).toLowerCase();
  var addressFormat;
  for (var i = 0; i < addressFormats.length; i++) {
      var format = addressFormats[i];
      if (!format.countryCodes) {
          addressFormat = format;   // choose the default format, keep going
      } else if (format.countryCodes.indexOf(countryCode) !== -1) {
          addressFormat = format;   // choose the country format, stop here
          break;
      }
  }
  return addressFormat.format;
}