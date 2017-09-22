var INVOICE_URL = "http://127.0.0.1:80/api/v1/invoices/"
var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/"
var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/"
var knownProducts = -1;
var selectedCustomer = -1;
var creditInvoice = false;


function clearProduct() {
    $("#product-autocomplete").val("").trigger("change");
    $("#product-id").val("").trigger("change");
    $("#product-description").val("").trigger("change");
    $("#product-size").val("").trigger("change");
    $("#product-cost-price").val("").trigger("change");
    $("#product-sell-price").val("").trigger("change");
    $("#product-supplier").val("").trigger("change");
    $("#product-stock").val("").trigger("change");

    selectedProduct = -1;
}

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

    if ($.isNumeric(productTotal) && $.isNumeric(quantity)) {
        var price = productTotal / quantity;
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

function findSelectedProduct(id) {
    var match;
    $("#product-list-table tbody tr").each(function() {
        if (id == $(this).data("product-id")) {
            match = $(this);
            return false;
        }
    });

    return match;
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

function setupEditableFields() {
    // Editable fields
    $(".delete-button").click(function() {
        $(this).closest('tr').remove();
        updateInvoiceTotal();
        if ($("#product-list-table tbody tr").length == 0) {
            $("#finalize-invoice-button").prop("disabled", true);
        }
    });
    
    $(".quantity, .price, .product-total").on('focus', function(event, params) {
        $(this).hide();
        $(this).parent().children(".edit-input")
            .val($(this).text())
            .show()
            .focus();
    });

    $(".edit-input").on('blur', function(event, params) {
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

    $(".edit-input").on('keydown', function(event) {
        if (event.shiftKey && event.which == 9) {
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
        } else if (event.which == 9 || event.which == 13) {
            event.preventDefault();

            var nextCell = $(this).parent().next();
            // Check if next cell contains a label. If not, implies end of row. Move focus to next row.
            if (validInput($(this), $(this).val())) {
                if (nextCell.length) {
                    nextCell.children('label').focus();
                } else {
                    $(this).parent().parent().next().children('td:first').next().find('input').focus();
                }
            }
        }
    });
}

$(document).ready(function() {
    setupEditableFields();

    // Populate the products drop-down field
    $.get(PRODUCTS_URL)
        .done(function(products) {
            knownProducts = products

            var options = {
                data: products,

                getValue: function(product) {
                    return product.name;
                },

                theme: "dark",

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
                            if (element.indexOf(phrase) === 0) {
                                return true;
                            } else {
                                return false;
                            }
                        }
                    },
                    maxNumberOfElements: 100,
                    sort: {
                        enabled: true
                    },

                    onChooseEvent: function() {
                        var product = $("#product-autocomplete").getSelectedItemData()

                        // Check if the next row has been created already
                        if ($("#product-list-table tr:last td input").val() != "") {
                            var id = "product-autocomplete-" + $("#product-list-table tr").length

                            var closeIcon = "<td class=\"delete-button\"><button type=\"button\" class=\"close\"></button></td>";
                            var name = "<td><input id=\"" + id + "\"></td>";
                            var quantity = "<td class=\"editable quantity\">0</td>";
                            var price = "<td class=\"editable price\">0.000</td>";
                            var productTotal = "<td class=\"editable product-total\"></td>";

                            var newProduct = $("<tr class=\"highlight\">" + closeIcon + name + quantity + price + productTotal + "</tr>").appendTo("#product-list-table > tbody:last-child");
                            $("#" + id).easyAutocomplete(options);
                        }

                    },

                    onHideListEvent: function() {
                        // if ($("#product-autocomplete").val() == "") {
                        //     clearProduct();
                        // }
                    },
                }
            };
            $("#product-autocomplete").easyAutocomplete(options);
            console.log("Loaded Products");
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

                theme: "dark",

                template: {
                    type: "custom",
                    method: function(value, item) {
                        return item.name;
                    }
                },

                list: {
                    match: {
                        enabled: true
                    },
                    maxNumberOfElements: 100,
                    sort: {
                        enabled: true
                    },

                    onSelectItemEvent: function() {
                        var customer = $("#customer-autocomplete").getSelectedItemData();
                        selectedCustomer = customer;
                    },
                }
            };
            $("#customer-autocomplete").easyAutocomplete(options);
            console.log("Loaded Customers");
        })
        .fail(function() {
            console.log("Failed to get customers.");
        });

    // Select product button
    $("#select-product-button").click(function() {
        if (selectedProduct != -1) {
            var existingProduct = findSelectedProduct(selectedProduct.id);

            if (existingProduct) {
                existingProduct.find(".quantity").focus();
            }
            else {
                var closeIcon = "<td class=\"delete-button\"><button type=\"button\" class=\"close\"></button></td>";
                var name = "<td> " + selectedProduct.name + "</td>";
                var quantity = "<td class=\"editable quantity\">0</td>";
                var price = "<td class=\"editable price\">0.000</td>";
                var productTotal = "<td class=\"editable product-total\"></td>";

                var newProduct = $("<tr class=\"highlight\">" + closeIcon + name + quantity + price + productTotal + "</tr>").appendTo("#product-list-table > tbody:last-child");

                // Attach product id to newProduct
                newProduct.data("product-id", selectedProduct.id);

                // Update the invoice total
                var total = newProduct.find(".price").text() * newProduct.find(".quantity").text()
                newProduct.find(".product-total").text(total);

                // Editable fields
                $("#product-list-table .editable").editable({
                    mode: 'inline',
                    tpl: "<input type='text' style='width: 100px'>",
                    unsavedclass: null,
                    emptytext: 'required',
                    validate: function(value) {
                        if($.trim(value) == '') {
                            return 'This field is required';
                        }

                        if (!$.isNumeric(value)) {
                            return 'Only numbers accepted';
                        }
                    },
                    display: function(value) {
                        if ($.isNumeric(value)) {
                            $(this).html(parseFloat(value).toFixed(3));
                        }
                    }
                });

                $(".delete-button").click(function() {
                    $(this).closest('tr').remove();
                    updateInvoiceTotal();
                    if ($("#product-list-table tbody tr").length == 0) {
                        $("#finalize-invoice-button").prop("disabled", true);
                    }
                });

                // Register save event triggers
                $(".quantity").on('save', function(event, params) {
                    if (!updateInvoiceProductTotal($(this), 'price', params.newValue)) {
                        updateInvoiceProductPrice($(this), '', params.newValue);
                    }
                });

                $(".price").on('save', function(event, params) {
                    updateInvoiceProductTotal($(this), 'quantity', params.newValue);
                });

                $(".product-total").on('save', function(e, params) {
                    updateInvoiceProductPrice($(this), params.newValue);
                });

                $(".product-total").on('hidden', function(e, params) {
                    updateInvoiceTotal();
                });

                $("#finalize-invoice-button").prop("disabled", false);
            }
            clearProduct();
        }
    });

    // Setup validation
    // var formValidator = $("#form").validate({
    //     rules :{
    //         customerAutocomplete: "required",
    //     },
    //     messages: {
    //         customerAutocomplete: "Please select a customer",
    //     },
    //     onsubmit: false
    // });

    // Finalize invoice button
    $("#finalize-invoice-button").click(function() {
        if ($("form").valid()) {
            var data = {};
            var products = [];

            $("#product-list-table tbody tr").each(function() {
                var product_info = {};

                product_info["product"] = $(this).data("product-id");
                product_info["quantity"] = $(this).find(".quantity").text();
                product_info["sell_price"] = $(this).find(".price").text();

                products.push(product_info);
            });

            data["credit"] = creditInvoice;
            data["products"] = products;
            data["customer"] = selectedCustomer.id;

            $.ajax({
                url: INVOICE_URL,
                type: "POST",
                data: JSON.stringify(data),
                dataType: "json",
                contentType: "application/json",
                success: function(response) {
                    alert("Successfully saved invoice");
                    // location.reload(true);
                },
                error: function(response) {
                    alert("Failed to save invoice");
                }
            });
        }
        else {
            formValidator.focusInvalid();
        }
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
});
