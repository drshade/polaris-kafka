import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  AppBar,
  Toolbar,
  List,
  SwipeableDrawer,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider
} from '@material-ui/core';

import MenuIcon from '@material-ui/icons/Menu';
import PersonIcon from '@material-ui/icons/Person';
import HomeIcon from '@material-ui/icons/Home';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import PersonAddDisabledIcon from '@material-ui/icons/PersonAddDisabled';

import { push, goBack } from 'connected-react-router';

import { Link } from 'react-router-dom';

import './Menu.css';
import store from '../../store';

import { login } from '../../actions/session.login.action';

import Login from '../login/Login';

class Menu extends Component {
  state = {
    open: false,
    openMenu: false
  };

  toggleDrawer() {
    this.setState({ open: !this.state.open });
  }

  login() {
    store.dispatch(push('/register'));
  }

  toggleMenu() {
    this.setState({ openMenu: !this.state.openMenu });
  }

  handleClose(event) {
    if (this.anchorEl.contains(event.target)) {
      return;
    }

    this.setState({ openMenu: false });
  }

  onSuccess(response) {
    const token = response.getAuthResponse().id_token;

    store.dispatch(login(token));

    this.setState({ openMenu: false });
  }

  navigateBack() {
    store.dispatch(goBack());
  }

  onFailure(error) {
    console.log(error);
  }

  render() {

    return (
      <div className="menu">
        <AppBar position="fixed">
          <Toolbar className="toolbar-top">
            <IconButton className="menuButton" color="inherit" aria-label="Menu" onClick={() => this.toggleDrawer()}>
              <MenuIcon />
            </IconButton>
            { this.props.isHome === true ? (
            <IconButton className="menuButton" color="inherit" aria-label="Menu" onClick={() => this.navigateBack()}>
              <ArrowBackIos />
            </IconButton>) : null }            
            <h1 className="title">
              <Link to="/">                
              </Link>
            </h1>           
            <Login />
          </Toolbar>
        </AppBar>

        <SwipeableDrawer open={this.state.open} onClose={() => this.toggleDrawer()} onOpen={() => this.toggleDrawer()}>
          <div tabIndex={0} role="button" onClick={() => this.toggleDrawer()} onKeyDown={() => this.toggleDrawer()}>
            <div className="list">
              <List>
                <ListItem button key="Home">
                  <ListItemIcon>
                    <HomeIcon />
                  </ListItemIcon>
                  <ListItemText>
                    <Link to="/">Home</Link>
                  </ListItemText>
                </ListItem>
                <ListItem button key="Register">
                  <ListItemIcon>
                    <PersonAddIcon />
                  </ListItemIcon>
                  <ListItemText>
                    <Link to="/register">Register</Link>
                  </ListItemText>
                </ListItem>
                <ListItem button key="Profile">
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText>
                    <Link to="/profile">Profile</Link>
                  </ListItemText>
                </ListItem>
                <Divider />
                <ListItem button key="Unregister">
                  <ListItemIcon>
                    <PersonAddDisabledIcon />
                  </ListItemIcon>
                  <ListItemText>
                    <Link to="/unregister">Deregister</Link>
                  </ListItemText>
                </ListItem>
              </List>
            </div>
          </div>
        </SwipeableDrawer>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isHome: state.navigation.isHome   
  };
}

export default connect(mapStateToProps)(Menu);
