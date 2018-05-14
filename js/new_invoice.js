var INVOICE_URL = "http://127.0.0.1:80/api/v1/invoices/";
var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/?fields=id,name";
var SOURCES_URL = "http://127.0.0.1:80/api/v1/sources/?fields=id,name";
var CATEGORIES_URL = "http://127.0.0.1:80/api/v1/categories/?fields=id,name";
var SUPPLIERS_URL = "http://127.0.0.1:80/api/v1/suppliers/?fields=id,company";
var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/?hide_product=false&ordering=name_sort,description_sort,size_sort";

var mouseEnterTimer;
var sourceList = {};
var supplierList = {};
var categoryList = {};
var creditInvoice = false;
var selectedCustomer = -1;
var cashCustomerID = -1;


// Overrides the default autocomplete filter function to search only from the beginning of the string
$.ui.autocomplete.filter = function (array, term) {
    var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(term), "i");
    return $.grep(array, function (value) {
        return matcher.test(value.label || value.value || value);
    });
};


function format_number(n) {
  return parseFloat(n).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
}

function resetPage() {
    $(":input").val('');
    $("#invoice-date").datepicker('setDate', 'today');
    $("#invoice-total").text("0.000 KD");
    $(".quantity").text("0");
    $(".price").text("0.000");
    $(".product-total").text("0.000");

    creditInvoice = false;
    $("#checkbox-false").closest('label').addClass('active');
    $("#checkbox-true").closest('label').removeClass('active');

    $("#product-list-table tbody").empty();
    $("#products-table").DataTable().rows().deselect();

    selectedCustomer = -1;
    selectDefaultCustomer();

    $("#products-table").DataTable().ajax.reload( function(json) {
        $("#products-table").DataTable().search('').draw();
    });

    $("#products-search").focus();
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

    $("#invoice-total").text(format_number(total) + " KD");
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
    // Form shortcuts
    $("#form").on('keydown', function(event) {
        // Shift + 's'
        if (event.shiftKey && event.keyCode == 83) {
            event.preventDefault();
            $("#products-search").focus();
        }

        // Shift + 'd'
        if (event.shiftKey && event.keyCode == 68) {
            event.preventDefault();
            $("#invoice-date").focus();
        }
    });

    // DataTable event triggers
    $("#products-table").DataTable().on('select', function(e, dt, type, indexes) {
        var productData = $("#products-table").DataTable().rows(indexes).data()[0];
        var productString = productData.name 

        if (productData.description) {
            productString = productString + " -- " + productData.description;
        }

        if (productData.size) {
            productString = productString + " -- " + productData.size;
        }

        var closeIcon = "<td class=\"delete-button\"><button type=\"button\" class=\"close\" tabindex=\"-1\"><span>&times;</span></button></td>";
        var name = "<td><label class=\"name\">" + productString + "</td>";
        var quantity = "<td><label class=\"quantity\" tabindex=\"99\">0</label><input class=\"edit-input\"/></td>";
        var price = "<td><label class=\"price\" tabindex=\"99\">" + productData.sell_price + "</label><input class=\"edit-input\"/></td>";
        var productTotal = "<td><label class=\"product-total\" tabindex=\"99\">0.000</label><input class=\"edit-input\"/></td>";
        
        var newProduct = $("<tr>" + closeIcon + name + quantity + price + productTotal + "</tr>").appendTo("#product-list-table > tbody:last-child");

        newProduct.data("product-id", productData.id);
        newProduct.data("cost-price", productData.cost_price);

        // Scroll products list table to the bottom
        var elem = document.getElementById('scroll');
        elem.scrollTop = elem.scrollHeight;
    });

    $("#products-table").DataTable().on('deselect', function(e, dt, type, indexes) {
        var productId = $("#products-table").DataTable().rows(indexes).data()[0].id;

        // Remove product from products-list table
        $("#product-list-table tbody tr").each(function() {
            if ($(this).data("product-id") == productId) {
                $(this).remove();
                // return false is needed to break out of
                // the each loop.
                return false;
            }
        });
    });

    $("#products-table").DataTable().on('key-focus', function(e, dt, cell) {
        var row = dt.row(cell.index().row).node();
        $(row).addClass('tab-focus');
        updateProductDetails(cell.index().row);
    });

    $("#products-table").DataTable().on('key-blur', function(e, dt, cell) {
        var row = dt.row(cell.index().row).node();
        $(row).removeClass('tab-focus');
    });

    $("#products-table").DataTable().on('key', function(e, dt, key, cell, originalEvent) {
        // Enter key
        if (key == 13) {
            var row = dt.row(cell.index().row)

            if ($(row.node()).hasClass('selected')) {
                row.deselect();
            } else {
                row.select();
                dt.cell.blur();
                $("#product-list-table tr:last").find('.quantity').focus();
            }
        }
    });

    // Editable field event triggers
    $("#product-list-table tbody").on('click', '.delete-button', function(event, params) {
        var currRow = $(this).closest('tr');

        $("#products-table").DataTable().row("#" + currRow.data("product-id")).deselect();
        currRow.remove();
        updateInvoiceTotal();
    });
    
    $("#product-list-table tbody").on('focus', '.quantity, .price, .product-total', function(event, params) {
        $(this).hide();
        $(this).parent().children(".edit-input")
            .val($(this).text())
            .show()
            .focus()
            .select();
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
            var sellPrice = parseFloat(newValue).toFixed(3);
            var costPrice = parseFloat($(this).closest('tr').data('cost-price'));

            if (sellPrice < costPrice) {
                $(this).closest('td').addClass('red-text');
            } else {
                $(this).closest('td').removeClass('red-text');
            }

            updateInvoiceProductTotal($(this), 'quantity', sellPrice);
            newValue = sellPrice;
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

            var prevCell = $(this).parent().prev().children('.quantity, .price');

            // Check if prev cell contains a label. If not, implies beginning of row.
            if (validInput($(this), $(this).val())) {
                if (prevCell.length) {
                    prevCell.focus();
                } else {
                    $("#products-search").focus();
                }
            }
        } else if (event.keyCode == 9 || event.keyCode == 13) {
            event.preventDefault();

            var nextCell = $(this).parent().next();
            // Check if there is a next cell in the row. If not, implies end of row.
            if (validInput($(this), $(this).val())) {
                if (nextCell.length) {
                    nextCell.children('label').focus();
                } else {
                    $("#products-search").focus();
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

    // Checkboxes
    $("#checkbox-true").on('change', function(event, params) {
        creditInvoice = true;
    });

    $("#checkbox-false").on('change', function(event, params) {
        creditInvoice = false;
    });

    // Highlight customer text on click
    $("#customer-autocomplete").on('focus', function(event, params) {
        $(this).select();
        $("#customer-autocomplete").autocomplete('search');
    });
}

function updateProductDetails(row) {
    var product = $("#products-table").DataTable().row(row).data();

    $("#product-cost-price").val(product.cost_price).trigger("change");
    $("#product-sell-price").val(product.sell_price).trigger("change");
    $("#product-stock").val(product.stock).trigger("change");
    $("#product-supplier").val(supplierList[product.supplier]).trigger("change");
    $("#product-category").val(categoryList[product.category]).trigger("change");
    $("#product-source").val(sourceList[product.source]).trigger("change");
}

function selectDefaultCustomer() {
    $("#customer-autocomplete").val("Cash");
    selectedCustomer = cashCustomerID;
}

$(document).ready(function() {
    $("#products-table").DataTable({
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
            style: 'multi',
            items: 'row',
        },
        scroller: {
            displayBuffer: 1.1
        },
        dom: 'tS',
        rowId: "id",
        paging: true,
        pageLength: 20,
        ordering: false,
        autoWidth: true,
        deferRender: true,
        scrollY: '53vh',
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
        callback: function(value) { $("#products-table").DataTable().search("^" + this.value, true, false).draw(); },
        wait: 500,
        highlight: true,
        captureLength: 1,
    }
    $("#products-search").typeWatch(typewatch_options);

    // Populate the customers drop-down field
    $.get(CUSTOMERS_URL)
        .done(function(customers) {
            formattedCustomers = [];

            for (i in customers) {
                formattedCustomers.push({'label': customers[i].name, 'value': customers[i].id});

                if (customers[i].name == "Cash") {
                    cashCustomerID = customers[i].id;
                }
            }

            $("#customer-autocomplete").autocomplete({
                source: formattedCustomers,
                position: {collision: 'flip'},
                focus: function(event, ui) {
                    $("#customer-autocomplete").val(ui.item.label);
                    return false;
                },
                select: function(event, ui) {
                    $("#customer-autocomplete").val(ui.item.label);
                    selectedCustomer = ui.item.value;
                    return false;
                },
            });

            selectDefaultCustomer(cashCustomerID);
            $("#products-search").focus();
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
        var post = true;
        var products = [];

        // Validate if invoice is not empty
        if ($("#product-list-table tbody tr").length == 0) {
            $("#products-search").focus();
            return;
        }

        // Validate if customer has been selected
        if (selectedCustomer == -1) {
            $("#customer-autocomplete").focus();
            return;
        }

        // Validate if date has been entered
        if (!$("#invoice-date").datepicker("getDate")) {
            $("#invoice-date").focus();
            return;
        }

        // Validate if invoice total is greater than 0
        if ($("#invoice-total").text() == "0.000 KD") {
            alert("Invoice total is zero.");
            return;
        }

        $("#product-list-table tbody tr").each(function() {
            var product_info = {};

            if ($(this).find(".quantity").text() == 0 || parseFloat($(this).find(".price").text()) == 0.0) {
                alert("Product: '" + $(this).find(".name").text() + "' has zero quantity or zero sell price.");
                // Return false here only exits each loop
                post = false;
                return false;
            }

            product_info["product"] = $(this).data("product-id");
            product_info["quantity"] = $(this).find(".quantity").text();
            product_info["sell_price"] = $(this).find(".price").text();

            products.push(product_info);
        });

        if (post) {
            data["credit"] = creditInvoice;
            data["products"] = products;
            data["customer"] = selectedCustomer;
            data["date_of_sale"] = $("#invoice-date").datepicker("getDate");

            $.ajax({
                url: INVOICE_URL,
                type: "POST",
                data: JSON.stringify(data),
                dataType: "json",
                contentType: "application/json",
                success: function(response) {
                    alert("Success. New invoice ID is: " + response.id);
                    resetPage();
                },
                error: function(response) {
                    alert("Failed to save invoice. " + JSON.stringify(response));
                }
            });
        }
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

    // Setup event triggers for all fields
    setupEventTriggers();
});
