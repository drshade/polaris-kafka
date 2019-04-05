import React, { Component } from "react";

import ChevronRight from "@material-ui/icons/ChevronRight";
import AmountToAdd from "../amount-to-add/AmountToAdd";
import { Link } from 'react-router-dom';

import "./PaymentMethod.css";

export default class PaymentMethod extends Component {
  state = {};

  render() {
    return (
      <div>
        <AmountToAdd />
        <h4>Select payment method:</h4>
        <ul className="methods">
          <li>
            <Link to="/credit-card">
              Credit card
              <ChevronRight />
            </Link>
          </li>
          <li>
            Debit card
            <ChevronRight />
          </li>
          <li>
            Internet banking
            <ChevronRight />
          </li>
          <li>
            Nedbank transfer
            <ChevronRight />
          </li>
        </ul>
      </div>
    );
  }
}
