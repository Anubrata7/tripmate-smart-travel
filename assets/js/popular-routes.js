jQuery(document).ready(function($){
    $('.popular-routes-slider-for').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        fade: true,
        autoplay: true,
        autoplaySpeed: 2800,
        asNavFor: '.popular-routes-slider-nav'
      });

      $('.popular-routes-slider-nav').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        asNavFor: '.popular-routes-slider-for',
        arrows: false,
        dots: false,
        centerMode: true,
        focusOnSelect: true
      });
})