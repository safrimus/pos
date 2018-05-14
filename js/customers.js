var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/";
var INVOICES_URL = "http://127.0.0.1:80/api/v1/invoices/?fields=id,date_of_sale,invoice_total,payments_total&credit=true";

var newCustomer = false;
var customerTable = null;
var selectedCustomer = -1;


function format_number(n) {
  return parseFloat(n).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
}

function resetPage(customerId = -1) {
    var row = ':eq(0)'
    if (customerId != -1) {
        row = "#" + customerId
    }

    $(":input").val('');

    $("#cancel-save-button").prop('disabled', true);
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
    // Customer selected from datatable
    customerTable.on('select', function(e, dt, type, indexes) {
        var customer = customerTable.rows(indexes).data()[0];
        selectedCustomer = customer.id;

        $("#customer-id").val(customer.id).trigger("change");
        $("#customer-name").val(customer.name).trigger("change");
        $("#customer-primary-phone").val(customer.primary_phone).trigger("change");
        $("#customer-sec-phone").val(customer.secondary_phone).trigger("change");

        $("#invoices-table").DataTable().ajax.url(INVOICES_URL + "&customer_name=" + customer.name).load();
    });

    // Logic to reset save button disabled state
    $("#customer-id").on('change', function(event, params) {
        if ($(this).val() != selectedCustomer) {
            $("#cancel-save-button").prop('disabled', true);
            $("#save-customer-button").prop('disabled', true);
        }
    });

    // Logic to detect change in customer info and to enable save button
    $(".editable").on('input', function(event, params) {
        $("#cancel-save-button").prop('disabled', false);
        $("#save-customer-button").prop('disabled', false);
    });

    // Cancel button clicked
    $("#cancel-save-button").on('click', function(event, params) {
        if (newCustomer) {
            resetPage();
        } else {
            customerTable.rows(".selected").select();
            $("#cancel-save-button").prop('disabled', true);
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
            url = CUSTOMERS_URL + $("#customer-id").val() + "/";
        }

        if ($("#customer-name").val() != "") {
            data["name"] = $("#customer-name").val();
            data["primary_phone"] = $("#customer-primary-phone").val();
            data["secondary_phone"] = $("#customer-sec-phone").val();

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
                    resetPage(response.id);
                },
                error: function(response) {
                    alert("Failed to save customer. " + JSON.stringify(response));
                }
            });
        } else {
            $("#customer-name").focus();
        }
    });

    // New customer button clicked
    $("#new-customer-button").on('click', function(event, params) {
        newCustomer = true;
        selectedCustomer = -1;

        $("#customer-id").val("").trigger("change");
        $(".editable").val("").trigger("change");

        $("#cancel-save-button").prop('disabled', false);

        customerTable.select.style("api");
        customerTable.rows(".selected").deselect();

        $("#customer-name").focus();
    });
}

$(document).ready(function() {
    // Customers table
    customerTable = $("#customers-table").DataTable({
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
            $("#customers-table").DataTable().row(':eq(0)').select();
        },
        rowId: 'id',
        dom: 't',
        scroller: true,
        scrollY: '65vh',
        scrollCollapse: true,
        autoWidth: true,
    });

    // Override the default smart search
    $("#customers-search").on('keyup', function(event, params) {
        customerTable.search("^" + this.value, true, false).draw();
    });

    // Invoices table
    $("#invoices-table").DataTable({
        ajax: {
            dataSrc: '',
        },
        columns: [
            {data: 'id', type: 'num'},
            {
                data: 'date_of_sale',
                searchable: false,
                render: function(data, type, row) {
                            return $.datepicker.formatDate("D, d M yy", new Date(data));
                        },
            },
            {
                data: 'invoice_total',
                searchable: false,
                render: function(data, type, row) {
                            return format_number(data || 0);
                        },

            },
            {
                data: 'payments_total',
                searchable: false,
                render: function(data, type, row) {
                            return format_number(data || 0);
                        },
            },
            {
                searchable: false,
                type: 'num',
                render: function(data, type, row) {
                            var total = row['invoice_total'] || 0;
                            var payments = row['payments_total'] || 0;
                            return format_number(total-payments);
                        },
            }
        ],
        order: [[4, 'desc'], [0, 'asc']],
        select: {
            style: 'api',
        },
        footerCallback: function(row, data, start, end, display) {
            var credit_owed = 0.0;

            $("#invoices-table").DataTable().column(4).nodes().each(function(cell, index) {
                credit_owed += parseFloat($(cell).text().replace(/,/g,''));
            });

            $(this.api().column(4).footer()).html(
                "KD " + format_number(credit_owed)
            );
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
});
