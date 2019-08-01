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
        $(".submenu").hide();

        $("#home").on('click', function(event, params) {
            $(".submenu").hide("fast");
            $("#main-menu").delay(50).show("fast");
        });

        // Admin page
        $("#admin").on('click', function(event, params) {
            loadPage("admin-form", "admin.html", window.refreshAdminPage);
        });

        // Invoice submenu
        $("#invoice").on('click', function(event, params) {
            $("#main-menu").hide("fast");
            $("#invoice-menu").delay(50).show("fast");
            loadPage("new-invoice-form", "new_invoice.html", window.refreshNewInvoicePage);
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
            loadPage("total-sales-profit-graph", "total_graph.html", window.refreshTotalGraphPage);
        });

        // Reports submenu
        $("#reports").on('click', function(event, params) {
            $("#sales-stats-menu").hide("fast");
            $("#sales-reports-menu").delay(50).show("fast");
            loadPage("product-sales-report", "product_sales_report.html", window.refreshProductSalesReportPage);
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
        $("#stock").on('click', function(event, params) {
            loadPage("stock-form", "stock.html", window.refreshStockPage);
        });

        // Load graphs
        $("#total-graph").on('click', function(event, params) {
            loadPage("total-sales-profit-graph", "total_graph.html", window.refreshTotalGraphPage);
        });

        $("#category-graph").on('click', function(event, params) {
            $("#active-form").prop("graph", "category");
            loadPage("category-sales-graph", "category_sales_graph.html", window.refreshCategoryGraphPage);
        });

        $("#source-graph").on('click', function(event, params) {
            $("#active-form").prop("graph", "source");
            loadPage("source-sales-graph", "source_sales_graph.html", window.refreshSourceGraphPage);
        });

        // Load reports
        $("#product-report").on('click', function(event, params) {
            loadPage("product-sales-report", "product_sales_report.html", window.refreshProductSalesReportPage);
        });

        // Load unpaid invoices
        $("#unpaid-invoices").on('click', function(event, params) {
            loadPage("unpaid-invoices-form", "unpaid_invoices.html", window.refreshUnpaidInvoices);
        });
    });
})(window, document);
