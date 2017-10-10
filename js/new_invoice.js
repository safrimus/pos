var SOURCES_URL = "http://127.0.0.1:80/api/v1/sources/";
var INVOICE_URL = "http://127.0.0.1:80/api/v1/invoices/";
var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/";
var SUPPLIERS_URL = "http://127.0.0.1:80/api/v1/suppliers/";
var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/";
var CATEGORIES_URL = "http://127.0.0.1:80/api/v1/categories/";

var sourceList = {};
var supplierList = {};
var categoryList = {};
var creditInvoice = false;
var selectedCustomer = -1;
var activeAutocomplete = -1;
var productAutocompletOptions = -1;


function updateInvoiceProductTotal(currElem, otherClass, newValue) {
    var otherValue = currElem.closest('tr').find('.' + otherClass).text();

    if ($.trim(otherValue) != '' && $.isNumeric(otherValue)) {
        var total = newValue * otherValue;
        currElem.closest('tr').find('.product-total').text(total.toFixed(3));

        updateInvoiceTotal();
        return true;
    }

    return false;
}

function updateInvoiceProductPrice(currElem, productTotal = '', quantity = '') {
    // No productTotal implies quantity has been changed.
    if ($.trim(productTotal) == '') {
        productTotal = currElem.closest('tr').find('.product-total').text();
    }
    // No quantity implies productTotal has been changed.
    else if ($.trim(quantity) == '') {
        quantity = currElem.closest('tr').find('.quantity').text();
    }

    var price = 0;

    if (quantity > 0) {
        price = productTotal / quantity;
        currElem.closest('tr').find('.price').text(price.toFixed(3));
    } else {
        currElem.closest('tr').find('.price').text(price.toFixed(3));
    }
}

function updateInvoiceTotal() {
    var total = 0;

    $("#product-list-table").find(".product-total").each(function () {
        total += parseFloat($(this).text());
    });

    $("#invoice-total").text(total.toFixed(3) + " KD");
}

function validInput(input, value) {
    if ($.isNumeric(value)) {
        input.removeClass('edit-input-error');
        return true;
    } else {
        input.addClass('edit-input-error');
        return false;
    }
}

