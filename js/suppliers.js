var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/";
var SUPPLIERS_URL = "http://127.0.0.1:80/api/v1/suppliers/";

var newSupplier = false;
var supplierTable = null;
var productsTable = null;
var selectedSupplier = -1;

function resetPage(supplierId = -1) {
    var row = ':eq(0)'
    if (supplierId != -1) {
        row = "#" + supplierId
    }

    $(":input").val('');

    $("#cancel-save-button").prop('disabled', true);
    $("#save-supplier-button").prop('disabled', true);

    supplierTable.ajax.reload( function(json) {
        supplierTable.search('').draw();
        supplierTable.select.style("single");
        supplierTable.row(row).scrollTo()
                              .select();
    });

    productsTable.clear().draw();

    newSupplier = false;
}

function setupEventTriggers() {
    // Supplier selected from datatable
    supplierTable.on('select', function(e, dt, type, indexes) {
        var supplier = supplierTable.rows(indexes).data()[0];
        selectedSupplier = supplier.id;

        $("#supplier-id").val(supplier.id).trigger("change");
        $("#supplier-company").val(supplier.company).trigger("change");
        $("#supplier-agent").val(supplier.agent).trigger("change");
        $("#supplier-email").val(supplier.email).trigger("change");
        $("#supplier-phone").val(supplier.phone).trigger("change");
        $("#supplier-address").val(supplier.address).trigger("change");

        productsTable.ajax.url(PRODUCTS_URL + "?supplier=" + supplier.id).load();
    });

    // Logic to reset save button disabled state
    $("#supplier-id").on('change', function(event, params) {
        if ($(this).val() != selectedSupplier) {
            $("#cancel-save-button").prop('disabled', true);
            $("#save-supplier-button").prop('disabled', true);
        }
    });

    // Logic to detect change in supplier info and to enable save button
    $(".editable").on('input', function(event, params) {
        $("#cancel-save-button").prop('disabled', false);
        $("#save-supplier-button").prop('disabled', false);
    });

    // Cancel button clicked
    $("#cancel-save-button").on('click', function(event, params) {
        if (newSupplier) {
            resetPage();
        } else {
            supplierTable.rows(".selected").select();
            $("#cancel-save-button").prop('disabled', true);
            $("#save-supplier-button").prop('disabled', true);
        }
    });

    // Save button clicked
    $("#save-supplier-button").on('click', function(event, params) {
        var url = "";
        var type = "";
        var data = {};

        if (newSupplier) {
            type = "POST";
            url = SUPPLIERS_URL;
        } else {
            type = "PUT";
            url = SUPPLIERS_URL + $("#supplier-id").val() + "/";
        }

        if ($("#supplier-company").val() != "") {
            data["company"] = $("#supplier-company").val();
            data["agent"] = $("#supplier-agent").val();
            data["email"] = $("#supplier-email").val();
            data["phone"] = $("#supplier-phone").val();
            data["address"] = $("#supplier-address").val();

            $.ajax({
                url: url,
                type: type,
                data: JSON.stringify(data),
                dataType: "json",
                contentType: "application/json",
                success: function(response) {
                    alert("Successfully saved supplier.");

                    // Save current supplier's id. Then reset page
                    // and set the current supplier as the saved supplier
                    resetPage(response.id);
                },
                error: function(response) {
                    alert("Failed to save supplier. " + JSON.stringify(response));
                }
            });
        } else {
            $("#supplier-company").focus();
        }
    });

    // New supplier button clicked
    $("#new-supplier-button").on('click', function(event, params) {
        newSupplier = true;
        selectedSupplier = -1;

        $("#supplier-id").val("").trigger("change");
        $(".editable").val("").trigger("change");

        $("#cancel-save-button").prop('disabled', false);

        supplierTable.select.style("api");
        supplierTable.rows(".selected").deselect();

        productsTable.clear().draw()

        $("#supplier-company").focus();
    });
}

$(document).ready(function() {
    // Suppliers table
    supplierTable = $("#suppliers-table").DataTable({
        ajax: {
            url: SUPPLIERS_URL,
            dataSrc: '',
        },
        columns: [
            {data: 'company', searchable: true, type: 'natural-ci'},
            {data: 'agent', searchable: false, type: 'natural-ci'},
        ],
        order: [[0, 'asc'], [1, 'asc']],
        select: {
            style: 'single',
            items: 'row',
        },
        initComplete: function(settings, json) {
            $("#suppliers-table").DataTable().row(':eq(0)').select();
        },
        rowId: 'id',
        dom: 't',
        scroller: true,
        scrollY: '65vh',
        scrollCollapse: true,
        autoWidth: true,
    });

    // Override the default smart search
    $("#suppliers-search").on('keyup', function(event, params) {
        supplierTable.search("^" + this.value, true, false).draw();
    });

    // Products table
    productsTable = $("#products-table").DataTable({
        ajax: {
            dataSrc: '',
        },
        columns: [
            {data: 'name', type: 'natural-ci'},
            {data: 'description', type: 'natural-ci'},
            {data: 'size', type: 'natural-ci'},
        ],
        order: [[0, 'asc'], [1, 'asc'], [2, 'asc']],
        select: {
            style: 'api',
        },
        footerCallback: function(row, data, start, end, display) {
            var total = 0;

            $("#products-table").DataTable().rows().every(function(rowIdx, tableLoop, rowLoop) {
                total += 1;
            });

            $(this.api().column(2).footer()).html(total);
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
