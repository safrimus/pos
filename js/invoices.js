(function(window, document) {
    var INVOICE_URL = "http://127.0.0.1:80/api/v1/invoices/";
    var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/";
    var PAYMENTS_URL = "http://127.0.0.1:80/api/v1/payments/";
    var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/";
    var PAYMENTS_PER_INVOICE_URL = "http://127.0.0.1:80/api/v1/payments/?invoice=";
    var INVOICE_FILTER_URL = "http://127.0.0.1:80/api/v1/invoices/?fields=id,products,created,credit,date_of_sale,customer";

    var lastFocus = null;
    var productList = {};
    var customerList = {};
    var invoiceTable = null;
    var currentInvoice = -1;
    var productsTable = null;
    var paymentsTable = null;
    var creditInvoice = null;
    var skipProductTableUpdate = false;


    function format_number(n) {
      return parseFloat(n).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }

    window.refreshSearchInvoicesPage = function() {
        getCustomersAndProducts(function() {
            if ($("#invoices").data("invoice-id")) {
                skipProductTableUpdate = false;
                $("#invoice-id-search").val($("#invoices").data("invoice-id")).trigger("change");
                $("#invoices").data("invoice-id", null);
            } else {
                // Invoice table reload should also re-trigger the select handler which will update
                // the products table too.
                skipProductTableUpdate = true;
                invoiceTable.ajax.reload();
            }
        });
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

    function getCustomersAndProducts(callback=function(){}) {
        $.when($.get(CUSTOMERS_URL), $.get(PRODUCTS_URL))
            .done(function(customers, products) {
                for (i in customers[0]) {
                    customerList[customers[0][i].id] = customers[0][i].name;
                }

                for (i in products[0]) {
                    productList[products[0][i].id] = products[0][i];
                }

                callback();
            });
    }

    function setupEventTriggers() {
        // search-invoices-form event triggers
        $('#search-invoices-form').on('focusin', ':input', function() {
            lastFocus = $(document.activeElement);
        });

        $('#search-invoices-form').on('show', function() {
            setTimeout( function() {
                if (lastFocus) {
                    lastFocus.focus();
                } else {
                    $("#invoice-id-search").focus();
                }
            }, 1);
        });

        // Toggle disabled
        $("#invoice-id-search").on('focusin', function() {
            $("#sale-date-range-search").prop('disabled', true);
            $("#product-search").prop('disabled', true);
            $("#customer-search").prop('disabled', true);
            $("#search-invoices-checkbox-true").prop('disabled', true);
            $("#search-invoices-checkbox-false").prop('disabled', true);
            $("#invoice-id-search").prop('readonly', false);
        });

        $("#invoice-id-search").on('focusout', function() {
            if ($("#invoice-id-search").val() == "") {
                $("#sale-date-range-search").prop('disabled', false);
                $("#product-search").prop('disabled', false);
                $("#customer-search").prop('disabled', false);
                $("#search-invoices-checkbox-true").prop('disabled', false);
                $("#search-invoices-checkbox-false").prop('disabled', false);
                $("#invoice-id-search").prop('readonly', true);
            } else {
                $("#sale-date-range-search").prop('disabled', true);
                $("#product-search").prop('disabled', true);
                $("#customer-search").prop('disabled', true);
                $("#search-invoices-checkbox-true").prop('disabled', true);
                $("#search-invoices-checkbox-false").prop('disabled', true);
                $("#invoice-id-search").prop('readonly', false);
            }
        });

        // Date search
        $("#sale-date-range-search").on('apply.daterangepicker', function(event, picker) {
            productsTable.clear().draw();
            paymentsTable.clear().draw();
            invoiceTable.ajax.url(invoiceFilter()).load();
        });

        // Invoice, product and customer search
        $("#invoice-id-search, #product-search, #customer-search").on('change', function(event, params) {
            productsTable.clear().draw();
            paymentsTable.clear().draw();
            invoiceTable.ajax.url(invoiceFilter()).load();
        });

        // Datatable on draw event
        invoiceTable.on('draw', function() {
            invoiceTable.row(':eq(0)').select();
        })

        // Select invoice
        invoiceTable.on('select', function(e, dt, type, indexes) {
            if (!skipProductTableUpdate) {
                lastFocus = null;

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
            } else {
                skipProductTableUpdate = false;
            }
        });

        // Returned quantity
        $("#search-invoices-products-table").on('change', 'tbody td .returned-quantity', function(event, params) {
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
        $("#search-invoices-checkbox-true").on('ifChecked', function() {
            $("#search-invoices-checkbox-false").iCheck('uncheck');
            creditInvoice = true;
            productsTable.clear().draw();
            paymentsTable.clear().draw();
            invoiceTable.ajax.url(invoiceFilter()).load();
        });

        $("#search-invoices-checkbox-false").on('ifChecked', function() {
            $("#search-invoices-checkbox-true").iCheck('uncheck');
            creditInvoice = false;
            invoiceTable.ajax.url(invoiceFilter()).load();
            productsTable.clear().draw();
            paymentsTable.clear().draw();
        });

        $("#search-invoices-checkbox-false, #search-invoices-checkbox-true").on('ifUnchecked', function() {
            if (!$("#search-invoices-checkbox-false").checked && !$("#search-invoices-checkbox-true").checked) {
                creditInvoice = null;
                productsTable.clear().draw();
                paymentsTable.clear().draw();
                invoiceTable.ajax.url(invoiceFilter()).load();
            }
        });
    }

    $(document).ready(function() {
        // Setup dialog
        $("#search-invoices-dialog").dialog({
            autoOpen: false,
            closeOnEscape: false,
            draggable: false,
            modal: true,
            resizable: false,
            buttons: [
                {
                    text: "Save",
                    click: function() {
                        var data = {};

                        data["payment"] = parseFloat($("#search-invoices-dialog-input").val()).toFixed(3);
                        data["invoice"] = currentInvoice;
                        data["date_of_payment"] = $("#search-invoices-dialog-date").datepicker("getDate");

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
                                json = JSON.parse(response.responseText);

                                if (json.non_field_errors[0]) {
                                    alert("Failed to save payment. " + json.non_field_errors[0]);
                                }
                                else {
                                    alert("Failed to save payment. " + response.responseText);
                                }
                            }
                        });

                        $(this).dialog("close");
                    }
                }
            ],
            open: function(event, ui) {
                $("#search-invoices-dialog-date").datepicker();
                $("#search-invoices-dialog-date").datepicker('setDate', 'today');
            },
            close: function(event, ui) {
                $("#search-invoices-dialog-input").val("");
                $("#search-invoices-dialog-date").datepicker("destroy");
            },
        });

        // Search date range
        $("#sale-date-range-search").daterangepicker({
            dateLimit: {
                days: 30
            },
            showDropdowns: true,
            ranges: {
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
        });

        // Payments table
        paymentsTable = $("#search-invoices-payments-table").DataTable({
            ajax: {
                url: PAYMENTS_PER_INVOICE_URL + "-1",
                dataSrc: '',
                error: function(jqXHR, textStatus, errorThrown) {
                    if (jqXHR.status != 400 && jqXHR.statusText != "abort")
                    {
                        console.log(jqXHR);
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
                    render: function(data, type, row) {
                                if (type == "display") {
                                    return $.datepicker.formatDate("D, d M yy", new Date(data));
                                }

                                return data;
                            },
                },
            ],
            order: [[1, 'asc'],],
            buttons: [
                {
                    text: "New Payment",
                    enabled: false,
                    action: function(e, dt, node, config) {
                        $("#search-invoices-dialog").dialog("option", "title", "New payment")
                                    .dialog("open");
                    }
                }
            ],
            footerCallback: function(row, data, start, end, display) {
                var payment_total = 0.0;

                $("#search-invoices-payments-table").DataTable().rows().every(function(rowIdx, tableLoop, rowLoop) {
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

        getCustomersAndProducts(function() {
            // Invoice table
            invoiceTable = $("#search-invoices-invoices-table").DataTable({
                ajax: {
                    url: invoiceFilter(),
                    dataSrc: '',
                },
                columns: [
                    {
                        data: 'id',
                        searchable: false,
                        type: 'num',
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
                        searchable: false,
                        render: function(data, type, row) {
                                    return $.datepicker.formatDate("D, d M yy", new Date(data));
                                },
                    },
                    {
                        data: 'customer',
                        searchable: false,
                        render: function(data, type, row) {
                                    return customerList[data];
                                },
                    },
                    {data: 'credit', searchable: false},
                ],
                select: {
                    style: 'single',
                    items: 'row',
                },
                dom: 't',
                rowId: "id",
                paging: false,
                scrollY: '84vh',
                scrollCollapse: true,
                autoWidth: true,
            });

            // Products table
            productsTable = $("#search-invoices-products-table").DataTable({
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

                    $("#search-invoices-products-table").DataTable().rows().every(function(rowIdx, tableLoop, rowLoop) {
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

            setupEventTriggers();

            $("#invoice-id-search").focus();
            if ($("#invoices").data("invoice-id")) {
                $("#invoice-id-search").val($("#invoices").data("invoice-id")).trigger("change");
                $("#invoices").data("invoice-id", null);
            }
        });
    });
})(window, document);
