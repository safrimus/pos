$(document).ready(function(){
    $(".submenu").hide();

    $("#home").on('click', function(event, params) {
        $(".submenu").hide("fast");
        $("#main-menu").delay(50).show("fast");
    });

    // Invoice submenu
    $("#invoice").on('click', function(event, params) {
        $("#main-menu").hide("fast");
        $("#invoice-menu").delay(50).show("fast");
    });

    // Sales stats submenu
    $("#sales-stats").on('click', function(event, params) {
        $("#main-menu").hide("fast");
        $("#sales-stats-menu").delay(50).show("fast");
    });

    // Graphs submenu
    $("#graphs").on('click', function(event, params) {
        $("#sales-stats-menu").hide("fast");
        $("#sales-graphs-menu").delay(50).show("fast");
    });

    // Load new_invoices
    $("#new-invoice").on('click', function(event, params) {
        $("#active-form").load("html/new_invoice.html");
    });

    // Load products
    $("#products").on('click', function(event, params) {
        $("#active-form").load("html/products.html");
    });

    // Load invoices
    $("#invoices").on('click', function(event, params) {
        $("#active-form").load("html/invoices.html");
    });

    // Load suppliers
    $("#suppliers").on('click', function(event, params) {
        $("#active-form").load("html/suppliers.html");
    });

    // Load customers
    $("#customers").on('click', function(event, params) {
        $("#active-form").load("html/customers.html");
    });

    // Load stock details
    $("#stock").on('click', function(event, params) {
        $("#active-form").load("html/stock.html");
    });

    // Load graphs
    $("#total-graph").on('click', function(event, params) {
        $("#active-form").load("html/total_graph.html");
    });

    $("#category-graph").on('click', function(event, params) {
        $("#active-form").load("html/category_graph.html");
    });
});
