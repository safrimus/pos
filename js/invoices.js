var INVOICE_URL = "http://127.0.0.1:80/api/v1/invoices/";
var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/";
var PAYMENTS_URL = "http://127.0.0.1:80/api/v1/payments/";
var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/";
var PAYMENTS_PER_INVOICE_URL = "http://127.0.0.1:80/api/v1/payments/?invoice=";
var INVOICE_FILTER_URL = "http://127.0.0.1:80/api/v1/invoices/?fields=id,products,created,credit,date_of_sale,customer";

var productList = {};
var customerList = {};
var invoiceTable = null;
var currentInvoice = -1;
var productsTable = null;
var paymentsTable = null;
var creditInvoice = null;

function format_number(n) {
  return parseFloat(n).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
}

function validateReturnQuantity(input, value, quantity) {
    if ($.isNumeric(value) && Math.floor(value) == value && value <= quantity && value >= 0) {
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

        return INVOICE_FILTER_URL + "&" + dateFilter + creditFilter + "&product_name=" + product + "&customer_name=" + customer;
    } else {
        return INVOICE_FILTER_URL + "&" + "id=" + invoiceId;
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
        invoiceTable.ajax.url(invoiceFilter()).load();
        productsTable.clear().draw();
        paymentsTable.clear().draw();
    });

    // Product and customer search
    $("#invoice-id-search, #product-search, #customer-search").on('change', function(event, params) {
        invoiceTable.ajax.url(invoiceFilter()).load();
        productsTable.clear().draw();
        paymentsTable.clear().draw();
    });

    // Select invoice
    invoiceTable.on('select', function(e, dt, type, indexes) {
        credit = invoiceTable.rows(indexes).data()[0].credit;
        currentInvoice = invoiceTable.rows(indexes).data()[0].id;
        var productData = invoiceTable.rows(indexes).data()[0].products;

        for (i in productData) {
            productData[i].name = productList[productData[i].product].name;
            productData[i].description = productList[productData[i].product].description;
            productData[i].size = productList[productData[i].product].size;
        }

        productsTable.clear().draw();
        productsTable.rows.add(productData);
        productsTable.columns.adjust().draw();

        if (credit) {
            paymentsTable.buttons().enable();
            paymentsTable.ajax.url(PAYMENTS_PER_INVOICE_URL + currentInvoice).load();
        } else {
            paymentsTable.buttons().disable();
            paymentsTable.clear().draw();
        }
    });

    // Returned quantity
    $("#products-table").on('change', 'tbody td .returned-quantity', function(event, params) {
        var self = $(this)
        var newValue = $(this).val();
        var quantity = productsTable.row($(this).closest('tr')).data().quantity

        if (validateReturnQuantity($(this), newValue, quantity)) {
            // Save returned quantity
            var data = {};
            var product_info = {}

            product_info["product"] = productsTable.row($(this).closest('tr')).id();
            product_info["quantity"] = quantity;
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

                    setTimeout(function() {
                        invoiceTable.ajax.reload( function(json) {
                            invoiceTable.search('').draw();
                            invoiceTable.row("#" + currentInvoice).scrollTo()
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
        invoiceTable.ajax.url(invoiceFilter()).load();
        productsTable.clear().draw();
        paymentsTable.clear().draw();
    });

    $("#checkbox-false").on('ifChecked', function() {
        $("#checkbox-true").iCheck('uncheck');
        creditInvoice = false;
        invoiceTable.ajax.url(invoiceFilter()).load();
        productsTable.clear().draw();
        paymentsTable.clear().draw();
    });

    $("#checkbox-false, #checkbox-true").on('ifUnchecked', function() {
        if (!$("#checkbox-false").checked && !$("#checkbox-true").checked) {
            creditInvoice = null;
            invoiceTable.ajax.url(invoiceFilter()).load();
            productsTable.clear().draw();
            paymentsTable.clear().draw();
        }
    });
}

$(document).ready(function() {
    getProducts();
    getCustomers();

    // Setup dialog
    $("#dialog").dialog({
        autoOpen: false,
        closeOpEscape: false,
        draggable: false,
        modal: true,
        resizable: false,
        buttons: [
            {
                text: "Save",
                click: function() {
                    var data = {};

                    data["payment"] = parseFloat($("#dialog-input").val()).toFixed(3);
                    data["invoice"] = currentInvoice;

                    $.ajax({
                        url: PAYMENTS_URL,
                        type: "POST",
                        data: JSON.stringify(data),
                        dataType: "json",
                        contentType: "application/json",
                        success: function(response) {
                            setTimeout(function() {
                                paymentsTable.ajax.url(
                                    PAYMENTS_PER_INVOICE_URL + currentInvoice).load();
                            }, 500);
                        },
                        error: function(response) {
                            alert("Failed to save payment. " + JSON.stringify(response));
                        }
                    });

                    $(this).dialog("close");
                }
            }
        ],
        close: function(event, ui) {
            $("#dialog-input").val("");
        },
    });

    // Search date range
    $("#sale-date-range-search").daterangepicker({
        dateLimit: {
            days: 30
        },
        showDropdowns: true,
    });

    // Invoice table
    invoiceTable = $("#invoices-table").DataTable({
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
        paging: false,
        scrollY: '85vh',
        scrollCollapse: true,
        autoWidth: true,
    });

    // Products table
    productsTable = $("#products-table").DataTable({
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
        footerCallback: function(row, data, start, end, display) {
            var invoice_total = 0.0;

            $("#products-table").DataTable().rows().every(function(rowIdx, tableLoop, rowLoop) {
                var product = this.data();
                var quantity = parseInt(product.quantity);
                var returned = parseInt(product.returned_quantity);
                var sell_price = parseFloat(product.sell_price);

                invoice_total += (quantity - returned) * sell_price;
            });

            $(this.api().column(3).footer()).html(
                "KD " + format_number(invoice_total)
            );
        },
        dom: 't',
        rowId: "product",
        paging: false,
        scrollY: '45vh',
        scrollCollapse: true,
        autoWidth: true,
    });

    // Payments table
    paymentsTable = $("#payments-table").DataTable({
        ajax: {
            url: PAYMENTS_PER_INVOICE_URL + "-1",
            dataSrc: '',
            error: function(jqXHR, textStatus, errorThrown) {
                if (jqXHR.status != 400)
                {
                    alert(jqXHR.responseText);
                }
            },
        },
        columns: [
            {
                data: 'payment',
                type: 'natural-ci',
                render: function(data, type, row) {
                            return format_number(parseFloat(data));
                        },
            },
            {
                data: 'date_of_payment',
                type: 'natural-ci',
                render: function(data, type, row) {
                            return $.datepicker.formatDate("D, d M yy", new Date(data));
                        },
            },
        ],
        order: [[1, 'asc'],],
        buttons: [
            {
                text: "New Payment",
                enabled: false,
                action: function(e, dt, node, config) {
                    $("#dialog").dialog("option", "title", "New payment")
                                .dialog("open");
                }
            }
        ],
        footerCallback: function(row, data, start, end, display) {
            var payment_total = 0.0;

            $("#payments-table").DataTable().rows().every(function(rowIdx, tableLoop, rowLoop) {
                var payment = this.data();
                payment_total += parseFloat(payment.payment);
            });

            $(this.api().column(1).footer()).html(
                "KD " + format_number(payment_total)
            );
        },
        dom: 'tB',
        paging: false,
        scrollY: '15vh',
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