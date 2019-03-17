(function(window, document) {
    var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/";
    var SUPPLIERS_URL = "http://127.0.0.1:80/api/v1/suppliers/";

    var lastFocus = null;
    var newSupplier = false;
    var supplierTable = null;
    var productsTable = null;
    var selectedSupplier = -1;

    window.refreshSuppliersPage = function() {
        supplierTable.ajax.reload();
        productsTable.ajax.reload();
    }

    function resetPage(supplierId = -1) {
        var row = ':eq(0)'
        if (supplierId != -1) {
            row = "#" + supplierId
        }

        $("#suppliers-form :input").val('');

        $("#suppliers-cancel-save-button").prop('disabled', true);
        $("#suppliers-save-supplier-button").prop('disabled', true);

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
        // suppliers-form event triggers
        $('#suppliers-form').on('focusin', ':input', function() {
            lastFocus = $(document.activeElement);
        });

        $('#suppliers-form').on('show', function() {
            setTimeout( function() {
                if (lastFocus) {
                    lastFocus.focus();
                } else {
                    $("#suppliers-suppliers-search").focus();
                }
            }, 1);
        });

        // DataTable event triggers
        supplierTable.on('select', function(e, dt, type, indexes) {
            lastFocus = null;

            var supplier = supplierTable.rows(indexes).data()[0];
            selectedSupplier = supplier.id;

            $("#suppliers-supplier-id").val(supplier.id).trigger("change");
            $("#suppliers-supplier-company").val(supplier.company).trigger("change");
            $("#suppliers-supplier-agent").val(supplier.agent).trigger("change");
            $("#suppliers-supplier-email").val(supplier.email).trigger("change");
            $("#suppliers-supplier-phone").val(supplier.phone).trigger("change");
            $("#suppliers-supplier-address").val(supplier.address).trigger("change");

            productsTable.ajax.url(PRODUCTS_URL + "?supplier=" + supplier.id).load();
        });

        supplierTable.on('key-focus', function(e, dt, cell) {
            var row = dt.row(cell.index().row).node();
            $(row).addClass('tab-focus');
        });

        supplierTable.on('key-blur', function(e, dt, cell) {
            var row = dt.row(cell.index().row).node();
            $(row).removeClass('tab-focus');
        });

        supplierTable.on('key', function(e, dt, key, cell, originalEvent) {
            // Enter key
            if (key == 13) {
                var row = dt.row(cell.index().row)

                if ($(row.node()).hasClass('selected')) {
                    row.deselect();
                } else {
                    row.select();
                    dt.cell.blur();
                    $("#suppliers-supplier-company").focus();
                }
            }
        });

        // Logic to reset save button disabled state
        $("#suppliers-supplier-id").on('change', function(event, params) {
            if ($(this).val() != selectedSupplier) {
                $("#suppliers-cancel-save-button").prop('disabled', true);
                $("#suppliers-save-supplier-button").prop('disabled', true);
            }
        });

        // Logic to detect change in supplier info and to enable save button
        $(".editable").on('input', function(event, params) {
            $("#suppliers-cancel-save-button").prop('disabled', false);
            $("#suppliers-save-supplier-button").prop('disabled', false);
        });

        // Cancel button clicked
        $("#suppliers-cancel-save-button").on('click', function(event, params) {
            if (newSupplier) {
                resetPage();
            } else {
                supplierTable.rows(".selected").select();
                $("#suppliers-cancel-save-button").prop('disabled', true);
                $("#suppliers-save-supplier-button").prop('disabled', true);
            }
        });

        // Save button clicked
        $("#suppliers-save-supplier-button").on('click', function(event, params) {
            var url = "";
            var type = "";
            var data = {};

            if (newSupplier) {
                type = "POST";
                url = SUPPLIERS_URL;
            } else {
                type = "PUT";
                url = SUPPLIERS_URL + $("#suppliers-supplier-id").val() + "/";
            }

            if ($("#suppliers-supplier-company").val() != "") {
                data["company"] = $("#suppliers-supplier-company").val();
                data["agent"] = $("#suppliers-supplier-agent").val();
                data["email"] = $("#suppliers-supplier-email").val();
                data["phone"] = $("#suppliers-supplier-phone").val();
                data["address"] = $("#suppliers-supplier-address").val();

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
                $("#suppliers-supplier-company").focus();
            }
        });

        // New supplier button clicked
        $("#suppliers-new-supplier-button").on('click', function(event, params) {
            newSupplier = true;
            selectedSupplier = -1;

            $("#suppliers-supplier-id").val("").trigger("change");
            $(".editable").val("").trigger("change");

            $("#suppliers-cancel-save-button").prop('disabled', false);

            supplierTable.select.style("api");
            supplierTable.rows(".selected").deselect();

            productsTable.clear().draw()

            $("#suppliers-supplier-company").focus();
        });
    }

    $(document).ready(function() {
        // Suppliers table
        supplierTable = $("#suppliers-suppliers-table").DataTable({
            ajax: {
                url: SUPPLIERS_URL,
                dataSrc: '',
            },
            columns: [
                {data: 'company', searchable: true, type: 'string'},
                {data: 'agent', searchable: false, type: 'string'},
            ],
            order: [[0, 'asc'], [1, 'asc']],
            select: {
                style: 'single',
                items: 'row',
            },
            initComplete: function(settings, json) {
                $("#suppliers-suppliers-table").DataTable().row(':eq(0)').select();
            },
            dom: 't',
            rowId: 'id',
            scroller: true,
            autoWidth: true,
            scrollY: '65vh',
            scrollCollapse: true,
            keys: {
                columns: '0',
                className: 'no-highlight',
                tabIndex: '0',
            },
            tabIndex: "-1",
        });

        // Override the default smart search
        $("#suppliers-suppliers-search").on('keyup', function(event, params) {
            supplierTable.search("^" + this.value, true, false).draw();
        });

        // Products table
        productsTable = $("#suppliers-products-table").DataTable({
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

                $("#suppliers-products-table").DataTable().rows().every(function(rowIdx, tableLoop, rowLoop) {
                    total += 1;
                });

                $(this.api().column(2).footer()).html(total);
            },
            dom: 't',
            rowId: 'id',
            scroller: true,
            autoWidth: true,
            scrollY: '35vh',
            scrollCollapse: true,
        });

        // Setup event triggers for all fields
        setupEventTriggers();

        $("#suppliers-suppliers-search").focus();
    });
})(window, document);

//# sourceURL=suppliers.js 
