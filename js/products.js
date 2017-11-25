var SOURCES_URL = "http://127.0.0.1:80/api/v1/sources/";
var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/";
var SUPPLIERS_URL = "http://127.0.0.1:80/api/v1/suppliers/";
var CATEGORIES_URL = "http://127.0.0.1:80/api/v1/categories/";

var sourceList = {};
var supplierList = {};
var categoryList = {};
var newProduct = false;
var selectedProduct = -1;
var productModified = false;


function constructProductDisplay(name, description, size) {
    var display = name;

    if (description) {
        display = display + " -- " + description;
    }

    if (size) {
        display = display + " -- " + size;
    }

    return display;
}

function resetPage(name) {
    $(":input").val('').trigger("change");
    $("#checkbox-hide-product").iCheck('uncheck');

    $("#source-autocomplete").removeData("id");
    $("#supplier-autocomplete").removeData("id");
    $("#category-autocomplete").removeData("id");

    $("#cancel-save-button").prop('disabled', true);
    $("#save-product-button").prop('disabled', true);
    $("#product-autocomplete").prop('disabled', false);

    newProduct = false;
    selectedProduct = -1;
    productModified = false;

    getProducts(name);
}

function selectProduct(name) {
    $("#product-autocomplete").val(name).trigger("change");
    $("#product-autocomplete").focus();

    if (name) {
        var e = jQuery.Event("keyup");
        e.keyCode = 40;  // down arrow key code
        $("#product-autocomplete").trigger(e);

        e = jQuery.Event("keydown");
        e.keyCode = 13;  // enter key code
        $("#product-autocomplete").trigger(e);
    }
}

function getProducts(name) {
    $.get(PRODUCTS_URL)
        .done(function(products) {
            productAutocompletOptions = {
                data: products,

                getValue: function(product) {
                    return constructProductDisplay(product.name, product.description, product.size)
                },

                template: {
                    type: "custom",
                    method: function(value, item) {
                        var display = item.name;

                        if (item.description) {
                            display = display + " -- " + item.description;
                        }

                        if (item.size) {
                            display = display + " -- " + item.size;
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
                        product = $("#product-autocomplete").getSelectedItemData();

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
                    },
                }
            };
            console.log("Loaded Products");
            $("#product-autocomplete").easyAutocomplete(productAutocompletOptions);

            if (name) {
                selectProduct(name);
            }
        })
        .fail(function() {
            console.log("Failed to get products.");
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
    // Autocomplete events
    $(".autocomplete").on('focus', function(event, params) {
        var e = jQuery.Event("keyup");
        // Simulate a backspace event so that easyautocomplete
        // reloads it's suggestion list.
        e.keyCode = 8;  // backspace
        $(this).trigger(e);
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
        var newVal = parseFloat($(this).val()).toFixed(3);
        $(this).val(newVal).trigger("change");
    });

    // Logic to reset save button disabled state
    $("#product-id").on('change', function(event, params) {
        if ($(this).val() != selectedProduct) {
            $("#cancel-save-button").prop('disabled', true);
            $("#save-product-button").prop('disabled', true);
            selectedProduct = $(this).val();
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
            resetPage("1");
        } else {
            selectProduct($("#product-autocomplete").val());
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
                    alert("Successfully saved product");

                    // Save current products name. Then reset page
                    // and set the current product as the saved product
                    var name = constructProductDisplay($("#product-name").val(),
                                                       $("#product-description").val(),
                                                       $("#product-size").val());
                    resetPage(name);
                },
                error: function(response) {
                    alert("Failed to save product");
                }
            });
        }
    });

    // New product button clicked
    $("#new-product-button").on('click', function(event, params) {
        newProduct = true;

        $("#product-id").val("").trigger("change");
        $(".editable").val("").trigger("change");
        $(".autocomplete").val("").trigger("change");
        $("#checkbox-hide-product").iCheck('uncheck');

        var date = new Date($.now());
        $("#product-created").val(date.toDateString()).trigger("change");

        $("#supplier-autocomplete").removeData("id");
        $("#category-autocomplete").removeData("id");
        $("#source-autocomplete").removeData("id");

        $("#cancel-save-button").prop('disabled', false);
        $("#product-autocomplete").prop('disabled', true);

        $("#product-name").focus();
    });

}

$(document).ready(function() {
    setupEventTriggers();

    // Populate the products drop-down field
    getProducts("");

    // Get supplier, category and source info
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

    // Initialize checkbox
    $("#checkbox-hide-product").iCheck({
        checkboxClass: "icheckbox_square-red"
    });
});
