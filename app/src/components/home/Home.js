import React, { Component } from 'react';
import store from '../../store';
import { Link } from 'react-router-dom';

import './Home.css';

import { toggleHome } from '../../actions/navigation.toggleHome.action';
import { connect } from 'react-redux';

import {
  Button
} from '@material-ui/core';

import BottomBar from '../bottom-bar/BottomBar';
import Wallet from '../wallet/Wallet';

class Home extends Component {
  state = {};

  componentDidMount() {
    store.dispatch(toggleHome());
  }

  componentWillUnmount() {
    store.dispatch(toggleHome());
  }

  render() {

    return (
      <div className="home">
        <div className="rocket-wrapper">
          {this.props.profile && <Wallet />}

          {!this.props.profile && (
            <div className="rocket">
              <img src="/assets/images/logo/synthesis-logo-wide-white.png" alt="synthesis" className="synthesis-logo" />
              <div className="three-simple-steps-wrapper">
                <p>A FRESH<br /> APPROACH< br />TO STREAM<br />BANKING</p>
              </div>
              <Button variant="contained" color="secondary" type="submit">
                Let's get started
              </Button>
            </div>
          )}
        </div>

        <div className="shopping-options-container">
          {this.props.profile && (
            <div className="wallet-menu">
              <Link to="/add-money">
                <img src="/assets/images/money-bag.svg" alt="add-money" />
                <span>Add Money</span>
              </Link>
              <hr/>
              <Link to="/receive">
                <img src="/assets/images/receive.svg" alt="receive" />
                <span>Receive Money</span>
              </Link>
              <hr/>
              <Link to="/scan">
                <img src="/assets/images/mobile-pay.svg" alt="mobile-pay" />
                <span>Pay Someone</span>
              </Link>           
            </div>
          )}
        </div>

        {/* <div className="testcode">
          <button type="button" onClick={() => this.ping()}>
            PING!
          </button>
          <div>Pinged: {this.props.pinged} </div>
          <div>Ponged: {this.props.ponged} </div>
          <div>Balance: {this.props.balance} </div>
        </div> */}

        {this.props.profile && <BottomBar />}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    ...state.ping,
    profile: state.user.profile  
  };
}

export default connect(mapStateToProps)(Home);
