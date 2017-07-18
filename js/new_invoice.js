$(function() {
    var availableProducts = [
        "ActionScript",
        "Boostrap",
        "C",
        "C++",
    ];
    $("#product-automplete").autocomplete({
        source: availableProducts
    });
});