<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{$title}}</title>
  <meta name="keywords" content="{{$keywords}}" />
  <meta name="description" content="{{$description}}" />
  <meta name="google-site-verification" content="WlphvHVaVW1jVWUufak-1TfWkjBAvf271H95iMGwtSw" />
  <!-- <script async src="https://www.googletagmanager.com/gtag/js?id=UA-71901684-1"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'UA-71901684-1');
  </script> -->
  <!-- Global site tag (gtag.js) - Google Analytics -->
  <!-- <script async src="https://www.googletagmanager.com/gtag/js?id=G-TTX4WPE230"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-TTX4WPE230');
  </script> -->
  <link rel="icon" type="image/x-icon" href="{{url('/')}}/images/favicon.png">
  <link rel="stylesheet" href="{{url('/')}}/css/bootstrap.min.css">
  <link rel="stylesheet" href="{{url('/')}}/css/style.css">
  <script type="script">
    swiperConfig: SwiperOptions = {
      slidesPerView: 1,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false
      },
      breakpoints:{
        640:{
          slidesPerView: 1, 
        }
      }
    };
  </script>  
</head>
<body>
  <div class="container main-wrapper">
    <header class='row border-bottom border-info mb-4 pb-3'>
      <div class="col-4 pt-3">
        <a href="/" class="logo">
          <img src="/images/logo.jpg" alt="logo" title="PK Apparel Home" />
        </a>
      </div>
      <div class='col-8 mt-4 text-end'>
        <nav class="main-menu mobile">
          <i class="menu-icon" (click)="toggleMenu()">Menu</i>
          <ul>
            {{-- <li><a href="/wholesale-shop">Wholesale Shop</a></li> --}}
            <li><a href="/about">About us</a></li>
            <li><a href="/factory">Factory</a></li>
            <li><a href="/certifications">Certifications</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/contact">Contact us</a></li>
          </ul>
        </nav>
      </div>
    </header>