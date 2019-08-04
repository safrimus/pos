(function(window, document) {
	var SALES_URL = "http://127.0.0.1:80/api/v1/sales/products/";
    var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/?fields=id,name";
    var SUPPLIERS_URL = "http://127.0.0.1:80/api/v1/suppliers/?fields=id,company";
    var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/?ordering=name_sort,description_sort,size_sort";

    var supplierList = {};
    var customerList  = {};
    var dateFilterBy = "dates"
	var productsTable = null;
    var customersTable = null;

    window.refreshProductSalesReportPage = function() {
        loadInitialData();
        productsTable.ajax.reload();
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
        $.get(CUSTOMERS_URL)
            .done (function(customers) {
                for (i in customers) {
                    customerList[customers[i].id] = customers[i].name;
                }
            })
            .fail(function() {
                console.log("Failed to get customers.");
            });

        $.get(SUPPLIERS_URL)
            .done (function(suppliers) {
                for (i in suppliers) {
                    supplierList[suppliers[i].id] = suppliers[i].company;
                }
            })
            .fail(function() {
                console.log("Failed to get suppliers.");
            });

        currentDate = new Date();
        $("#product-sales-report-by-year-input").val(currentDate.getFullYear());
        $("#product-sales-report-by-month-input-year").val(currentDate.getFullYear());
        $("#product-sales-report-by-month-input-month").val(currentDate.getMonth());
    }

    function setupEventTriggers() {
        // Select invoice
        productsTable.on('select', function(e, dt, type, indexes) {
            productID = productsTable.rows(indexes).data()[0].id;
            filterURL = "year=2019";

            if (dateFilterBy == "month") {
                month = $("#product-sales-report-by-month-input-month").val();
                year = $("#product-sales-report-by-month-input-year").val();

                if (!month || !year) {
                    return;
                }

                filterURL = "month=" + month + "&year=" + year;
            } else if (dateFilterBy == "year") {
                filterURL = "year=" + $("#product-sales-report-by-year-input").val();
            } else {  // filter by custom dates
                startDate = $("#product-sales-report-by-date-input").data('daterangepicker')
                                                                    .startDate.format("YYYY-MM-DD") + "+00:00:00";
                endDate = $("#product-sales-report-by-date-input").data('daterangepicker')
                                                                  .endDate.format("YYYY-MM-DD") + "+23:59:59";
                filterURL = "date_start=" + startDate + "&date_end=" + endDate;
            }

            url = SALES_URL + "?id=" + productID + "&" + filterURL;
            $.get(url)
                .done(function(sales) {
                    if (sales.length > 0) {
                        $("#product-sales-report-total-sales").val(format_number(sales[0]["sales"])).trigger("change");
                        $("#product-sales-report-total-profit").val(format_number(sales[0]["profit"])).trigger("change");
                        $("#product-sales-report-total-units").val(format_stock(sales[0]["units"])).trigger("change");

                        margin = format_percentage((sales[0]["profit"] / sales[0]["sales"]) * 100);
                        $("#product-sales-report-profit-margin").val(margin).trigger("change");
                    } else {
                        $("#product-sales-report-total-sales").val(format_number(0)).trigger("change");
                        $("#product-sales-report-total-profit").val(format_number(0)).trigger("change");
                        $("#product-sales-report-total-units").val(format_stock(0)).trigger("change");
                        $("#product-sales-report-profit-margin").val(0).trigger("change");
                    }
                })
                .fail(function() {
                    console.log("Failed to get sales data per product.");
                });

            url = SALES_URL + "?id=" + productID + "&group_by=customer" + "&" + filterURL;
            $.get(url)
                .done(function(sales) {
                    for (i in sales) {
                        sales[i].customer = customerList[sales[i].customer];
                        sales[i].margin = (sales[i].sales > 0.0) ?
                                            format_percentage((sales[i].profit / sales[i].sales) * 100) : "0.0%";
                        sales[i].sales = format_number(sales[i].sales);
                        sales[i].profit = format_number(sales[i].profit);
                        sales[i].units = format_stock(sales[i].units)
                    }

                    customersTable.clear().draw();
                    customersTable.rows.add(sales);
                    customersTable.columns.adjust().draw();
                })
                .fail(function() {
                    console.log("Failed to get sales data per customer.");
                });
        });

        // Date search change
        $("#product-sales-report-by-month-input-month,\
           #product-sales-report-by-month-input-year,\
           #product-sales-report-by-year-input").on('change', function(event, params) {
            productsTable.row(productsTable.rows('.selected')).select();
        });

        // Date checkboxes
        $("#product-sales-report-by-month-btn").on('change', function(event, params) {
            $("#product-sales-report-by-month").removeClass("hide");
            $("#product-sales-report-by-date").addClass("hide");
            $("#product-sales-report-by-year").addClass("hide");

            dateFilterBy = "month";
            productsTable.row(productsTable.rows('.selected')).select();
            $("#product-sales-report-by-month-input-month").focus();
        });

        $("#product-sales-report-by-year-btn").on('change', function(event, params) {
            $("#product-sales-report-by-month").addClass("hide");
            $("#product-sales-report-by-date").addClass("hide");
            $("#product-sales-report-by-year").removeClass("hide");

            dateFilterBy = "year";
            productsTable.row(productsTable.rows('.selected')).select();
            $("#product-sales-report-by-year-input").focus();
        });

        $("#product-sales-report-by-date-btn").on('change', function(event, params) {
            $("#product-sales-report-by-month").addClass("hide");
            $("#product-sales-report-by-date").removeClass("hide");
            $("#product-sales-report-by-year").addClass("hide");

            dateFilterBy = "dates";
            productsTable.row(productsTable.rows('.selected')).select();
        });

        // Daterangepicker date selection change
        $("#product-sales-report-by-date-input").on('apply.daterangepicker', function(event, picker) {
            productsTable.row(productsTable.rows('.selected')).select();
        });
    }

	$(document).ready(function() {
        loadInitialData();

        // Customers table
        customersTable = $("#product-sales-report-customer-table").DataTable({
            columns: [
                {data: 'customer', type: 'natural-ci'},
                {data: 'sales', type: 'num-fmt'},
                {data: 'profit', type: 'num-fmt'},
                {data: 'margin', type: 'num-fmt'},
                {data: 'units', type: 'num-fmt'},
            ],
            order: [[1, 'desc']],
            select: {
                style: 'api',
            },
            dom: 't',
            rowId: 'id',
            scroller: true,
            autoWidth: true,
            scrollY: '25vh',
            scrollCollapse: true,
        });

        // Setup products table
        productsTable = $("#product-sales-report-products-table").DataTable({
            ajax: {
                url: PRODUCTS_URL,
                dataSrc: '',
            },
            columns: [
                {data: 'name', searchable: true},
                {data: 'description', searchable: false},
                {data: 'size', searchable: false},
                {
                    data: 'supplier',
                    searchable: false,
                    render: function(data, type, row) {
                        return supplierList[data];
                    },
                },
            ],
            select: {
                style: 'single',
                items: 'row',
            },
            initComplete: function(settings, json) {
                $("#product-sales-report-products-table").DataTable().row(':eq(0)').select();
            },
            scroller: {
                displayBuffer: 2
            },
            dom: 'tS',
            rowId: 'id',
            paging: true,
            pageLength: 20,
            ordering: false,
            autoWidth: true,
            deferRender: true,
            scrollY: '54vh',
            scrollCollapse: true,
            keys: {
                columns: '0',
                className: 'no-highlight',
                tabIndex: '0',
            },
            tabIndex: "-1",
        });

        // Override the default smart search
        var typewatch_options = {
            callback: function(value) { productsTable.search("^" + this.value, true, false).draw(); },
            wait: 500,
            highlight: true,
            captureLength: 1,
        }
        $("#product-sales-report-products-search").typeWatch(typewatch_options);

        // Search date range
        $("#product-sales-report-by-date-input").daterangepicker({
            showDropdowns: true,
            drops: 'up',
            ranges: {
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
        });

        setupEventTriggers();
	});

})(window, document);

//# sourceURL=product_sales_report.js
