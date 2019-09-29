(function(window, document) {
    var SALES_TOTAL_URL = "http://127.0.0.1:80/api/v1/sales/total/";
	var PRODUCT_SALES_URL = "http://127.0.0.1:80/api/v1/sales/products/";
    var SUPPLIER_SALES_URL = "http://127.0.0.1:80/api/v1/sales/suppliers/";
    var CUSTOMER_SALES_URL = "http://127.0.0.1:80/api/v1/sales/customers/";
    var CAT_SOR_SALES_URL = "http://127.0.0.1:80/api/v1/sales/category_source/";
    var SOURCES_URL = "http://127.0.0.1:80/api/v1/sources/?fields=id,name";
    var CATEGORIES_URL = "http://127.0.0.1:80/api/v1/categories/?fields=id,name";
    var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/?fields=id,name";
    var SUPPLIERS_URL = "http://127.0.0.1:80/api/v1/suppliers/?fields=id,company";
    var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/?ordering=name_sort,description_sort,size_sort";

    var sourceList = {};
    var productList = {};
    var supplierList = {};
    var customerList = {};
    var categoryList = {};
    var dateFilterBy = "dates"
    var sourcesTable = null;
    var productsTable = null;
    var suppliersTable = null;
    var customersTable = null;
    var categoriesTable = null;

    window.refreshOverviewSalesReportPage = function() {
        loadInitialData();
    }

    function format_number(n) {
        return parseFloat(n).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }

    function format_percentage(n) {
        return parseFloat(n).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,") + "%";
    }

    function format_stock(n) {
        return n.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    }

    function loadInitialData() {
        $.when($.get(PRODUCTS_URL), $.get(CUSTOMERS_URL), $.get(SUPPLIERS_URL), $.get(CATEGORIES_URL), $.get(SOURCES_URL))
            .done(function(products, customers, suppliers, categories, sources) {
                for (i in products[0]) {
                    productList[products[0][i].id] = products[0][i];
                }

                for (i in customers[0]) {
                    customerList[customers[0][i].id] = customers[0][i].name;
                }

                for (i in suppliers[0]) {
                    supplierList[suppliers[0][i].id] = suppliers[0][i].company;
                }

                for (i in categories[0]) {
                    categoryList[categories[0][i].id] = categories[0][i].name;
                }

                for (i in sources[0]) {
                    sourceList[sources[0][i].id] = sources[0][i].name;
                }

                loadSalesData();
            });
    }

    function loadSalesData() {
        // Construct filter url
        if (dateFilterBy == "month") {
            month = $("#overview-sales-report-by-month-input-month").val();
            year = $("#overview-sales-report-by-month-input-year").val();

            if (!month || !year) {
                return;
            }

            filterURL = "month=" + month + "&year=" + year;
        } else if (dateFilterBy == "year") {
            filterURL = "year=" + $("#overview-sales-report-by-year-input").val();
        } else {  // filter by custom dates
            startDate = $("#overview-sales-report-by-date-input").data('daterangepicker')
                                                                 .startDate.format("YYYY-MM-DD") + "+00:00:00";
            endDate = $("#overview-sales-report-by-date-input").data('daterangepicker')
                                                               .endDate.format("YYYY-MM-DD") + "+23:59:59";
            filterURL = "date_start=" + startDate + "&date_end=" + endDate;
        }

        // Update total stats
        $.get(SALES_TOTAL_URL + "?" + filterURL)
            .done(function(total) {
                sales = (total[0]["sales"] > 0.0) ? total[0]["sales"] : 0.0
                profit = (total[0]["profit"] > 0.0) ? total[0]["profit"] : 0.0
                margin = (sales > 0.0) ? (profit / sales) * 100 : "0.0%";

                $("#overview-sales-report-total-sales").val(format_number(sales)).trigger("change");
                $("#overview-sales-report-total-profit").val(format_number(profit)).trigger("change");
                $("#overview-sales-report-profit-margin").val(format_percentage(margin)).trigger("change");
            })
            .fail(function() {
                console.log("Failed to get total sales.");
            });

        $.get(PRODUCT_SALES_URL + "?" + filterURL + "&group_by=product")
                .done(function(sales) {
                    productsTable.clear().draw();
                    productsTable.rows.add(sales);
                    productsTable.columns.adjust().draw();
                })
                .fail(function() {
                    console.log("Failed to get sales data per product.");
                });

        $.get(CAT_SOR_SALES_URL + "?" + filterURL + "&type=category&group_by=requested_type")
                .done(function(sales) {
                    categoriesTable.clear().draw();
                    categoriesTable.rows.add(sales);
                    categoriesTable.columns.adjust().draw();
                })
                .fail(function() {
                    console.log("Failed to get sales data per category.");
                });

        $.get(CAT_SOR_SALES_URL + "?" + filterURL + "&type=source&group_by=requested_type")
                .done(function(sales) {
                    sourcesTable.clear().draw();
                    sourcesTable.rows.add(sales);
                    sourcesTable.columns.adjust().draw();
                })
                .fail(function() {
                    console.log("Failed to get sales data per source.");
                });

        $.get(SUPPLIER_SALES_URL + "?" + filterURL + "&group_by=supplier")
                .done(function(sales) {
                    suppliersTable.clear().draw();
                    suppliersTable.rows.add(sales);
                    suppliersTable.columns.adjust().draw();
                })
                .fail(function() {
                    console.log("Failed to get sales data per supplier.");
                });

        $.get(CUSTOMER_SALES_URL + "?" + filterURL + "&group_by=customer")
                .done(function(sales) {
                    customersTable.clear().draw();
                    customersTable.rows.add(sales);
                    customersTable.columns.adjust().draw();
                })
                .fail(function() {
                    console.log("Failed to get sales data per customer.");
                });
    }

    function setupEventTriggers() {
        // Date search change
        $("#overview-sales-report-by-month-input-month,\
           #overview-sales-report-by-month-input-year,\
           #overview-sales-report-by-year-input").on('change', function(event, params) {
            loadInitialData();
        });

        // Date checkboxes
        $("#overview-sales-report-by-month-btn").on('change', function(event, params) {
            $("#overview-sales-report-by-month").removeClass("hide");
            $("#overview-sales-report-by-date").addClass("hide");
            $("#overview-sales-report-by-year").addClass("hide");

            dateFilterBy = "month";
            loadInitialData();
            $("#overview-sales-report-by-month-input-month").focus();
        });

        $("#overview-sales-report-by-year-btn").on('change', function(event, params) {
            $("#overview-sales-report-by-month").addClass("hide");
            $("#overview-sales-report-by-date").addClass("hide");
            $("#overview-sales-report-by-year").removeClass("hide");

            dateFilterBy = "year";
            loadInitialData();
            $("#overview-sales-report-by-year-input").focus();
        });

        $("#overview-sales-report-by-date-btn").on('change', function(event, params) {
            $("#overview-sales-report-by-month").addClass("hide");
            $("#overview-sales-report-by-date").removeClass("hide");
            $("#overview-sales-report-by-year").addClass("hide");

            dateFilterBy = "day";
            loadInitialData();
        });

        // Daterangepicker date selection change
        $("#overview-sales-report-by-date-input").on('apply.daterangepicker', function(event, picker) {
            loadInitialData();
        });
    }

    $(document).ready(function() {
        // Setup products table
        productsTable = $("#overview-sales-report-products-table").DataTable({
            columns: [
                {
                    data: 'product',
                    orderable: false,
                    render: function(data, type, row) {
                        return productList[data].name;
                    },
                },
                {
                    orderable: false,
                    render: function(data, type, row) {
                        var id = row['product'];
                        return productList[id].description;
                    },
                },
                {
                    orderable: false,
                    render: function(data, type, row) {
                        var id = row['product'];
                        return productList[id].size;
                    },
                },
                {
                    orderable: false,
                    render: function(data, type, row) {
                        var id = row['product'];
                        var supplier = supplierList[productList[id].supplier];
                        return supplier.length > 20 ? supplier.substr(0, 20) + '...' : supplier;
                    },
                },
                {
                    data: 'sales',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_number(data);
                    },
                },
                {
                    data: 'units',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_stock(data);
                    },
                },
            ],
            order: [[4, 'desc']],
            select: {
                style: 'api',
            },
            scroller: {
                displayBuffer: 8,
            },
            dom: 't',
            paging: true,
            pageLength: 20,
            autoWidth: true,
            deferRender: true,
            scrollY: '35vh',
            scrollCollapse: true,
        });

        // Suppliers table
        suppliersTable = $("#overview-sales-report-suppliers-table").DataTable({
            columns: [
                {
                    data: 'supplier',
                    orderable: false,
                    render: function(data, type, row) {
                        var supplier = supplierList[data];
                        return supplier.length > 25 ? supplier.substr(0, 25) + '...' : supplier;
                    },
                },
                {
                    data: 'sales',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_number(data);
                    },
                },
                {
                    data: 'profit',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_number(data);
                    },
                },
                {
                    data: 'units',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_stock(data);
                    },
                },            ],
            order: [[1, 'desc']],
            select: {
                style: 'api',
            },
            dom: 't',
            scroller: true,
            autoWidth: true,
            scrollY: '35vh',
            scrollCollapse: true,
        });

        // Categories table
        categoriesTable = $("#overview-sales-report-categories-table").DataTable({
            columns: [
                {
                    data: 'requested_type',
                    orderable: false,
                    render: function(data, type, row) {
                        return categoryList[data];
                    },
                },
                {
                    data: 'sales',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_number(data);
                    },
                },
                {
                    data: 'profit',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_number(data);
                    },
                },
                {
                    data: 'units',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_stock(data);
                    },
                },
            ],
            order: [[1, 'desc']],
            select: {
                style: 'api',
            },
            dom: 't',
            scroller: true,
            autoWidth: true,
            scrollY: '35vh',
            scrollCollapse: true,
        });

        // Sources table
        sourcesTable = $("#overview-sales-report-sources-table").DataTable({
            columns: [
                {
                    data: 'requested_type',
                    orderable: false,
                    render: function(data, type, row) {
                        return sourceList[data];
                    },
                },
                {
                    data: 'sales',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_number(data);
                    },
                },
                {
                    data: 'profit',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_number(data);
                    },
                },
                {
                    data: 'units',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_stock(data);
                    },
                },
            ],
            order: [[1, 'desc']],
            select: {
                style: 'api',
            },
            dom: 't',
            scroller: true,
            autoWidth: true,
            scrollY: '35vh',
            scrollCollapse: true,
        });

        // Customers table
        customersTable = $("#overview-sales-report-customers-table").DataTable({
            columns: [
                {
                    data: 'customer',
                    orderable: false,
                    render: function(data, type, row) {
                        return customerList[data];
                    },
                },
                {
                    data: 'sales',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_number(data);
                    },
                },
                {
                    data: 'profit',
                    type: 'num-fmt',
                    render: function(data, type, row) {
                        return format_number(data);
                    },
                },
            ],
            order: [[1, 'desc']],
            select: {
                style: 'api',
            },
            dom: 't',
            rowId: 'id',
            scroller: true,
            autoWidth: true,
            scrollY: '35vh',
            scrollCollapse: true,
        });

        // Search date range
        $("#overview-sales-report-by-date-input").daterangepicker({
            showDropdowns: true,
            drops: 'down',
            ranges: {
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
        });

        currentDate = new Date();
        $("#overview-sales-report-by-year-input").val(currentDate.getFullYear());
        $("#overview-sales-report-by-month-input-year").val(currentDate.getFullYear());
        $("#overview-sales-report-by-month-input-month").val(currentDate.getMonth() + 1);

        loadInitialData();
        setupEventTriggers();
    });
})(window, document);

//# sourceURL=product_sales_report.js