let QRCodeHelpManager = function(element) {
    let root = document.getElementById(element);
    let qrhelpClose = root.querySelector('.QRCodeAboutDialog-close');

    this.showDialog = function() {
      root.style.display = 'block';
    };

    this.closeDialog = function() {
      root.style.display = 'none';
    };

    qrhelpClose.addEventListener(
      'click',
      function() {
        this.closeDialog();
      }.bind(this)
    );
  };