import React, { Component } from "react";
import store from "../../store";
import { selectProduct } from "../../actions/product.select-product.action";
import { push } from "connected-react-router";
import { CurrencyFormatter } from '../../services/formatting.service';
import { AnimateKeyframes } from 'react-simple-animate';
import Confetti from 'react-confetti';

import "./ProductCard.css";

import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  CardActions
} from "@material-ui/core";

class ProductCard extends Component {
  handleClick = () => {
    localStorage.setItem("selectedProduct", JSON.stringify(this.props.product));
    store.dispatch(selectProduct(this.props.product));
    store.dispatch(push("/product-detail"));
  };

  render() {
    const usePlaceholder = this.props.product === undefined ? true : false;
    const product = this.props.product;

    let updateStockLevel = false;
    if (product !== undefined) {
      if (this.props.updatedStockId === product.id) {
        updateStockLevel = true;
      }
    }

    const strPrice = !usePlaceholder
      ? CurrencyFormatter.format(product.price)
      : "0";

    return usePlaceholder === false ? (
      <Card className="product-card" onClick={this.handleClick}>
        <CardActionArea>
          <CardMedia className="product-img" component="img" image={ product.imgUrl } />
          <CardContent className="description">
            <Typography component="p" className="title">
              {product.sku}
            </Typography>
            <Typography component="p" className="detail">
              {product.sku}
            </Typography>
          </CardContent>
          <CardActions className="detail-bar">
            <Grid container direction="column" justify="space-between">
              <Typography component="p" className="money">
                {strPrice}
              </Typography>
              { product.stock !== undefined ? (
              <AnimateKeyframes 
                play={updateStockLevel}
                durationSeconds={1}
                iterationCount={1}
                keyframes={[
                  { 0: 'transform: translateX(0%)' }, // 0%
                  { 15: 'transform: translateX(-30px) rotate(-6deg)' },
                  { 30: 'transform: translateX(15px) rotate(6deg)' },
                  { 45: 'transform: translateX(-15px) rotate(-3.6deg)' },
                  { 60: 'transform: translateX(9px) rotate(2.4deg)' },
                  { 75: 'transform: translateX(-6px) rotate(-1.2deg)' },
                  { 100: 'transform: translateX(0%)' } // 100%
                ]}>
                <Typography component="div" className="stock">
                  { product.stock.quantity } left
                </Typography>
              </AnimateKeyframes>) : null }
              { updateStockLevel ? <Confetti width={200} height={200} recycle={false} /> : null }              
            </Grid>
          </CardActions>
        </CardActionArea>
      </Card>
    ) : (
      <Card className="product-card">
        <CardActionArea>
          <div className="loading" />
          <CardContent className="description">
            <div className="text-placeholder" />
            <div className="text-placeholder" />
          </CardContent>
          <CardActions>
            <Grid container direction="column" justify="space-between">
              <Typography className="money-placeholder">R0 000.00</Typography>
              <Typography className="stock">00 Left</Typography>
            </Grid>
          </CardActions>
        </CardActionArea>
      </Card>
    );
  }
}

export default ProductCard;
