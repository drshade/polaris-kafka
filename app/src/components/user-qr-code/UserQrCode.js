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
            size={200}
            bgColor={'#ffffff'}
            fgColor={'#6330d3'}
            level={'L'}
            includeMargin={false}
            renderAs={'svg'}
          />
        </div>
        <i>Your personal QR code.</i>
        <h2>{this.props.fullname}</h2>
      </div>
    );
  }
}
