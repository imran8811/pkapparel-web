<?php
$metaData = [
  "title" => "PK Apparel - Jeans Manufacturer and Wholesaler",
  "keywords" => "Jeans manufacturers, Jeans Pants Manufacturers, Jeans Wholesale",
  "description" => "Manufacturer and exporter of denim products, jeans pants, jeans jackets, jeans shorts for men, women and kids"
]
?>
<x-header 
  :title="$metaData['title']"
  :keywords="$metaData['keywords']"
  :description="$metaData['description']"
/>
  <div class="mb-5">
    <swiper class="my-swiper" [config]="swiperConfig">
      {{-- <ng-template swiperSlide><img src="/images/gallery/banner-1.jpg"></ng-template> --}}
      <ng-template swiperSlide><img src="/images/gallery/banner-2.jpg"></ng-template>
      {{-- <ng-template swiperSlide><img src="/images/gallery/banner-3.jpg"></ng-template> --}}
    </swiper>
  </div>
  <div class="mb-5">
    <strong class="section-heading">How It Works</strong>
    <ul class="row">
      <li class="col-lg-4">
        <strong>Inquiry Details</strong>
        <p>Product inquiry details like colors, sizes, quantity and design are received and reviewed</p>
      </li>
      <li class="col-lg-4">
        <strong>Quotation</strong>
        <p>Prices are quoted according to the received details</p>
      </li>
      <li class="col-lg-4">
        <strong>Sampling</strong>
        <p>Once prices are finalized then samples are being produced and dispatched</p>
      </li>
      <li class="col-lg-4">
        <strong>Production</strong>
        <p>After samples approval and advance payment receipt we start order production process until the shipment is ready</p>
      </li>
      <li class="col-lg-4">
        <strong>Delivery</strong>
        <p>Once shipment is ready we arrange pickup or delivery according to the terms finalized with buyer</p>
      </li>
    </ul>
  </div>
  <div class="mb-5">
    <h2 class="section-heading">Jeans for Men</h2>
    <ul class="row">
      <li class="col-lg-3">
        <a href="#" class="inner-manufacture">
          <img src="/images/jeans-pant-main.jpg" alt="jeans pants" />
          <span class="product-category">Jeans Pants</span>
        </a>
      </li>
      <li class="col-lg-3">
        <a href="#" class="inner-manufacture">
          <img src="/images/jeans-jacket-main.jpg" alt="Jeans Jackets" />
          <span class="product-category">Jeans Jackets</span>
        </a>
      </li>
      <li class="col-lg-3">
        <a href="#" class="inner-manufacture">
          <img src="/images/jeans-shirt-main.jpg" alt="jeans shirts" />
          <span class="product-category">Jeans Shirts</span>
        </a>
      </li>
      <li class="col-lg-3">
        <a href="#" class="inner-manufacture">
          <img src="/images/jeans-short-main.jpg" alt="jeans shorts" />
          <span class="product-category">Jeans Shorts</span>
        </a>
      </li>
    </ul>
  </div>
  <div class="mb-5">
    <h2 class="section-heading">Jeans for Women</h2>
    <ul class="row">
      <li class="col-lg-3">
        <a href="#" class="inner-manufacture">
          <img src="/images/women-jeans.jpg" alt="jeans pants" />
          <span class="product-category">Jeans Pants</span>
        </a>
      </li>
      <li class="col-lg-3">
        <a href="#" class="inner-manufacture">
          <img src="/images/women-jacket.jpg" alt="Jeans Jackets" />
          <span class="product-category">Jeans Jackets</span>
        </a>
      </li>
      <li class="col-lg-3">
        <a href="#" class="inner-manufacture">
          <img src="/images/women-shirt.jpg" alt="jeans shirts" />
          <span class="product-category">Jeans Shirts</span>
        </a>
      </li>
      <li class="col-lg-3">
        <a href="#" class="inner-manufacture">
          <img src="/images/women-short.jpg" alt="jeans shorts" />
          <span class="product-category">Jeans Shorts</span>
        </a>
      </li>
    </ul>
  </div>
  <div class="mb-5">
    <div class="section-heading">Why choose us</div>
    <div class="row">
      <div class="col-lg-4">
        <strong class="sub-head">ISO Certified</strong>
        <p>We are ISO 9001:2008 certified company, certification is a useful tool to add credibility, by demonstrating that your product or service meets the expectations of your customers.</p>
      </div>
      <div class="col-lg-4">
        <strong class="sub-head">Best Prices</strong>
        <p>Our prices are unbeatable, Our FOB prices for best quality jeans pants ranges from $4 - $8 depends on buyer&apos;s styling and design requirements.</p>
      </div>
      <div class="col-lg-4">
        <strong class="sub-head">On Time Shipment</strong>
        <p>We have delivered 80% of our shipments on time, We are highly expert in our field and have time estimates of every process it takes to complete shipment.</p>
      </div>
    </div>
  </div>
@include('shared/rating-reviews')
@include('shared/faqs')
<x-footer />