function setupEventTriggers() {
    // Product autocomplete event triggers
    $("#product-list-table tbody").on('focus', '.autocomplete', function(event, params) {
        activeAutocomplete = $(this);

        var e = jQuery.Event("keyup");
        // Simulate a backspace event so that easyautocomplete
        // reloads it's suggestion list.
        e.keyCode = 8;  // backspace
        $(this).trigger(e);

        // Simulate a down arrow event so that easyautocomplete
        // triggers it's onSelectItemEvent.
        e.keyCode = 40;  // backspace
        $(this).trigger(e);
    });

    $("#product-list-table tbody").on('blur', '.autocomplete', function(event, params) {
        if ($(this).val() == "") {
            $(this).closest('tr').removeData("product-id");

            $(this).closest('tr').find(".quantity").text("0");
            $(this).closest('tr').find(".price").text("0.000");
            $(this).closest('tr').find(".product-total").text("0.000");

            var nextRow = $(this).closest('tr').next()
            if (nextRow.find("input").val() == "") {
                nextRow.remove();
            }
        };

        // Check if the next row has been created already
        if ($("#product-list-table tr:last td input").val() != "") {
            var id = "product-autocomplete-" + $("#product-list-table tr").length

            var closeIcon = "<td class=\"delete-button\"><button type=\"button\" class=\"close\"><span>&times;</span></button></td>";
            var name = "<td><input id=\"" + id + "\" class=\"autocomplete\"></td>";
            var quantity = "<td><label class=\"quantity\" tabindex=\"99\" style>0</label><input class=\"edit-input\"/></td>";
            var price = "<td><label class=\"price\" tabindex=\"99\">0.000</label><input class=\"edit-input\"/></td>";
            var productTotal = "<td><label class=\"product-total\" tabindex=\"99\">0.000</label><input class=\"edit-input\"/></td>";

            var newProduct = $("<tr class=\"highlight\">" + closeIcon + name + quantity + price + productTotal + "</tr>").appendTo("#product-list-table > tbody:last-child");

            $("#" + id).easyAutocomplete(productAutocompletOptions);
        }
    });

    $("#product-list-table tbody").on('keydown', '.autocomplete', function(event, params) {
        if (event.shiftKey && event.keyCode == 9) {
            event.preventDefault();

            var prevRow = $(this).closest('tr').prev()

            if (prevRow.length) {
                prevRow.children('td:last').find('label').focus();
            } else {
                $("#customer-autocomplete").focus();
            }
        } else if (event.keyCode == 9) {
            event.preventDefault();
            // If tab press, simulate a enter event aswell so that easyautocomplete
            // triggers it's onChooseEvent.
            var e = jQuery.Event("keydown");
            e.keyCode = 13; // enter key code
            $(this).trigger(e);
        } else if (event.keyCode == 13) {
            $(this).closest('td').next().children('label').focus();
        }
    });

    // Customer autocomplete event triggers
    $("#customer-autocomplete").on('keydown', function(event, params) {
        if (event.keyCode == 9) {
            event.preventDefault();
            // If tab press, simulate a enter event aswell so that easyautocomplete
            // triggers it's onChooseEvent.
            var e = jQuery.Event("keydown");
            e.keyCode = 13; // enter key code
            $(this).trigger(e);
        } else if (event.keyCode == 13) {
            $("#product-autocomplete").focus();
        }
    });

    // Editable field event triggers
    $("#product-list-table tbody").on('click', '.delete-button', function(event, params) {
        $(this).closest('tr').remove();
        updateInvoiceTotal();
    });
    
    $("#product-list-table tbody").on('focus', '.quantity, .price, .product-total', function(event, params) {
        $(this).hide();
        $(this).parent().children(".edit-input")
            .val($(this).text())
            .show()
            .focus();
    });

    $("#product-list-table tbody").on('blur', '.edit-input', function(event, params) {
        var self = this;
        var newValue = $(this).val();
        var className = $(this).parent().children('label').attr('class');

        // Validate input value
        if (!validInput($(this), newValue)) {
            setTimeout(function() { self.focus(); }, 0);
            return;
        }

        // Calculate and update values for quantity/price/product-total
        // based on user inputted value.
        if (className == "quantity") {
            if (!updateInvoiceProductTotal($(this), 'price', newValue)) {
                updateInvoiceProductPrice($(this), '', newValue);
            }
        } else if (className == "price") {
            updateInvoiceProductTotal($(this), 'quantity', newValue);
            newValue = parseFloat(newValue).toFixed(3)
        } else if (className == "product-total") {
            updateInvoiceProductPrice($(this), newValue);
            newValue = parseFloat(newValue).toFixed(3)
        }

        // Hide input field and show label.
        $(this).hide();
        $(this).parent().children('label')
            .show()
            .text(newValue);
    });

    $("#product-list-table tbody").on('keydown', '.edit-input', function(event) {
        if (event.shiftKey && event.keyCode == 9) {
            event.preventDefault();

            var prevCell = $(this).parent().prev().children('label');
            // Check if prev cell contains a label. If not, implies prev cell is autocomplete.
            if (validInput($(this), $(this).val())) {
                if (prevCell.length) {
                    prevCell.focus();
                } else {
                    $(this).parent().prev().find('input').focus();
                }
            }
        } else if (event.keyCode == 9 || event.keyCode == 13) {
            event.preventDefault();

            var nextCell = $(this).parent().next();
            // Check if next cell contains a label. If not, implies end of row. Move focus to next row.
            if (validInput($(this), $(this).val())) {
                if (nextCell.length) {
                    nextCell.children('label').focus();
                } else {
                    $(this).closest('tr').next().children('td:first').next().find('input').focus();
                }
            }
        }
    });

    // Cost price card visibility
    $("#product-sell-price").on('click', function(event, params) {
        if ($("#hidden-card").css('visibility') == 'hidden') {
            $("#hidden-card").css('visibility', 'visible');
        }
        else {
            $("#hidden-card").css('visibility', 'hidden');
        }
    });
}

