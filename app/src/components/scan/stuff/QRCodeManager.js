var QRCodeManager = function(element) {
    var root = document.getElementById(element);
    var qrcodeData = root.querySelector('.QRCodeSuccessDialog-data');
    var qrcodeNavigate = root.querySelector('.QRCodeSuccessDialog-navigate');
    var qrcodeIgnore = root.querySelector('.QRCodeSuccessDialog-ignore');
    var qrcodeShare = root.querySelector('.QRCodeSuccessDialog-share');
    var qrcodeCallback = root.querySelector('.QRCodeSuccessDialog-callback');
    var callbackController = new QRCodeCallbackController(qrcodeCallback);

    var self = this;

    this.currentUrl = undefined;

    if (navigator.share) {
      // Sharing is supported so let's make the UI visible
      qrcodeShare.classList.remove('hidden');
    }

    this.detectQRCode = async function(context) {
      let result = await decode(context);
      let normalizedUrl;
      if (result !== undefined) {
        normalizedUrl = normalizeUrl(result);
        self.currentUrl = normalizedUrl;
      }
      return normalizedUrl;
    };

    this.showDialog = function(normalizedUrl) {
      root.style.display = 'block';
      qrcodeData.innerText = normalizedUrl;
      callbackController.setQrCode(normalizedUrl);
    };

    this.closeDialog = function() {
      root.style.display = 'none';
      qrcodeData.innerText = '';
    };

    qrcodeIgnore.addEventListener(
      'click',
      function() {
        this.closeDialog();
      }.bind(this)
    );

    qrcodeShare.addEventListener(
      'click',
      function() {
        if (navigator.share) {
          navigator
            .share({
              title: this.currentUrl,
              text: this.currentUrl,
              url: this.currentUrl
            })
            .then(function() {
              self.closeDialog();
            })
            .catch(function() {
              self.closeDialog();
            });
        }
      }.bind(this)
    );

    qrcodeNavigate.addEventListener(
      'click',
      function() {
        // I really want this to be a link.

        // Prevent XSS.
        // Note: there's no need to check for `jAvAsCrIpT:` etc. as
        // `normalizeUrl` already took care of that.
        if (this.currentUrl.protocol === 'javascript:') {
          console.log('XSS prevented!');
          return;
        }
        window.location = this.currentUrl;
        this.closeDialog();
      }.bind(this)
    );
  };