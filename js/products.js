(function(window, document) {
    var PRODUCTS_POST_URL = "http://127.0.0.1:80/api/v1/products/"
    var SOURCES_URL = "http://127.0.0.1:80/api/v1/sources/?fields=id,name";
    var CATEGORIES_URL = "http://127.0.0.1:80/api/v1/categories/?fields=id,name";
    var SUPPLIERS_URL = "http://127.0.0.1:80/api/v1/suppliers/?fields=id,company,agent,address";
    var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/?ordering=name_sort,description_sort,size_sort";

    var lastFocus = null;
    var sourceList = {};
    var supplierList = {};
    var categoryList = {};
    var newProduct = false;
    var productsTable = null;
    var selectedProduct = -1;
    var skipProductFieldsUpdate = false;

    // Overrides the default autocomplete filter function to search only from the beginning of the string
    $.ui.autocomplete.filter = function (array, term) {
        var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(term), "i");
        return $.grep(array, function (value) {
            return matcher.test(value.label);
        });
    };

    window.refreshProductsPage = function(firstLoad=false) {
        loadCategories(firstLoad);
        loadSources(firstLoad);
        loadSuppliers(firstLoad);

        skipProductFieldsUpdate = !firstLoad;
        loadProducts(firstLoad);
    }

    function resetPage(productId = -1) {
        var row = ':eq(0)'
        if (productId != -1) {
            row = "#" + productId
        }

        $("#products-form :input").val('');
        $("#products-checkbox-hide-product").iCheck('uncheck');

        $("#products-source-autocomplete").removeData("id");
        $("#products-supplier-autocomplete").removeData("id");
        $("#products-category-autocomplete").removeData("id");

        $("#new-source-button").prop('disabled', false);
        $("#products-cancel-save-button").prop('disabled', true);
        $("#save-product-button").prop('disabled', true);
        $("#new-category-button").prop('disabled', false);

        productsTable.ajax.reload( function(json) {
            productsTable.search('').draw();
            productsTable.select.style("single");
            productsTable.row(row).scrollTo().select();
        });

        newProduct = false;
        $("#products-products-search").focus();
    }

    function loadCategories(firstLoad=false) {
        $.get(CATEGORIES_URL)
            .done (function(categories) {
                formattedCategories = [];

                for (i in categories) {
                    categoryList[categories[i].id] = categories[i].name;
                    formattedCategories.push({'label': categories[i].name, 'value': categories[i].id});
                }

                if (firstLoad) {
                    $("#products-category-autocomplete").autocomplete({
                        source: formattedCategories,
                        position: {collision: 'flip'},
                        focus: function(event, ui) {
                            $("#products-category-autocomplete").val(ui.item.label);
                            return false;
                        },
                        select: function(event, ui) {
                            $("#products-category-autocomplete").val(ui.item.label);

                            category = ui.item.value;
                            $("#products-category-autocomplete").data("id", category);
                            $("#products-cancel-save-button").prop('disabled', false);
                            $("#save-product-button").prop('disabled', false);

                            return false;
                        },
                    });
                } else {
                    $("#products-category-autocomplete").autocomplete("option", { source: formattedCategories });
                }
            })
            .fail(function() {
                console.log("Failed to get categories.");
            });
    }

    function loadSources(firstLoad=false) {
        $.get(SOURCES_URL)
            .done (function(sources) {
                formattedSources = [];

                for (i in sources) {
                    sourceList[sources[i].id] = sources[i].name;
                    formattedSources.push({'label': sources[i].name, 'value': sources[i].id});
                }

                if (firstLoad) {
                    $("#products-source-autocomplete").autocomplete({
                        source: formattedSources,
                        position: {collision: 'flip'},
                        focus: function(event, ui) {
                            $("#products-source-autocomplete").val(ui.item.label);
                            return false;
                        },
                        select: function(event, ui) {
                            $("#products-source-autocomplete").val(ui.item.label);

                            source = ui.item.value;
                            $("#products-source-autocomplete").data("id", source);
                            $("#products-cancel-save-button").prop('disabled', false);
                            $("#save-product-button").prop('disabled', false);

                            return false;
                        },
                    });
                } else {
                    $("#products-source-autocomplete").autocomplete("option", { source: formattedSources });
                }
            })
            .fail(function() {
                console.log("Failed to get sources.");
            });
    }

    function loadSuppliers(firstLoad=false) {
        // Get supplier info
        $.get(SUPPLIERS_URL)
            .done (function(suppliers) {
                formattedSuppliers = [];

                for (i in suppliers) {
                    supplierList[suppliers[i].id] = suppliers[i].company;
                    formattedSuppliers.push({'label': suppliers[i].company, 'value': suppliers[i].id});
                }

                if (firstLoad) {
                    $("#products-supplier-autocomplete").autocomplete({
                        source: formattedSuppliers,
                        position: {collision: 'flip'},
                        focus: function(event, ui) {
                            $("#products-supplier-autocomplete").val(ui.item.label);
                            return false;
                        },
                        select: function(event, ui) {
                            $("#products-supplier-autocomplete").val(ui.item.label);

                            supplier = ui.item.value;
                            $("#products-supplier-autocomplete").data("id", supplier);
                            $("#products-cancel-save-button").prop('disabled', false);
                            $("#save-product-button").prop('disabled', false);

                            return false;
                        },
                    });
                } else {
                    $("#products-supplier-autocomplete").autocomplete("option", { source: formattedSuppliers });
                }
            })
            .fail(function() {
                console.log("Failed to get suppliers.");
            });
    }

    function loadProducts(firstLoad=false) {
        if (firstLoad) {
            productsTable = $("#products-products-table").DataTable({
                ajax: {
                    url: PRODUCTS_URL,
                    dataSrc: '',
                },
                columns: [
                    {data: 'name', searchable: true},
                    {data: 'description', searchable: false},
                    {data: 'size', searchable: false},
                ],
                select: {
                    style: 'single',
                    items: 'row',
                },
                initComplete: function(settings, json) {
                    $("#products-products-table").DataTable().row(':eq(0)').select();
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
            var typewatch_options = {
                callback: function(value) { productsTable.search("^" + this.value, true, false).draw(); },
                wait: 500,
                highlight: true,
                captureLength: 1,
            }
            $("#products-products-search").typeWatch(typewatch_options);
        } else {
            productsTable.ajax.reload();
        }
    }

    function validateInputs() {
        var success = true;

        if (parseFloat($("#products-product-sell").val()) < parseFloat($("#products-product-cost").val())) {
            alert("Sell price can not be lower than cost price.");
            $("#products-product-sell").focus();
            return false;
        }

        var elements = $("#products-product-name")
                        .add($("#products-product-cost"))
                        .add($("#products-product-sell"))
                        .add($("#products-supplier-autocomplete"))
                        .add($("#products-category-autocomplete"))
                        .add($("#products-source-autocomplete"))
                        .add($("#products-product-stock"));

        elements.each(function() {
            if (!$(this).data("id")) {
                if ($(this).val() == "") {
                    $(this).focus();
                    success = false;
                    // return false is needed to break out of
                    // the each loop.
                    return false;
                }
            }
        });

        return success;
    }

    function setupEventTriggers() {
        // products-form event triggers
        $('#products-form').on('focusin', ':input', function() {
            lastFocus = $(document.activeElement);
        });

        $('#products-form').on('show', function() {
            setTimeout( function() {
                if (lastFocus) {
                    lastFocus.focus();
                } else {
                    $("#products-products-search").focus();
                }
            }, 1);
        });

        // DataTable event triggers
        productsTable.on('select', function(e, dt, type, indexes) {
            if (!skipProductFieldsUpdate) {
                lastFocus = null;

                var product = productsTable.rows(indexes).data()[0];
                selectedProduct = product.id;

                $("#products-product-id").val(product.id).trigger("change");
                $("#products-product-name").val(product.name).trigger("change");
                $("#products-product-description").val(product.description).trigger("change");
                $("#products-product-size").val(product.size).trigger("change");
                $("#products-product-cost").val(product.cost_price).trigger("change");
                $("#products-product-sell").val(product.sell_price).trigger("change");
                $("#products-product-stock").val(product.stock).trigger("change");

                $("#products-supplier-autocomplete").val(supplierList[product.supplier]).trigger("change");
                $("#products-supplier-autocomplete").data("id", product.supplier);

                $("#products-category-autocomplete").val(categoryList[product.category]).trigger("change");
                $("#products-category-autocomplete").data("id", product.category);

                $("#products-source-autocomplete").val(sourceList[product.source]).trigger("change");
                $("#products-source-autocomplete").data("id", product.source);

                var date = new Date(product.created);
                $("#products-product-created").val(date.toDateString()).trigger("change");

                if (product.hide_product) {
                    $("#products-checkbox-hide-product").iCheck('check');
                } else {
                    $("#products-checkbox-hide-product").iCheck('uncheck');
                }
            } else {
                skipProductFieldsUpdate = false;
            }
        });

        productsTable.on('key-focus', function(e, dt, cell) {
            var row = dt.row(cell.index().row).node();
            $(row).addClass('tab-focus');
        });

        productsTable.on('key-blur', function(e, dt, cell) {
            var row = dt.row(cell.index().row).node();
            $(row).removeClass('tab-focus');
        });

        productsTable.on('key', function(e, dt, key, cell, originalEvent) {
            // Enter key
            if (key == 13) {
                var row = dt.row(cell.index().row)

                if ($(row.node()).hasClass('selected')) {
                    row.deselect();
                } else {
                    row.select();
                    dt.cell.blur();
                    $("#products-product-name").focus();
                }
            }
        });

        // Format sell/cost price fields to 3 decimal places
        $("#products-product-sell, #products-product-cost").on('blur', function(event, params) {
            if ($(this).val()) {
                var newVal = parseFloat($(this).val()).toFixed(3);
                $(this).val(newVal).trigger("change");
            }
        });

        // Logic to reset save button disabled state
        $("#products-product-id").on('change', function(event, params) {
            if ($(this).val() != selectedProduct) {
                $("#products-cancel-save-button").prop('disabled', true);
                $("#save-product-button").prop('disabled', true);
            }
        });

        // Logic to detect change in product info and to enable save button
        $(".editable").on('input', function(event, params) {
            $("#products-cancel-save-button").prop('disabled', false);
            $("#save-product-button").prop('disabled', false);
        });

        $("#products-checkbox-hide-product").on('ifClicked', function(event, params) {
            $("#products-cancel-save-button").prop('disabled', false);
            $("#save-product-button").prop('disabled', false);
        });

        // Cancel button clicked
        $("#products-cancel-save-button").on('click', function(event, params) {
            if (newProduct) {
                resetPage();
            } else {
                productsTable.rows(".selected").select();
                $("#products-cancel-save-button").prop('disabled', true);
                $("#save-product-button").prop('disabled', true);
            }
        });

        // Save button clicked
        $("#save-product-button").on('click', function(event, params) {
            var url = "";
            var type = "";
            var data = {};

            if (newProduct) {
                type = "POST";
                url = PRODUCTS_POST_URL;
            } else {
                type = "PUT";
                url = PRODUCTS_POST_URL + $("#products-product-id").val() + "/";
            }

            if (validateInputs()) {
                data["name"] = $("#products-product-name").val();
                data["description"] = $("#products-product-description").val();
                data["size"] = $("#products-product-size").val();
                data["cost_price"] = $("#products-product-cost").val();
                data["sell_price"] = $("#products-product-sell").val();
                data["stock"] = $("#products-product-stock").val();
                data["supplier"] = $("#products-supplier-autocomplete").data("id");
                data["category"] = $("#products-category-autocomplete").data("id");
                data["source"] = $("#products-source-autocomplete").data("id");
                data["hide_product"] = $("#products-checkbox-hide-product").closest('div').hasClass("checked");

                $.ajax({
                    url: url,
                    type: type,
                    data: JSON.stringify(data),
                    dataType: "json",
                    contentType: "application/json",
                    success: function(response) {
                        alert("Successfully saved product.");

                        // Save current product's id. Then reset page
                        // and set the current product as the saved product
                        resetPage(response.id);
                    },
                    error: function(response) {
                        alert("Failed to save product. " + JSON.stringify(response));
                    }
                });
            }
        });

        // New product button clicked
        $("#new-product-button").on('click', function(event, params) {
            newProduct = true;
            selectedProduct = -1;

            $(".editable").val("").trigger("change");
            $("#products-product-id").val("").trigger("change");
            $("#products-checkbox-hide-product").iCheck('uncheck');
            $("#products-source-autocomplete").val("").trigger("change");
            $("#products-category-autocomplete").val("").trigger("change");
            $("#products-supplier-autocomplete").val("").trigger("change");

            var date = new Date($.now());
            $("#products-product-created").val(date.toDateString()).trigger("change");

            $("#products-supplier-autocomplete").removeData("id");
            $("#products-category-autocomplete").removeData("id");
            $("#products-source-autocomplete").removeData("id");

            $("#new-source-button").prop('disabled', true);
            $("#new-category-button").prop('disabled', true);
            $("#products-cancel-save-button").prop('disabled', false);

            productsTable.select.style("api");
            productsTable.rows(".selected").deselect();

            $("#products-product-name").focus();
        });

        // New source button clicked
        $("#new-source-button").on('click', function(event, params) {
            $("#products-dialog").dialog("option", "title", "New Source")
                        .data("type", "source")
                        .dialog("open");
        });

        // New category button clicked
        $("#new-category-button").on('click', function(event, params) {
            $("#products-dialog").dialog("option", "title", "New Category")
                        .data("type", "category")
                        .dialog("open");
        });
    }

    function processNewSource(newSource) {
        for (var key in sourceList) {
            if (sourceList[key].toLowerCase() == newSource.toLowerCase()) {
                alert("Source '" + newSource + "'' already exists.");
                return;
            }
        }

        // New source, add to DB and reload autocomplete input
        var data = {};
        data["name"] = newSource;

        $.ajax({
            url: SOURCES_URL,
            type: "POST",
            data: JSON.stringify(data),
            dataType: "json",
            contentType: "application/json",
            success: function(response) {
                alert("Successfully saved source.");
                loadSources();
            },
            error: function(response) {
                alert("Failed to save source. " + JSON.stringify(response));
            }
        });
    }

    function processNewCategory(newCategory) {
        for (var key in sourceList) {
            if (categoryList[key].toLowerCase() == newCategory.toLowerCase()) {
                alert("Category '" + newCategory + "'' already exists.");
                return;
            }
        }

        // New category, add to DB and reload autocomplete input
        var data = {};
        data["name"] = newCategory;

        $.ajax({
            url: CATEGORIES_URL,
            type: "POST",
            data: JSON.stringify(data),
            dataType: "json",
            contentType: "application/json",
            success: function(response) {
                alert("Successfully saved category.");
                loadCategories();
            },
            error: function(response) {
                alert("Failed to save category. " + JSON.stringify(response));
            }
        });
    }

    $(document).ready(function() {
        // Setup dialog
        $("#products-dialog").dialog({
            autoOpen: false,
            closeOpEscape: false,
            draggable: false,
            modal: true,
            resizable: false,
            buttons: [
                {
                    text: "Save",
                    click: function() {
                        var type = $(this).data("type");

                        if (type == "source") {
                            processNewSource($("#products-dialog-input").val());
                        } else if (type == "category") {
                            processNewCategory($("#products-dialog-input").val());
                        }

                        $(this).dialog("close");
                    }
                }
            ],
            close: function(event, ui) {
                $("#products-dialog-input").val("");
            },
        });

        // Populate the products, sources, categories and suppliers drop-down fields
        refreshProductsPage(firstLoad=true)

        // Initialize checkbox
        $("#products-checkbox-hide-product").iCheck({
            checkboxClass: "icheckbox_square-red"
        });

        // Setup event triggers for all fields
        setupEventTriggers();

        $("#products-products-search").focus();
    });
})(window, document);

//# sourceURL=products.js 
