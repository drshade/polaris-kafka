import React, { Component } from "react";
import store from "../../store";

import "./ProductCatalogue.css";

import { connect } from "react-redux";
import { createSelector } from "reselect";
import { matchPath } from 'react-router-dom';

import { queryProducts } from "../../actions/product.query-products.action";
import { sortProducts } from "../../actions/product.sort-products.action";
import { filterProductsByPrice } from "../../actions/product.price-filter.action";

import {
  Toolbar,
  Select,
  FormControl,
  MenuItem,
  Divider,
  Grid,
  Button,
  Fade,
  Menu
} from "@material-ui/core";

import ProductCard from "../product-card/ProductCard";
import ProductPriceSlider from "../product-price-slider/ProductPriceSlider"

const stateSelector = state => state;
const productFilterSelector = state => state.filter;

let getCustomAttribute = (product, code) => {
  const value = "";
  if (product !== undefined && product.custom_attributes !== undefined && product.custom_attributes.length > 0) {
    const attribute = product.custom_attributes.find(attr => attr.attribute_code === code);
    if (attribute !== undefined)
      return attribute.value
  };

  return value;
};

let getImgUrl = (product) => {
  return product.media_gallery_entries !== undefined && product.media_gallery_entries.length > 0
    ? "https://magento.p1.s7s.cloud/pub/media/catalog/product" + product.media_gallery_entries[0].file
    : "/assets/images/no_image_available.svg";
};

const combineSelector = createSelector(
  [stateSelector],
  (state) => {
    let newProducts = state.products.map((product) => {
      //let stock = state.stockLevels.find(stock => stock.id === product.id);
      return {
        ...product, 
        stock: state.stockLevels.find(stock => stock.id === product.id), 
        description: getCustomAttribute(product, "description"), 
        imgUrl: getImgUrl(product) 
      };
    });
    return newProducts;
  }
);

//Filter out all the Not Available or Out of stock items.
//Filter out all the products by the price sliders.
const filterSelector = createSelector(
  [combineSelector, productFilterSelector],
  (products, filter) => {
    let items = products.filter(
      item => item.stock === undefined ||
          (item.stock !== undefined && item.stock.isAvailable)      
    );
    items = items.filter(
      item => (item.price >= filter.minValue && item.price <= filter.maxValue)
    );
    return items;
  }    
);

//Sort by price value
const sortSelector = createSelector(
  [filterSelector, productFilterSelector],
  (products, filter) => {
    const sortedProducts = [].concat(products).sort((a, b) => {
      let res = 0;
      if (a.price > b.price) res = 1;
      else if (a.price < b.price) res = -1;
      else return (0);
      return filter.sortOrder === 0 ? res * -1 : res;
    });
    return sortedProducts;
  }
);

class ProductCatalogue extends Component {
  state = {
    priceFilter: 0,
    popperAnchor: null,
    popperOpen: false
  };

  priceFilterChanged(ent) {
    this.setState({ priceFilter: ent.target.value });
    store.dispatch(sortProducts(ent.target.value));
  }

  handleOpenPopper = (event) => {
    const { currentTarget } = event;
    this.setState(state => ({
      popperAnchor: currentTarget,
      popperOpen: !state.popperOpen,
    }));
  }

  handleClose = () => {
    this.setState(state => ({
      popperAnchor: null,
      popperOpen: !state.popperOpen,
    }));
  }

  handleMaxValueChange = (val) => {
    store.dispatch(filterProductsByPrice(
      this.props.filter.minValue,
      val
    ));
  }
  handleMinValueChange = (val) => {
    store.dispatch(filterProductsByPrice(
      val,
      this.props.filter.maxValue
    ));
  }

  componentWillMount() {
    store.dispatch(queryProducts(this.props.category));
  }

  render() {
    const productElements = this.props.products.map(product => {
      return (
        <Grid item xs={6} sm={3} md={3} lg={1} key={product.id}>
          <ProductCard
            key={product.id}
            product={product}
            updatedStockId={this.props.lastUpdatedStockId}
          />
        </Grid>
      );
    });

    var placeHolders = [];
    for (var i = -4; i < 0; i++) {
      placeHolders.push(
      <Grid item xs={6} sm={3} md={3} lg={1} key={i}>
        <ProductCard key={i} product={undefined}></ProductCard>
      </Grid>);
    }

    return (
      <div className="product-root">
        <div className="product-filter">
          <Toolbar>
            <Grid container direction="row" justify="space-between">
              <form autoComplete="off">
                <FormControl>
                   <Select
                    value={this.state.priceFilter}
                    onChange={e => this.priceFilterChanged(e)}
                  >
                    <MenuItem value={0}>Price High to Low</MenuItem>
                    <MenuItem value={1}>Price Low to High</MenuItem>
                  </Select>
                </FormControl>
              </form>
              <Button className="filter-button"
                aria-owns={ this.state.popperOpen ? 'product-filter-menu' : undefined }
                aria-haspopup="true"
                onClick={this.handleOpenPopper}>Filter</Button>
              <Menu
                id="product-filter-menu"
                anchorEl={this.state.popperAnchor}
                open={this.state.popperOpen}
                onClose={this.handleClose}
                TransitionComponent={Fade}
              >
                <MenuItem>
                  <ProductPriceSlider label="Max Value:" 
                    minValue={this.props.filter.minValue} 
                    maxValue={this.props.filter.fixedMax}
                    value={this.props.filter.maxValue}
                    onChange={this.handleMaxValueChange}/>
                </MenuItem>
                <Divider/>
                <MenuItem>
                  <ProductPriceSlider label="Min Value:" 
                    minValue={this.props.filter.fixedMin} 
                    maxValue={this.props.filter.maxValue} 
                    value={this.props.filter.minValue}
                    onChange={this.handleMinValueChange}/>
                </MenuItem>
              </Menu>
            </Grid>
          </Toolbar>          
          <Divider />
        </div>

        <Grid container className="product-content">
          {productElements.length !== 0 ? productElements : placeHolders}
        </Grid>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const match = matchPath(state.router.location.pathname, {
    path: '/products-catalogue/:category'
  });
  let category = 0;
  if (match !== null) {
    category = match.params.category;
  }

  return {
    products: sortSelector({
      products: state.catalogue.products,
      stockLevels: state.catalogue.stockLevels,
      filter: state.catalogue.filter
    }),
    lastUpdatedStockId: state.catalogue.lastStockUpdatedId,
    filter: state.catalogue.filter,
    category: parseInt(category)
  };
}

export default connect(mapStateToProps)(ProductCatalogue);
