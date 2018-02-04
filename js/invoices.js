var INVOICE_URL = "http://127.0.0.1:80/api/v1/invoices/";
var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/";
var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/";

var productList = {};
var customerList = {};
var currentInvoice = -1;
var creditInvoice = null;


function validateInput(input, value) {
    if ($.isNumeric(value) && Math.floor(value) == value && value > 0) {
        input.removeClass('edit-input-error');
        return true;
    } else {
        input.addClass('edit-input-error');
        return false;
    }
}

function invoiceFilter() {
    var invoiceId = $("#invoice-id-search").val();

    if (invoiceId == "") {
        var startDate, endDate, dateFilter;
        var product = $("#product-search").val();
        var customer = $("#customer-search").val();


        var creditFilter = "&credit=";
        if (creditInvoice != null) {
            creditFilter = creditFilter + creditInvoice;
        }

        startDate = $("#sale-date-range-search").data('daterangepicker').startDate.format("YYYY-MM-DD") + "+00:00:00";
        endDate = $("#sale-date-range-search").data('daterangepicker').endDate.format("YYYY-MM-DD") + "+23:59:59";
        dateFilter = "date_of_sale__lte=" + endDate + "&date_of_sale__gte=" + startDate;

        return INVOICE_URL + "?" + dateFilter + creditFilter + "&product_name=" + product + "&customer_name=" + customer;
    } else {
        return INVOICE_URL + "?" + "id=" + invoiceId;
    }
}

function getCustomers() {
    $.get(CUSTOMERS_URL)
    .done (function(customers) {
        for (i in customers) {
            customerList[customers[i].id] = customers[i].name;
        }
    })
    .fail(function() {
        console.log("Failed to get customers.");
    });
}

function getProducts() {
    $.get(PRODUCTS_URL)
    .done (function(products) {
        for (i in products) {
            productList[products[i].id] = products[i];
        }
    })
    .fail(function() {
        console.log("Failed to get products.");
    });
}

function setupEventTriggers() {
    // Date search
    $("#sale-date-range-search").on('apply.daterangepicker', function(event, picker) {
        $("#invoices-table").DataTable().ajax.url(invoiceFilter()).load();
    });

    // Product and customer search
    $("#invoice-id-search, #product-search, #customer-search").on('change', function(event, params) {
        $("#invoices-table").DataTable().ajax.url(invoiceFilter()).load();
    });

    // Select invoice
    $("#invoices-table").DataTable().on('select', function(e, dt, type, indexes) {
        currentInvoice = $("#invoices-table").DataTable().rows(indexes).data()[0].id;
        var productData = $("#invoices-table").DataTable().rows(indexes).data()[0].products;

        for (i in productData) {
            productData[i].name = productList[productData[i].product].name;
            productData[i].description = productList[productData[i].product].description;
            productData[i].size = productList[productData[i].product].size;
        }

        $("#products-table").DataTable().clear().draw();
        $("#products-table").DataTable().rows.add(productData);
        $("#products-table").DataTable().columns.adjust().draw();
    });

    // Returned quantity
    $("#products-table").on('change', 'tbody td .returned-quantity', function(event, params) {
        var self = $(this)
        var newValue = $(this).val();

        if (validateInput($(this), newValue)) {
            // Save returned quantity
            var data = {};
            var product_info = {}

            product_info["product"] = $("#products-table").DataTable().row($(this).closest('tr')).id();
            product_info["returned_quantity"] = parseInt(newValue);

            data["id"] = currentInvoice;
            data["products"] = [product_info];

            $.ajax({
                url: INVOICE_URL + currentInvoice + '/',
                type: "PATCH",
                data: JSON.stringify(data),
                dataType: "json",
                contentType: "application/json",
                success: function(response) {
                    self.addClass('success-text');
                    self.val("Saved");

                    setTimeout(function () {
                        $("#invoices-table").DataTable().ajax.reload( function(json) {
                            $("#invoices-table").DataTable().search('').draw();
                            $("#invoices-table").DataTable().row("#" + currentInvoice).scrollTo()
                                                                                      .select();
                        });
                    }, 500);

                },
                error: function(response) {
                    alert("Failed to save quantity. " + JSON.stringify(response));
                }
            });
        }
    });

    // Credit checkboxes
    $("#checkbox-true").on('ifChecked', function() {
        $("#checkbox-false").iCheck('uncheck');
        creditInvoice = true;
        $("#invoices-table").DataTable().ajax.url(invoiceFilter()).load();
    });

    $("#checkbox-false").on('ifChecked', function() {
        $("#checkbox-true").iCheck('uncheck');
        creditInvoice = false;
        $("#invoices-table").DataTable().ajax.url(invoiceFilter()).load();
    });

    $("#checkbox-false, #checkbox-true").on('ifUnchecked', function() {
        if (!$("#checkbox-false").checked && !$("#checkbox-true").checked) {
            creditInvoice = null;
            $("#invoices-table").DataTable().ajax.url(invoiceFilter()).load();
        }
    });
}

$(document).ready(function() {
    getProducts();
    getCustomers();

    $("#sale-date-range-search").daterangepicker({
        dateLimit: {
            days: 30
        },
        showDropdowns: true,
    });

    $("#invoices-table").DataTable({
        ajax: {
            url: invoiceFilter(),
            dataSrc: '',
        },
        columns: [
            {
                data: 'id',
                searchable: false,
                type: 'natural-ci',
            },
            {
                data: 'date_of_sale',
                searchable: false,
                render: function(data, type, row) {
                            return $.datepicker.formatDate("D, d M yy", new Date(data));
                        },
            },
            {
                data: 'created',
                searchable: true,
                render: function(data, type, row) {
                            return $.datepicker.formatDate("D, d M yy", new Date(data));
                        },
            },
            {
                data: 'customer',
                searchable: true,
                render: function(data, type, row) {
                            return customerList[data];
                        },
            },
            {data: 'credit', searchable: false, type: 'natural-ci'},
        ],
        select: {
            style: 'single',
            items: 'row',
        },
        dom: 't',
        rowId: "id",
        scroller: true,
        scrollY: '85vh',
        scrollCollapse: true,
        autoWidth: true,
    });

    // Products table
    $("#products-table").DataTable({
        columns: [
            {data: 'name', type: 'natural-ci'},
            {data: 'description', type: 'natural-ci'},
            {data: 'size', type: 'natural-ci'},
            {data: 'quantity'},
            {data: 'sell_price'},
            {
                data: 'returned_quantity',
                render: function(data, type, full, meta) {
                    return '<input class="text-center returned-quantity w-100" value="' + data + '">';
                },
                width: '15%'
            },
        ],
        dom: 't',
        rowId: "product",
        paging: false,
        scrollY: '83vh',
        scrollCollapse: true,
        autoWidth: true,
    });

    // Checkboxes
    $(".checkbox").iCheck({
        checkboxClass: "icheckbox_square-red",
        radioClass: "iradio_square-red",
    });

    setupEventTriggers();
});