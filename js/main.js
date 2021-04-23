(function(window, document) {
    function loadPage(domID, fileName, refreshPage)
    {
        $(".top-level-form").hide();

        if ($("#" + domID).is(':hidden')) {
            refreshPage();
            $("#" + domID).show();
        } else {
            $.get("html/" + fileName, function(data) {
                $("#active-form").append(data);
            })
        }
    }

    $(document).ready(function(){
        // Admin page
        $("#admin").on('click', function(event, params) {
            loadPage("admin-form", "admin.html", window.refreshAdminPage);
        });

        // Load new_invoices
        $("#new-invoice").on('click', function(event, params) {
            loadPage("new-invoice-form", "new_invoice.html", window.refreshNewInvoicePage);
        });

        // Load products
        $("#products").on('click', function(event, params) {
            loadPage("products-form", "products.html", window.refreshProductsPage);
        });

        // Load invoices
        $("#invoices").on('click', function(event, params) {
            loadPage("search-invoices-form", "invoices.html", window.refreshSearchInvoicesPage);
        });

        // Load suppliers
        $("#suppliers").on('click', function(event, params) {
            loadPage("suppliers-form", "suppliers.html", window.refreshSuppliersPage);
        });

        // Load customers
        $("#customers").on('click', function(event, params) {
            loadPage("customers-form", "customers.html", window.refreshCustomersPage);
        });

        // Load stock details
        $("#stock-overview-menu").on('click', function(event, params) {
            loadPage("stock-form", "stock.html", window.refreshStockPage);
        });
        $("#stock-forecast-menu").on('click', function(event, params) {
            loadPage("stock-forecast-form", "stock_forecast.html", window.refreshStockForecastPage);
        });

        // Load unpaid invoices
        $("#unpaid-invoices").on('click', function(event, params) {
            loadPage("unpaid-invoices-form", "unpaid_invoices.html", window.refreshUnpaidInvoices);
        });
    });
})(window, document);