$(document).ready(function() {
    // Setup event triggers for all fields
    setupEventTriggers();

    // Populate the products drop-down field
    $.get(PRODUCTS_URL)
        .done(function(products) {
            productAutocompletOptions = {
                data: products,

                getValue: function(product) {
                    var display = product.name;

                    if (product.description) {
                        display = display + ", " + product.description;
                    }

                    if (product.size) {
                        display = display + ", " + product.size;
                    }

                    return display;
                },

                // theme: "dark",

                template: {
                    type: "custom",
                    method: function(value, item) {
                        return item.name + " | " + item.description + " | " + item.size;
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
                        product = activeAutocomplete.getSelectedItemData();
        
                        // Attach product id to newProduct
                        activeAutocomplete.closest('tr').data("product-id", product.id);
                    },

                    onSelectItemEvent: function() {
                        product = activeAutocomplete.getSelectedItemData();

                        $("#product-description").val(product.description).trigger("change");
                        $("#product-size").val(product.size).trigger("change");
                        $("#product-cost-price").val(product.cost_price).trigger("change");
                        $("#product-sell-price").val(product.sell_price).trigger("change");
                        $("#product-stock").val(product.stock).trigger("change");
                        $("#product-supplier").val(supplierList[product.supplier]).trigger("change");
                        $("#product-category").val(categoryList[product.category]).trigger("change");
                        $("#product-source").val(sourceList[product.source]).trigger("change");
                    },
                }
            };
            console.log("Loaded Products");
            $("#product-autocomplete").easyAutocomplete(productAutocompletOptions);
        })
        .fail(function() {
            console.log("Failed to get products.");
        });

    // Populate the customers drop-down field
    $.get(CUSTOMERS_URL)
        .done(function(customers) {
            var options = {
                data: customers,

                getValue: function(customer) {
                    return customer.name;
                },

                // theme: "dark",

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
                        selectedCustomer = $("#customer-autocomplete").getSelectedItemData();
                    },
                }
            };
            $("#customer-autocomplete").easyAutocomplete(options);
            console.log("Loaded Customers");
        })
        .fail(function() {
            console.log("Failed to get customers.");
        });

    // Get supplier, category and source info
    $.get(SUPPLIERS_URL)
        .done (function(suppliers) {
            for (i in suppliers) {
                supplierList[suppliers[i].id] = suppliers[i].company;
            }
        })
        .fail(function() {
            console.log("Failed to get suppliers.");
        });

    $.get(CATEGORIES_URL)
        .done (function(categories) {
            for (i in categories) {
                categoryList[categories[i].id] = categories[i].name;
            }
        })
        .fail(function() {
            console.log("Failed to get categories.");
        });

    $.get(SOURCES_URL)
        .done (function(sources) {
            for (i in sources) {
                sourceList[sources[i].id] = sources[i].name;
            }
        })
        .fail(function() {
            console.log("Failed to get sources.");
        });

    // Finalize invoice button
    $("#finalize-invoice-button").on('click', function(event, params) {
        var data = {};
        var products = [];

        // Validate if invoice is not empty and customer has been selected
        if (parseFloat($(".product-total").text()) == 0.0) {
            $("#product-autocomplete").focus();
            return;
        }

        if (selectedCustomer == -1) {
            $("#customer-autocomplete").focus();
            return;
        }

        if (!$("#invoice-date").datepicker("getDate")) {
            $("#invoice-date").focus();
            return;
        }

        $("#product-list-table tbody tr").each(function() {
            var product_info = {};

            if ($(this).find(".quantity").text() != 0 && parseFloat($(this).find(".price").text()) != 0.0) {
                product_info["product"] = $(this).data("product-id");
                product_info["quantity"] = $(this).find(".quantity").text();
                product_info["sell_price"] = $(this).find(".price").text();

                products.push(product_info);
            }
        });

        data["credit"] = creditInvoice;
        data["products"] = products;
        data["customer"] = selectedCustomer.id;
        data["date_of_sale"] = $("#invoice-date").datepicker("getDate");

        $.ajax({
            url: INVOICE_URL,
            type: "POST",
            data: JSON.stringify(data),
            dataType: "json",
            contentType: "application/json",
            success: function(response) {
                alert("Successfully saved invoice");
                location.reload(true);
            },
            error: function(response) {
                alert("Failed to save invoice");
            }
        });
    });

    // Checkboxes
    $(".checkbox").iCheck({
        checkboxClass: "icheckbox_square-red",
        radioClass: "iradio_square-red",
    });

    $("#checkbox-true").on("ifChecked", function() {
        creditInvoice = true;
    });

    $("#checkbox-false").on("ifChecked", function() {
        creditInvoice = false;
    });

    // Datetime picker
    $.datepicker.setDefaults({
        changeMonth: true,
        constrainInput: true,
        dateFormat: "D, d M yy",
        duration: "fast",
    });

    // First line to init the datepicker
    $("#invoice-date").datepicker();
    $("#invoice-date").datepicker('setDate', 'today');
});
