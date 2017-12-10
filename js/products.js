var SOURCES_URL = "http://127.0.0.1:80/api/v1/sources/";
var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/";
var SUPPLIERS_URL = "http://127.0.0.1:80/api/v1/suppliers/";
var CATEGORIES_URL = "http://127.0.0.1:80/api/v1/categories/";

var sourceList = {};
var supplierList = {};
var categoryList = {};
var newProduct = false;
var selectedProduct = -1;

function resetPage(productId = 1) {
    $(":input").val('').trigger("change");
    $("#checkbox-hide-product").iCheck('uncheck');

    $("#source-autocomplete").removeData("id");
    $("#supplier-autocomplete").removeData("id");
    $("#category-autocomplete").removeData("id");

    $("#new-source-button").prop('disabled', false);
    $("#cancel-save-button").prop('disabled', true);
    $("#save-product-button").prop('disabled', true);
    $("#new-category-button").prop('disabled', false);

    $("#products-table").DataTable().ajax.reload( function(json) {
        $("#products-table").DataTable().search('').draw();
        $("#products-table").DataTable().select.style("single");
        $("#products-table").DataTable().row("#" + productId).scrollTo()
                                                             .select();
    });

    newProduct = false;
}

function loadCategories() {
    $.get(CATEGORIES_URL)
        .done (function(categories) {
            for (i in categories) {
                categoryList[categories[i].id] = categories[i].name;
            }

            categoryAutocompletOptions = {
                data: categories,

                getValue: function(category) {
                    return category.name;
                },

                template: {
                    type: "custom",
                    method: function(value, item) {
                        return item.name;
                    }
                },

                list: {
                    match: {
                        enabled: true,
                        method: function(element, phrase) {
                            return element.indexOf(phrase) === 0;
                        }
                    },
                    maxNumberOfElements: 100,
                    sort: {
                        enabled: true
                    },

                    onChooseEvent: function() {
                        category = $("#category-autocomplete").getSelectedItemData();
                        $("#category-autocomplete").data("id", category.id);
                        $("#cancel-save-button").prop('disabled', false);
                        $("#save-product-button").prop('disabled', false);
                    },
                }
            };
            $("#category-autocomplete").easyAutocomplete(categoryAutocompletOptions);
        })
        .fail(function() {
            console.log("Failed to get categories.");
        });
}

function loadSources() {
    $.get(SOURCES_URL)
        .done (function(sources) {
            for (i in sources) {
                sourceList[sources[i].id] = sources[i].name;
            }

            sourcesAutocompletOptions = {
                data: sources,

                getValue: function(source) {
                    return source.name;
                },

                template: {
                    type: "custom",
                    method: function(value, item) {
                        return item.name;
                    }
                },

                list: {
                    match: {
                        enabled: true,
                        method: function(element, phrase) {
                            return element.indexOf(phrase) === 0;
                        }
                    },
                    maxNumberOfElements: 100,
                    sort: {
                        enabled: true
                    },

                    onChooseEvent: function() {
                        source = $("#source-autocomplete").getSelectedItemData();
                        $("#source-autocomplete").data("id", source.id);
                        $("#cancel-save-button").prop('disabled', false);
                        $("#save-product-button").prop('disabled', false);
                    },
                }
            };
            $("#source-autocomplete").easyAutocomplete(sourcesAutocompletOptions);
        })
        .fail(function() {
            console.log("Failed to get sources.");
        });
}

function loadProducts() {
    $("#products-table").DataTable({
        ajax: {
            url: PRODUCTS_URL,
            dataSrc: '',
        },
        columns: [
            {data: 'name', searchable: true, type: 'natural'},
            {data: 'description', searchable: false, type: 'natural'},
            {data: 'size', searchable: false, type: 'natural'},
        ],
        order: [[0, 'asc'], [1, 'asc'], [2, 'asc']],
        select: {
            style: 'single',
            items: 'row',
        },
        initComplete: function(settings, json) {
            $("#products-table").DataTable().row(0).select();
        },
        rowId: 'id',
        dom: 't',
        scroller: true,
        scrollY: '23vh',
        scrollCollapse: true,
        autoWidth: true,
    });

    // Override the default smart search
    $("#products-search").on('keyup', function(event, params) {
        $("#products-table").DataTable().search("^" + this.value, true, false).draw();
    });
}

