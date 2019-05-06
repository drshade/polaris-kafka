import React, { Component } from "react";

import QRCode from "qrcode.react";

import "./UserQrCode.css";

export default class UserQrCode extends Component {
  state = {};

  render() {
    const encodedEmail = btoa(this.props.email);
    const payUrl = encodeURI(`${window.location.origin}/pay/${encodedEmail}`);

    return (
      <div>
        <i>Show this QR code to receive money.</i>
        <div className="qrCode">
          <QRCode
            value={payUrl}
            size={250}
            bgColor={'#ffffff'}
            fgColor={'#ff3cac'}
            level={'L'}
            includeMargin={false}
            renderAs={'svg'}
          />
        </div>
      </div>
    );
  }
}
