(function(window, document) {
    var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/";
    var INVOICES_URL = "http://127.0.0.1:80/api/v1/invoices/?fields=id,date_of_sale,invoice_total,payments_total&credit=true";

    var lastFocus = null;
    var newCustomer = false;
    var customerTable = null;
    var invoicesTable = null;
    var selectedCustomer = -1;


    function format_number(n) {
      return parseFloat(n).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }

    window.refreshCustomersPage = function() {
        customerTable.ajax.reload();
    }

    function resetCustomersPage(customerId = -1) {
        var row = ':eq(0)'
        if (customerId != -1) {
            row = "#" + customerId
        }

        $("#customers-form :input").val('');

        $("#customers-cancel-save-button").prop('disabled', true);
        $("#customers-delete-button").prop('disabled', true);
        $("#save-customer-button").prop('disabled', true);

        customerTable.ajax.reload( function(json) {
            customerTable.search('').draw();
            customerTable.select.style("single");
            customerTable.row(row).scrollTo()
                                  .select();
        });

        newCustomer = false;
    }

    function setupEventTriggers() {
        // customers-form event triggers
        $('#customers-form').on('focusin', ':input', function() {
            lastFocus = $(document.activeElement);
        });

        $('#customers-form').on('show', function() {
            setTimeout( function() {
                if (lastFocus) {
                    lastFocus.focus();
                } else {
                    $("#customers-customers-search").focus();
                }
            }, 1);
        });

        // Customer selected from datatable
        customerTable.on('select', function(e, dt, type, indexes) {
            lastFocus = null;

            var customer = customerTable.rows(indexes).data()[0];
            selectedCustomer = customer.id;

            $("#customers-customer-id").val(customer.id).trigger("change");
            $("#customers-customer-name").val(customer.name).trigger("change");
            $("#customers-customer-primary-phone").val(customer.primary_phone).trigger("change");
            $("#customers-customer-sec-phone").val(customer.secondary_phone).trigger("change");

            invoicesTable.ajax.url(INVOICES_URL + "&customer_name=" + customer.name).load();
        });

        customerTable.on('key-focus', function(e, dt, cell) {
            var row = dt.row(cell.index().row).node();
            $(row).addClass('tab-focus');
        });

        customerTable.on('key-blur', function(e, dt, cell) {
            var row = dt.row(cell.index().row).node();
            $(row).removeClass('tab-focus');
        });

        customerTable.on('key', function(e, dt, key, cell, originalEvent) {
            // Enter key
            if (key == 13) {
                var row = dt.row(cell.index().row)

                if ($(row.node()).hasClass('selected')) {
                    row.deselect();
                } else {
                    row.select();
                    dt.cell.blur();
                    $("#customers-customer-name").focus();
                }
            }
        });

        // Logic to reset save button disabled state
        $("#customers-customer-id").on('change', function(event, params) {
            if ($(this).val() != selectedCustomer) {
                $("#customers-cancel-save-button").prop('disabled', true);
                $("#save-customer-button").prop('disabled', true);
            }
        });

        // Logic to detect change in customer info and to enable save button
        $(".editable").on('input', function(event, params) {
            $("#customers-cancel-save-button").prop('disabled', false);
            $("#save-customer-button").prop('disabled', false);
        });

        // Cancel button clicked
        $("#customers-cancel-save-button").on('click', function(event, params) {
            if (newCustomer) {
                resetCustomersPage();
            } else {
                customerTable.rows(".selected").select();
                $("#customers-cancel-save-button").prop('disabled', true);
                $("#save-customer-button").prop('disabled', true);
            }
        });

        // Save button clicked
        $("#save-customer-button").on('click', function(event, params) {
            var url = "";
            var type = "";
            var data = {};

            if (newCustomer) {
                type = "POST";
                url = CUSTOMERS_URL;
            } else {
                type = "PUT";
                url = CUSTOMERS_URL + $("#customers-customer-id").val() + "/";
            }

            if ($("#customers-customer-name").val() != "") {
                data["name"] = $("#customers-customer-name").val();
                data["primary_phone"] = $("#customers-customer-primary-phone").val();
                data["secondary_phone"] = $("#customers-customer-sec-phone").val();

                $.ajax({
                    url: url,
                    type: type,
                    data: JSON.stringify(data),
                    dataType: "json",
                    contentType: "application/json",
                    success: function(response) {
                        alert("Successfully saved customer.");

                        // Save current customer's id. Then reset page
                        // and set the current customer as the saved customer
                        resetCustomersPage(response.id);
                    },
                    error: function(response) {
                        alert("Failed to save customer. " + JSON.stringify(response));
                    }
                });
            } else {
                $("#customers-customer-name").focus();
            }
        });

        // New customer button clicked
        $("#new-customer-button").on('click', function(event, params) {
            newCustomer = true;
            selectedCustomer = -1;

            invoicesTable.clear().draw();

            $("#customers-customer-id").val("").trigger("change");
            $(".editable").val("").trigger("change");

            $("#customers-cancel-save-button").prop('disabled', false);
            $("#customers-delete-button").prop('disabled', true);

            customerTable.select.style("api");
            customerTable.rows(".selected").deselect();

            $("#customers-customer-name").focus();
        });

        // Delete customer button clicked
        $("#customers-delete-button").on('click', function(event, params) {
            $.ajax({
                url: CUSTOMERS_URL + selectedCustomer + "/",
                type: "DELETE",
                success: function(response) {
                    alert("Successfully deleted " + $("#customers-customer-name").val() + ".");
                    resetCustomersPage();
                },
                error: function(response) {
                    alert("Failed to delete customer.");
                }
            });
        });
    }

    $(document).ready(function() {
        // Customers table
        customerTable = $("#customers-customers-table").DataTable({
            ajax: {
                url: CUSTOMERS_URL,
                dataSrc: '',
            },
            columns: [
                {data: 'name', searchable: true, type: 'natural-ci'},
            ],
            select: {
                style: 'single',
                items: 'row',
            },
            initComplete: function(settings, json) {
                $("#customers-customers-table").DataTable().row(':eq(0)').select();
            },
            rowId: 'id',
            dom: 't',
            scroller: true,
            scrollY: '65vh',
            scrollCollapse: true,
            autoWidth: true,
            keys: {
                columns: '0',
                className: 'no-highlight',
                tabIndex: '0',
            },
            tabIndex: "-1",
        });

        // Override the default smart search
        $("#customers-customers-search").on('keyup', function(event, params) {
            customerTable.search("^" + this.value, true, false).draw();
        });

        // Invoices table
        invoicesTable = $("#customers-invoices-table").DataTable({
            ajax: {
                dataSrc: '',
            },
            columns: [
                {data: 'id', type: 'num'},
                {
                    data: 'date_of_sale',
                    searchable: false,
                    orderable: false,
                    render: function(data, type, row) {
                                return $.datepicker.formatDate("D, d M yy", new Date(data));
                            },
                },
                {
                    data: 'invoice_total',
                    searchable: false,
                    orderable: false,
                    render: function(data, type, row) {
                                return format_number(data || 0);
                            },

                },
                {
                    data: 'payments_total',
                    searchable: false,
                    orderable: false,
                    render: function(data, type, row) {
                                return format_number(data || 0);
                            },
                },
                {
                    searchable: false,
                    orderable: false,
                    type: 'num',
                    render: function(data, type, row) {
                                var total = row['invoice_total'] || 0;
                                var payments = row['payments_total'] || 0;
                                return format_number(total - payments);
                            },
                }
            ],
            order: [[0, 'desc']],
            select: {
                style: 'api',
            },
            footerCallback: function(row, data, start, end, display) {
                var credit_owed = 0.0;

                $("#customers-invoices-table").DataTable().column(4).nodes().each(function(cell, index) {
                    credit_owed += parseFloat($(cell).text().replace(/,/g,''));
                });

                $(this.api().column(4).footer()).html(
                    "KD " + format_number(credit_owed)
                );

                // Have to put this here as initComplete for this table does not trigger for some reason
                if ($("#customers-invoices-table").DataTable().data().count() == 0) {
                    $("#customers-delete-button").prop('disabled', false);
                } else {
                    $("#customers-delete-button").prop('disabled', true);
                }

            },
            rowId: 'id',
            dom: 't',
            paging: false,
            scrollY: '37vh',
            scrollCollapse: true,
            autoWidth: true,
        });

        // Setup event triggers for all fields
        setupEventTriggers();

        $("#customers-customers-search").focus();
    });
})(window, document);

//# sourceURL=http://localhost:8080/js/customers.js 
