<?php

namespace App\View\Components;

use Illuminate\View\Component;

class ProductDetails extends Component {

    public function __construct() {
        
    }

    public function render() {
        return view('components.product-details');
    }
}
