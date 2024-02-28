<?php

namespace App\View\Components\men;

use Illuminate\View\Component;

class MenJeansPants extends Component{
    
    public $menJeansPants;

    public function __construct(){
        
    }

    public function render(){
        return view('components.men.jeans-pants');
    }
}
