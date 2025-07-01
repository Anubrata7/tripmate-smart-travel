jQuery(document).ready(function($){
    $('.banner-slider-for').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        fade: true,
        autoplay: true,
        autoplaySpeed: 2500,
        asNavFor: '.banner-slider-nav'
      });

      $('.banner-slider-nav').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        asNavFor: '.banner-slider-for',
        arrows: false,
        dots: false,
        centerMode: true,
        focusOnSelect: true
      });
})