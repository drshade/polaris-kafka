import React, { Component } from "react";
import store from "../../store";

import { CurrencyFormatter } from "../../services/formatting.service";

import "./ProductDetail.css";

import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  CardActions,
  Button,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails
} from "@material-ui/core";

import { 
  ExpandMore,
  Bookmark,
  BookmarkBorderOutlined
} from "@material-ui/icons"

import { connect } from "react-redux";

import { addProduct } from "../../actions/cart.addProduct.action";
import { addProductToWishlist } from "../../actions/wishlist.add-product.action";
import { removeProductFromWishlist} from "../../actions/wishlist.remove-product.action";

class ProductDetail extends Component {
  state = {};

  addToCart = () => {
    store.dispatch(addProduct(this.props.product));
  };

  componentWillUnmount() {
    localStorage.setItem("selectedProduct", null);
  }

  toggleWishlist = () => {
    const product = this.props.wishlist.products.find(wishlistItem => wishlistItem.id === this.props.product.id);
    if (product !== undefined) {
      store.dispatch(removeProductFromWishlist(product.id));
    } else {
      store.dispatch(addProductToWishlist(this.props.product.id));
    }
  }

  render() {
    let product = this.props.product;

    const price = CurrencyFormatter.format(product.price);
    const description = { __html: product.description };

    const inWishlist = Boolean(this.props.wishlist.products.find(wishlistItem => wishlistItem.id === product.id));

    return (
      <div>
        <Card className="product-detail">
          <CardMedia
            component="img"
            alt="Contemplative Reptile"
            className="product-media"
            image={product.imgUrl}
            title="Contemplative Reptile"
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              {product.sku}
            </Typography>
            <Grid container direction="row" justify="space-between">
              <Typography component="p" className="money">
                {price}
              </Typography>
              {product.stock !== undefined ? (
                <Typography component="p" className="stock">
                  {product.stock.quantity} Left
                </Typography>
              ) : null}
            </Grid>
          </CardContent>
          <CardActions className="actions">
            <Button size="small" color="primary" className="wishlist" onClick={this.toggleWishlist}>
              { inWishlist ? <Bookmark /> : <BookmarkBorderOutlined />}
              { inWishlist ? "Remove Wishlist" : "Add to Wishlist" }
            </Button>
            <Button
              size="small"
              color="primary"
              className="cart"
              onClick={this.addToCart}
            >
              Add to Cart
            </Button>
          </CardActions>
        </Card>

        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMore />}>
            <Typography className="product-heading">Description</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <div dangerouslySetInnerHTML={description} />
          </ExpansionPanelDetails>
        </ExpansionPanel>
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMore />}>
            <Typography className="product-heading">
              Warranty Details
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Typography>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Suspendisse malesuada lacus ex, sit amet blandit leo lobortis
              eget.
            </Typography>
          </ExpansionPanelDetails>
        </ExpansionPanel>
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMore />}>
            <Typography className="product-heading">
              Delivery Details
            </Typography>
          </ExpansionPanelSummary>
        </ExpansionPanel>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    product: state.catalogue.selectedProduct,
    wishlist: state.wishlist
  };
}

export default connect(mapStateToProps)(ProductDetail);
