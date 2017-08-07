var INVOICE_URL = "http://127.0.0.1:80/api/v1/invoices/"
var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/"
var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/"
var selectedProduct = -1;
var selectedCustomer = -1;
var creditInvoice = false;

function clearProduct() {
    $("#product-automplete").val("").trigger("change");
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
        currElem.closest('tr').find('.product-total').editable('setValue', total);

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
        currElem.closest('tr').find('.price').editable('setValue', price);
    }
}

function updateInvoiceTotal() {
    var total = 0;

    $("#product-list-table").find(".product-total").each(function () {
        total += parseFloat($(this).text());
    });

    $("#invoice-total").text(total.toFixed(3) + " KD");
}

$(document).ready(function() {
    // Setup validation
    $('form').validate({
        
    });

    // Populate the products drop-down field
    $.get(PRODUCTS_URL)
        .done(function(products) {
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
                        enabled: true
                    },
                    maxNumberOfElements: 10,
                    sort: {
                        enabled: true
                    },

                    onSelectItemEvent: function() {
                        var product = $("#product-automplete").getSelectedItemData()

                        selectedProduct = product;

                        $("#product-id").val(product.id).trigger("change");
                        $("#product-description").val(product.description).trigger("change");
                        $("#product-size").val(product.size).trigger("change");
                        $("#product-cost-price").val(product.cost_price).trigger("change");
                        $("#product-sell-price").val(product.sell_price).trigger("change");
                        $("#product-supplier").val(product.supplier).trigger("change");
                        $("#product-stock").val(product.stock).trigger("change");
                    },

                    onHideListEvent: function() {
                        if ($("#product-automplete").val() == "") {
                            clearProduct();
                        }
                    },
                }
            };
            $("#product-automplete").easyAutocomplete(options);
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
                    maxNumberOfElements: 10,
                    sort: {
                        enabled: true
                    },

                    onSelectItemEvent: function() {
                        var customer = $("#customer-automplete").getSelectedItemData();
                        selectedCustomer = customer;
                    },
                }
            };
            $("#customer-automplete").easyAutocomplete(options);
            console.log("Loaded Customers");
        })
        .fail(function() {
            console.log("Failed to get customers.");
        });

    // Select product button
    $("#select-product-button").click(function() {
        if (selectedProduct != -1) {
            var closeIcon = "<td class=\"delete-button\"><span class=\"glyphicon glyphicon-remove\"></span></td>";
            var name = "<td> " + selectedProduct.name + "</td>";
            var quantity = "<td class=\"editable quantity\"></td>";
            var price = "<td class=\"editable price\"></td>";
            var productTotal = "<td class=\"editable product-total\"></td>";

            var newProduct = $("<tr class=\"highlight\">" + closeIcon + name + quantity + price + productTotal + "</tr>").appendTo("#product-list-table > tbody:last-child");

            // Attach product id to newProduct
            newProduct.data("product-id", selectedProduct.id);

            // Update the invoice total
            var total = newProduct.find(".price").text() * newProduct.find(".quantity").text()
            newProduct.find(".product-total").text(total);

            clearProduct();

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
        }
    });

    // Finalize invoice button
    $("#finalize-invoice-button").click(function() {
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