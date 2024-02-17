@include('header')
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
        <a href="/wholesale-shop" class="inner-manufacture">
          <img src="/images/jeans-pant-main.jpg" alt="jeans pants" />
          <span class="product-category">Jeans Pants</span>
        </a>
      </li>
      <li class="col-lg-3">
        <a href="/wholesale-shop" class="inner-manufacture">
          <img src="/images/jeans-jacket-main.jpg" alt="Jeans Jackets" />
          <span class="product-category">Jeans Jackets</span>
        </a>
      </li>
      <li class="col-lg-3">
        <a href="/wholesale-shop" class="inner-manufacture">
          <img src="/images/jeans-shirt-main.jpg" alt="jeans shirts" />
          <span class="product-category">Jeans Shirts</span>
        </a>
      </li>
      <li class="col-lg-3">
        <a href="/wholesale-shop" class="inner-manufacture">
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
        <a href="/wholesale-shop" class="inner-manufacture">
          <img src="/images/women-jeans.jpg" alt="jeans pants" />
          <span class="product-category">Jeans Pants</span>
        </a>
      </li>
      <li class="col-lg-3">
        <a href="/wholesale-shop" class="inner-manufacture">
          <img src="/images/women-jacket.jpg" alt="Jeans Jackets" />
          <span class="product-category">Jeans Jackets</span>
        </a>
      </li>
      <li class="col-lg-3">
        <a href="/wholesale-shop" class="inner-manufacture">
          <img src="/images/women-shirt.jpg" alt="jeans shirts" />
          <span class="product-category">Jeans Shirts</span>
        </a>
      </li>
      <li class="col-lg-3">
        <a href="/wholesale-shop" class="inner-manufacture">
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
  <div class="mb-5">
    <h3 class="section-heading">Rating & Reviews</h3>
    <ul class="row">
      <li class="col-lg-3">
        <div class="inner-rating inner-manufacture">
          <p>We orders 500 women jackets, delivery was on time and quality was also good, we repeated our order</p>
          <div class="rating-wrap">
            <ul class="star-rating">
              <li class="star"></li>
              <li class="star"></li>
              <li class="star"></li>
              <li class="star"></li>
              <li class="star"></li>
            </ul>
            <p class="reviewer-info">
              <span class="reviewer-name">Brand Owner</span>, 
              <span class="reviewer-name">USA</span>
            </p>
          </div>
        </div>
      </li>
      <li class="col-lg-3">
        <div class="inner-rating inner-manufacture">
          <p>Pants quality was awesome but shipment was 2 weeks late, had not much good expeience but will try them again</p>
          <div class="rating-wrap">
            <ul class="star-rating">
              <li class="star"></li>
              <li class="star"></li>
            </ul>
            <p class="reviewer-info">
              <span class="reviewer-name">Wholesaler</span>, 
              <span class="reviewer-name">UK</span>
            </p>
          </div>
        </div>
      </li>
      <li class="col-lg-3">
        <div class="inner-rating inner-manufacture">
          <p>Awesome quality better than China, Pakistani jeans have real denim looks and price is also cheap, regular client of PK apparel</p>
          <div class="rating-wrap">
            <ul class="star-rating">
              <li class="star"></li>
              <li class="star"></li>
              <li class="star"></li>
              <li class="star"></li>
              <li class="star"></li>
            </ul>
            <p class="reviewer-info">
              <span class="reviewer-name">Store Owner</span>,
              <span class="reviewer-name">Germany</span>
            </p>
          </div>
        </div>
      </li>
      <li class="col-lg-3">
        <div class="inner-rating inner-manufacture">
          <p>Communication is bit slow but overall expeience of denim quality and on time delivery is good, anyway liked them</p>
          <div class="rating-wrap">
            <ul class="star-rating">
              <li class="star"></li>
              <li class="star"></li>
              <li class="star"></li>
              <li class="star"></li>
            </ul>
            <p class="reviewer-info">
              <span class="reviewer-name">Amazon Retailer</span>, 
              <span class="reviewer-name">UK</span>
            </p>
          </div>
        </div>
      </li>
    </ul>
  </div>
  <div class="mb-5">
    <h3 class="section-heading">Questions - FAQs</h3>
    <div class="faqs-list" itemScope itemType="https://schema.org/FAQPage">
      <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
        <h3 itemProp="name">What is your MOQ per article?</h3>
        <div class="accepted-answer" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
          <div itemProp="text">Our MOQ is 500 pieces per article, single color and 6 sizes max</div>
        </div>
      </div>
      <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
        <h3 itemProp="name">What is your MOQ per order?</h3>
        <div class="accepted-answer" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
          <div itemProp="text">Our MOQ is 2000 pieces per order, 4 articles max </div>
        </div>
      </div>
      <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
        <h3 itemProp="name">Do you send samples and how much it costs?</h3>
        <div class="accepted-answer" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
          <div itemProp="text">Yes, we send samples and for available samples cost per piece is $50 including shipping worldwide delivered in 24 hours. <br/><br/>
          <strong>For custom design samples </strong>cost is according to design and delivered in 2 weeks.</div>
        </div>
      </div>
      <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
        <h3 itemProp="name">Are you manufacturer, wholesaler or trader?</h3>
        <div class="accepted-answer" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
          <div itemProp="text">We have our own manufacturing unit with capacity of 3000 pieces per day</div>
        </div>
      </div>
      <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
        <h3 itemProp="name">What is your order delivery time?</h3>
        <div class="accepted-answer" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
          <div itemProp="text">Our order delivery time is 3-4 weeks after order confirmation</div>
        </div>
      </div>
      <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
        <h3 itemProp="name">What shipping modes you are working?</h3>
        <div class="accepted-answer" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
          <div itemProp="text">Ex-factory, FOB, CIF etc</div>
        </div>
      </div>
      <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
        <h3 itemProp="name">What payment methods do you accept?</h3>
        <div class="accepted-answer" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
          <div itemProp="text">
            <strong>For Samples: </strong>Credit/Debit Card, Western Union etc.<br/><br/>
            <strong>For Orders: </strong>LC, Bank Transfers etc.
          </div>
        </div>
      </div>
    </div>
  </div>
@include('footer')