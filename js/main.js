$(document).ready(function(){
    $(".submenu").hide();

    $("#home").on('click', function(event, params) {
        $(".submenu").hide("fast");
        $("#main-menu").delay(50).show("fast");
    });

    // Invoice menu
    $("#invoice").on('click', function(event, params) {
        $("#main-menu").hide("fast");
        $("#invoice-menu").delay(50).show("fast");
    });

    // Credit menu
    $("#credit").on('click', function(event, params) {
        $("#main-menu").hide("fast");
        $("#credit-menu").delay(50).show("fast");
    });

    // Stock menu
    $("#stock").on('click', function(event, params) {
        $("#main-menu").hide("fast");
        $("#stock-menu").delay(50).show("fast");
    });

    // Sales Reports menu
    $("#sales-reports").on('click', function(event, params) {
        $("#main-menu").hide("fast");
        $("#sales-reports-menu").delay(50).show("fast");
    });

    // Load new_invoices
    $("#new-invoice").on('click', function(event, params) {
        $("#active-form").load("new_invoice.html");
    });

    // Load new_invoices
    $("#products").on('click', function(event, params) {
        $("#active-form").load("products.html");
    });
});
