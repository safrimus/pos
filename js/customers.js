var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/";

var newCustomer = false;
var selectedCustomer = -1;

function resetPage(customerId = -1) {
    var row = ':eq(0)'
    if (customerId != -1) {
        row = "#" + customerId
    }

    $(":input").val('');

    $("#cancel-save-button").prop('disabled', true);
    $("#save-customer-button").prop('disabled', true);

    $("#customers-table").DataTable().ajax.reload( function(json) {
        $("#customers-table").DataTable().search('').draw();
        $("#customers-table").DataTable().select.style("single");
        $("#customers-table").DataTable().row(row).scrollTo()
                                                  .select();
    });

    newCustomer = false;
}

function setupEventTriggers() {
    // Customer selected from datatable
    $("#customers-table").DataTable().on('select', function(e, dt, type, indexes) {
        var customer = $("#customers-table").DataTable().rows(indexes).data()[0];
        selectedCustomer = customer.id;

        $("#customer-id").val(customer.id).trigger("change");
        $("#customer-name").val(customer.name).trigger("change");
        $("#customer-primary-phone").val(customer.primary_phone).trigger("change");
        $("#customer-sec-phone").val(customer.secondary_phone).trigger("change");
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
            $("#customers-table").DataTable().rows(".selected").select();
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

        $("#customers-table").DataTable().select.style("api");
        $("#customers-table").DataTable().rows(".selected").deselect();

        $("#customer-name").focus();
    });
}

$(document).ready(function() {
    // Customers table
    $("#customers-table").DataTable({
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
        $("#customers-table").DataTable().search("^" + this.value, true, false).draw();
    });

    // Invoices table
    $("#invoices-table").DataTable({
        columns: [
            {data: 'id', type: 'natural-ci'},
            {data: 'date_of_sale', type: 'natural-ci'},
            {data: 'credit', type: 'natural-ci'},
        ],
        order: [[0, 'asc'], [1, 'asc']],
        select: {
            style: 'api',
        },
        rowId: 'id',
        dom: 't',
        scroller: true,
        scrollY: '35vh',
        scrollCollapse: true,
        autoWidth: true,
    });

    // Setup event triggers for all fields
    setupEventTriggers();
});
