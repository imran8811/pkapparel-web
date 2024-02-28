<?php

namespace App\View\Components;

use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class Header extends Component
{
    public $title;
    public $keywords;
    public $description;
    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct($title, $keywords, $description){
        // dd($title);
        $this->title = $title;
        $this->keywords = $keywords;
        $this->description = $description;
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render(): View
    {
        return view('components.header');
    }
}
