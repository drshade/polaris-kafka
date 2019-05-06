import React, { Component } from "react";
import { connect } from "react-redux";

import { TextField, InputAdornment, Button } from "@material-ui/core";

import "./AddMoney.css";
import store from "../../store";

import { amountToAdd } from "../../actions/wallet.amountToAdd.action";
import { deposit } from "../../actions/wallet.deposit.action";
import { generate } from "../../services/reference.service";
import { push } from "connected-react-router";

class AddMoney extends Component {
  state = { amount: "" };

  onChange(amount) {
    if (amount === 0) amount = "";

    this.setState({ amount });
  }

  addMoney(value) {
    let amount = (this.state.amount || 0) + value;

    this.setState({ amount });
  }

  depositMoney() {
    const reference = generate();

    store.dispatch(amountToAdd(this.state.amount));
    store.dispatch(deposit(reference, this.state.amount));
    store.dispatch(push("/"));
  }

  render() {
    let { balance } = this.props;

    return (
      <div className="add-money">
        <div className="balance">
          Current Balance<br /><strong>R{balance}</strong>
        </div>
        <div className="amounts">
          <TextField
            type="number"
            placeholder="0,00"
            fullWidth
            margin="none"
            classes={{ div: "test-class" }}
            InputLabelProps={{
              shrink: true
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <span className="currency">R</span>
                </InputAdornment>
              )
            }}
            value={this.state.amount}
            onChange={e => this.onChange(Number(e.target.value))}
          />
          <div className="add-buttons">
            <Button variant="outlined" color="primary" onClick={() => this.addMoney(100)}>
              + R100
            </Button>
            <Button variant="outlined" color="primary" onClick={() => this.addMoney(200)}>
              + R200
            </Button>
            <Button variant="outlined" color="primary" onClick={() => this.addMoney(500)}>
              + R500
            </Button>
          </div>
          <div className="button-container keyboard-up">
            <Button
              variant="contained"
              color="primary"
              type="submit"
              onClick={e => this.depositMoney()}
              disabled={!this.state.amount}
            >
              Add Money
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    balance: state.wallet.balance
  };
}

export default connect(mapStateToProps)(AddMoney);
