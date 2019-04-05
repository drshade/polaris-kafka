import React, { Component } from 'react';
import store from '../../store';
import { connect } from 'react-redux';
//import { createSelector } from "reselect";

import './CartSummary.css';

import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { unstable_Box as Box } from '@material-ui/core/Box';

import { 
  Typography, Grid, Icon, Button, TextField, Fab, Paper,
  Table, TableRow, TableCell, 
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TableBody 
} from '@material-ui/core';

import { CurrencyFormatter } from '../../services/formatting.service';

import { queryProducts } from "../../actions/product.query-products.action";
import ProductCard from '../product-card/ProductCard';

//const stateSelector = state => state;

// Is this the correct way to access different parts of state ??????
// Should state structure/layout be redesigned ?????
// const combineSelector = createSelector(
//   [stateSelector],
//   (state) => {
//     return state.catalogueProducts !== undefined ? 
//       state.cartProducts.map((cartProduct) => {
//         let sourceProduct = state.catalogueProducts.find(catalogueProduct => catalogueProduct.id == cartProduct.id);

//         return sourceProduct !== undefined ? {
//           ...cartProduct, 
//           price: sourceProduct.price,
//           stock: sourceProduct.stock
//         } : cartProduct;
//       }) : state.cartProducts;
//   }
// );

class CartSummary extends Component {
  state = {
    open: false,
    showOffer: false,
    specialOffersVisibility: "none",
    deliveryAddress: "21 Jump Street, Awesomeville, Jossie, Gauteng 1234"
  };

  componentWillMount() {
    if (this.props.loadProducts) {
      console.log("No products loaded yet. Firing event to do so...");
      store.dispatch(queryProducts(4));
    } else {
      console.log("Products are loaded. No need to request them.");
    }
  }

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  toggleOffers = () => {
    return this.setState({ 
      specialOffersVisibility: this.state.specialOffersVisibility === "none" ? "block" : "none" });
  }

  render() {
    if (this.props.cart === undefined || this.props.cart.products === undefined || this.props.cart.products.length === 0) {
      return (
        <div>
          <Typography variant="h6" className="indent-min">
            Cart is empty
          </Typography>             
        </div>
      );
    };

    const productElements = this.props.cart.products.map((product) => {
      return (
        <Grid item xs={6} sm={3} md={3} lg={1} key={product.id}>
            <ProductCard key={product.id} product={product}></ProductCard>
        </Grid>
      );
    });

    var subTotal = this.props.cart.products.reduce((sum, product) => { 
      return sum += product.price;
    }, 0);
    var bagTotal = subTotal; // Plus Shipping Fees etc.
    var paymentPerMonth = bagTotal / 12

    var placeHolders = [];
    for (var i = -4; i < 0; i++) {
      placeHolders.push(
      <Grid item xs={6} sm={3} md={3} lg={1} key={i}>
        <ProductCard key={i} product={undefined}></ProductCard>
      </Grid>);
    }

    return (
      <div className="cart-root">
        <div className="delivery-address">         
          <Table>            
            <TableBody >
              <TableRow >
                <TableCell padding="none">          
                  <Typography variant="h6" className="indent-min">
                    Delivery Address
                  </Typography>   
                </TableCell>
                <TableCell align="right">                  
                  <Fab aria-label="Edit" size="small" color="secondary" onClick={() => this.handleClickOpen()}>
                    <Icon align="right">edit</Icon>
                  </Fab>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Typography variant="subtitle2" className="indent-med">
            { this.props.profile !== undefined ? this.props.profile.fullname : "" }
          </Typography>
          <Typography paragraph={true} variant="body2" className="indent-med">
            { this.state.deliveryAddress }
          </Typography>
        </div>

        {/* <Divider/> */}
        
        <div className="payment-summary">
          <Table>
            <TableBody>
            <TableRow>
              <TableCell padding="none">          
                <Typography variant="h6" className="indent-min">
                  Payment Summary
                </Typography>   
              </TableCell>
              <TableCell align="right">                  
                <Fab aria-label="Edit" size="small" color="secondary" onClick={() => this.toggleOffers()}>
                  <Icon align="right">card_giftcard</Icon>
                </Fab>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Subtotal</TableCell>
              <TableCell>{ CurrencyFormatter.format(subTotal) }</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Shipping</TableCell>
              <TableCell>Free</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>BAG TOTAL</TableCell>
              <TableCell>{ CurrencyFormatter.format(bagTotal) }</TableCell>
            </TableRow>
            </TableBody>          
          </Table>
        </div>

        <Typography paragraph={true} />
        
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className="credit-heading" variant="subtitle2">Buy on credit: { CurrencyFormatter.format(paymentPerMonth) } x 12</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails className="indent-min">
            <Icon>check_circle</Icon>
            <Typography>      
              Buy on credit with Nedbank
            </Typography>
          </ExpansionPanelDetails>
          <ExpansionPanelDetails className="indent-med">
            <Icon className="nedbank-green">sync</Icon>
            <Typography>
              Earn additional 10% cashback
            </Typography>
          </ExpansionPanelDetails>          
        </ExpansionPanel>
           
        <Box className="applied-offers" display={ this.state.specialOffersVisibility }>
          <Typography paragraph={true} />
          <Paper>
          <Typography paragraph={true} >
            <Icon className="check-circle">check_circle</Icon>
            Offer 1 Applied  
          </Typography>
          <Typography className="indent-med">
            You will receive a cashback of R5000.
            The amount show up in your wallet in the next 24 hours.
          </Typography>
          </Paper>
        </Box>

        <Typography paragraph={true} />

        <Typography variant="h6" className="indent-min">
          Cart Items
        </Typography>  
        <Grid container className="cart-content">
          { productElements.length !== 0 ? (productElements) : (placeHolders) }
        </Grid>

        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Delivery Address</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please specifiy the correct address.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Physical Address"
              type="email"
              fullWidth
            > { this.state.deliveryAddress }
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleClose} color="primary">
              Apply
            </Button>
          </DialogActions>
        </Dialog>
      </div>
      );
  };
};

function mapStateToProps(state) {
  return {    
    // products: combineSelector({
    //   cartProducts: state.cart.products,
    //   catalogueProducts: state.catalogue.products
    // }),
    cart: state.catalogue.cart,
    profile: state.user.profile,
    loadProducts: (state.catalogue.products === undefined || state.catalogue.products.length === 0)
  };
}

export default connect(mapStateToProps)(CartSummary);