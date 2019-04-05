import React, { Component } from "react";
import { connect } from "react-redux";

import "./AmountToAdd.css";

class AmountToAdd extends Component {
  state = {};

  render() {
    let {amountToAdd} = this.props;

    return (
      <div className="to-add">
        Amount to be added: <strong>R{amountToAdd}</strong>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    amountToAdd: state.wallet.amountToAdd
  };
}

export default connect(mapStateToProps)(AmountToAdd);
