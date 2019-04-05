import React, { Component } from "react";

import "./ProductPriceSlider.css";

import {
	Typography,
	Grid
} from "@material-ui/core";
import {
    Slider
} from "@material-ui/lab";

class ProductPriceSlider extends Component {
	handleValueChange = (event, value) => {
		if (this.props.onChange !== undefined) {
			this.props.onChange(value);
		}
	}

  render() {

    return (
      <div className="product-price-slider">
				<Grid container direction="row" justify="space-between">
        	<Typography id="label">{this.props.label}</Typography>
					<Typography>{this.props.value}</Typography>
				</Grid>
				<Slider className="slider-control"
					step={0.25}
					value={this.props.value}
					onChange={this.handleValueChange}
					min={this.props.minValue}
					max={this.props.maxValue} />
      </div>
    );
  }
}

ProductPriceSlider.defaultProps = {
	label: "Value:",
	minValue: 0,
	maxValue: 1000
}

export default ProductPriceSlider;