function validateInputs() {
    var success = true;

    var elements = $("#product-name")
                    .add($("#product-cost"))
                    .add($("#product-sell"))
                    .add($("#supplier-autocomplete"))
                    .add($("#category-autocomplete"))
                    .add($("#source-autocomplete"))
                    .add($("#product-stock"));

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
    // Product selected from datatable
    $("#products-table").DataTable().on('select', function(e, dt, type, indexes) {
        var product = $("#products-table").DataTable().rows(indexes).data()[0];
        selectedProduct = product.id;

        $("#product-id").val(product.id).trigger("change");
        $("#product-name").val(product.name).trigger("change");
        $("#product-description").val(product.description).trigger("change");
        $("#product-size").val(product.size).trigger("change");
        $("#product-cost").val(product.cost_price).trigger("change");
        $("#product-sell").val(product.sell_price).trigger("change");
        $("#product-stock").val(product.stock).trigger("change");

        $("#supplier-autocomplete").val(supplierList[product.supplier]).trigger("change");
        $("#supplier-autocomplete").data("id", product.supplier);

        $("#category-autocomplete").val(categoryList[product.category]).trigger("change");
        $("#category-autocomplete").data("id", product.category);

        $("#source-autocomplete").val(sourceList[product.source]).trigger("change");
        $("#source-autocomplete").data("id", product.source);

        var date = new Date(product.created);
        $("#product-created").val(date.toDateString()).trigger("change");

        if (product.hide_product) {
            $("#checkbox-hide-product").iCheck('check');
        } else {
            $("#checkbox-hide-product").iCheck('uncheck');
        }
    });

    // Autocomplete events
    $(".autocomplete").on('focus', function(event, params) {
        // Hack to get easyautocomplete to display it's suggestion list
        var e = jQuery.Event("keyup", {keyCode: 65, which: 65});
        $(this).attr('value', '');
        $(this).triggerHandler(e);
        $(this).trigger('change');
    });

    $(".autocomplete").on('blur', function(event, params) {
        if (!$(this).val()) {
            $(this).removeData("id");
        }
    });

    $(".autocomplete").on('keydown', function(event, params) {
        if (event.keyCode == 9) {
            // If tab press, simulate a enter event aswell so that easyautocomplete
            // triggers it's onChooseEvent.
            var e = jQuery.Event("keydown");
            e.keyCode = 13; // enter key code
            $(this).trigger(e);
        }
    });

    // Format sell/cost price fields to 3 decimal places
    $("#product-sell, #product-cost").on('blur', function(event, params) {
        if ($(this).val()) {
            var newVal = parseFloat($(this).val()).toFixed(3);
            $(this).val(newVal).trigger("change");
        }
    });

    // Logic to reset save button disabled state
    $("#product-id").on('change', function(event, params) {
        if ($(this).val() != selectedProduct) {
            $("#cancel-save-button").prop('disabled', true);
            $("#save-product-button").prop('disabled', true);
        }
    });

    // Logic to detect change in product info and to enable save button
    $(".editable").on('input', function(event, params) {
        $("#cancel-save-button").prop('disabled', false);
        $("#save-product-button").prop('disabled', false);
    });

    $("#checkbox-hide-product").on('ifClicked', function(event, params) {
        $("#cancel-save-button").prop('disabled', false);
        $("#save-product-button").prop('disabled', false);
    });

    // Cancel button clicked
    $("#cancel-save-button").on('click', function(event, params) {
        if (newProduct) {
            resetPage();
        } else {
            $("#products-table").DataTable().rows(".selected").select();
            $("#cancel-save-button").prop('disabled', true);
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
            url = PRODUCTS_URL;
        } else {
            type = "PUT";
            url = PRODUCTS_URL + $("#product-id").val();
        }

        if (validateInputs()) {
            data["name"] = $("#product-name").val();
            data["description"] = $("#product-description").val();
            data["size"] = $("#product-size").val();
            data["cost_price"] = $("#product-cost").val();
            data["sell_price"] = $("#product-sell").val();
            data["stock"] = $("#product-stock").val();
            data["supplier"] = $("#supplier-autocomplete").data("id");
            data["category"] = $("#category-autocomplete").data("id");
            data["source"] = $("#source-autocomplete").data("id");

            $.ajax({
                url: url,
                type: type,
                data: JSON.stringify(data),
                dataType: "json",
                contentType: "application/json",
                success: function(response) {
                    alert("Successfully saved product.");

                    // Save current products name. Then reset page
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

        $("#product-id").val("").trigger("change");
        $(".editable").val("").trigger("change");
        $(".autocomplete").val("").trigger("change");
        $("#checkbox-hide-product").iCheck('uncheck');

        var date = new Date($.now());
        $("#product-created").val(date.toDateString()).trigger("change");

        $("#supplier-autocomplete").removeData("id");
        $("#category-autocomplete").removeData("id");
        $("#source-autocomplete").removeData("id");

        $("#new-source-button").prop('disabled', true);
        $("#new-category-button").prop('disabled', true);
        $("#cancel-save-button").prop('disabled', false);

        $("#products-table").DataTable().select.style("api");
        $("#products-table").DataTable().rows(".selected").deselect();

        $("#product-name").focus();
    });

    // New source button clicked
    $("#new-source-button").on('click', function(event, params) {
        $("#dialog").dialog("option", "title", "New Source")
                    .data("type", "source")
                    .dialog("open");
    });

    // New category button clicked
    $("#new-category-button").on('click', function(event, params) {
        $("#dialog").dialog("option", "title", "New Category")
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
                    var type = $(this).data("type");

                    if (type == "source") {
                        processNewSource($("#dialog-input").val());
                    } else if (type == "category") {
                        processNewCategory($("#dialog-input").val());
                    }

                    $(this).dialog("close");
                }
            }
        ],
        close: function(event, ui) {
            $("#dialog-input").val("");
        },
    });

    // Populate the products, sources and categories drop-down fields
    loadSources();
    loadCategories();
    loadProducts();

    // Get supplier info
    $.get(SUPPLIERS_URL)
        .done (function(suppliers) {
            for (i in suppliers) {
                supplierList[suppliers[i].id] = suppliers[i].company;
            }

            supplierAutocompletOptions = {
                data: suppliers,

                getValue: function(supplier) {
                    return supplier.company;
                },

                template: {
                    type: "custom",
                    method: function(value, item) {
                        var display = item.company;

                        if (item.agent) {
                            display = display + " -- " + item.agent;
                        }

                        if (item.address) {
                            display = display + " -- " + item.address;
                        }

                        return display;
                    }
                },

                list: {
                    match: {
                        enabled: true,
                        method: function(element, phrase) {
                            return element.indexOf(phrase) === 0;
                        }
                    },
                    maxNumberOfElements: 100,
                    sort: {
                        enabled: true
                    },

                    onChooseEvent: function() {
                        supplier = $("#supplier-autocomplete").getSelectedItemData();
                        $("#supplier-autocomplete").data("id", supplier.id);
                        $("#cancel-save-button").prop('disabled', false);
                        $("#save-product-button").prop('disabled', false);
                    },
                }
            };
            $("#supplier-autocomplete").easyAutocomplete(supplierAutocompletOptions);
        })
        .fail(function() {
            console.log("Failed to get suppliers.");
        });

    // Initialize checkbox
    $("#checkbox-hide-product").iCheck({
        checkboxClass: "icheckbox_square-red"
    });

    // Setup event triggers for all fields
    setupEventTriggers();
});
