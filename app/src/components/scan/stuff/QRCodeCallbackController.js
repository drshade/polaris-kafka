var QRCodeCallbackController = function(element) {
    var callbackName = element.querySelector('.QRCodeSuccessDialogCallback-name');
    var callbackDomain = element.querySelector('.QRCodeSuccessDialogCallback-domain');
    var callbackUrl;
    var qrcodeUrl;
    var isValidCallbackUrl = false;

    this.setQrCode = function(normalizedUrl) {
      qrcodeUrl = normalizedUrl;
    };

    var init = function() {
      callbackUrl = getCallbackURL();
      isValidCallbackUrl = validateCallbackURL(callbackUrl);

      if (callbackUrl) {
        element.addEventListener('click', function() {
          // Maybe we should warn if the callback URL is invalid
          callbackUrl.searchParams.set('qrcode', qrcodeUrl);
          location = callbackUrl;
        });

        element.classList.remove('hidden');
        if (isValidCallbackUrl == false) {
          callbackDomain.classList.add('invalid');
        }
        callbackDomain.innerText = callbackUrl.origin;
      }
    };

    var validateCallbackURL = function(callbackUrl) {
      if (document.referrer === '') return false;

      var referrer = new URL(document.referrer);

      return callbackUrl !== undefined && referrer.origin == callbackUrl.origin && referrer.scheme !== 'https';
    };

    var getCallbackURL = function() {
      var url = new URL(window.location);
      if ('searchParams' in url && url.searchParams.has('x-callback-url')) {
        // If the API is not supported, we should shim it.  But right now
        // let's just get it working
        return new URL(url.searchParams.get('x-callback-url'));
      }
    };

    init();
  };