(function(window, document) {
    var STOCK_SOLD_URL = "http://127.0.0.1:80/api/v1/stock/sold/total";
    var SUPPLIERS_URL = "http://127.0.0.1:80/api/v1/suppliers/?fields=id,company";
    var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/?hide_product=false&ordering=name_sort,description_sort,size_sort";

    var MONTH_FIRST_COLUMN = 5;
    var FORECAST_LENGTH = 6;  // months
    var LAST_COLUMN = MONTH_FIRST_COLUMN + FORECAST_LENGTH;
    var CURRENT_DATE = moment();
    var DATABASE_START_DATE = moment('2018-03-18');
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
                  'November', 'December'];

    var table = null;
    var months = [];
    var showAll = false;
    var monthsCount = {};
    var supplierList = {};
    var stockHistoryList = {};

    function format_number(n) {
      return Math.round(n).toString(10).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }

    window.refreshStockForecastPage = function() {
        loadData();
    }

    function loadData() {
        $.when($.get(PRODUCTS_URL), $.get(SUPPLIERS_URL), $.get(STOCK_SOLD_URL))
            .done(function(products, suppliers, stockHistory) {
                for (i in suppliers[0]) {
                    supplierList[suppliers[0][i].id] = suppliers[0][i].company;
                }

                for (i in stockHistory[0]) {
                    month = stockHistory[0][i].month;
                    quantity = stockHistory[0][i].quantity;
                    productId = stockHistory[0][i].product;

                    if (!(productId in stockHistoryList)) {
                        stockHistoryList[productId] = {};
                    }

                    stockHistoryList[productId][month] = quantity/monthsCount[month];
                }

                var forecastData = [];
                for (i in products[0]) {
                    var inStockMonths = 0;
                    var stockLevel = products[0][i].stock;
                    var row_part1 = [products[0][i].name, products[0][i].description, products[0][i].size,
                                     supplierList[products[0][i].supplier], stockLevel];
                    var row_part2 = [];

                    for (var j = 0; j < months.length; j++) {
                        if (products[0][i].id in stockHistoryList && months[j] in stockHistoryList[products[0][i].id]) {
                            val = stockHistoryList[products[0][i].id][months[j]]
                            stockLevel -= val;
                            row_part2.push(format_number(val));
                        } else {
                            row_part2.push(0);
                        }

                        if (stockLevel > 0) {
                            inStockMonths++;
                        }
                    }
                    row_part2.push(inStockMonths);

                    forecastData.push(row_part1.concat(row_part2));
                }

                // Update column title with month names
                for (var j = 0; j < months.length; j++) {
                    $(table.column(MONTH_FIRST_COLUMN + j).header()).text(MONTHS[months[j] - 1]);
                }

                table.clear();
                table.rows.add(forecastData);
                table.draw();
            });
    }

    function setupEventTriggers() {
        // Show all checkbox
        $("#stock-forecast-show-all-checkbox").on('ifChecked', function() {
            showAll = true;
            table.draw();
        });

        $("#stock-forecast-show-all-checkbox").on('ifUnchecked', function() {
            showAll = false;
            table.draw();
        });
    }

    $(document).ready(function() {
        // Calculate the next 6 months
        var iterateDate = CURRENT_DATE.clone();
        var endDate = CURRENT_DATE.add(FORECAST_LENGTH - 1, 'month');
        while (endDate > iterateDate || iterateDate.format('M') === endDate.format('M')) {
            months.push(iterateDate.month() + 1);
            iterateDate.add(1, 'month');
        }

        // Initialize monthsCount with the repeated count for each month between first database invoice entry
        // till todays date
        iterateDate = DATABASE_START_DATE.clone();
        while (CURRENT_DATE > iterateDate || iterateDate.format('M') === CURRENT_DATE.format('M')) {
            month = iterateDate.month() + 1;  // Adding one as jan is zero
            if (month in monthsCount) {
                monthsCount[month]++;
            } else {
                monthsCount[month] = 1;
            }
            iterateDate.add(1, 'month');
        }

        // Setup datatable
        table = $("#stock-forecast-table").DataTable({
            columns: [
                {title: 'Name', orderable: false, width: "10%"},
                {
                    title: 'Description',
                    render: function(data, type, row) {
                        return data.length > 25 ? data.substr(0, 25) + '...' : data;
                    },
                    orderable: false,
                    width: "10%",
                },
                {title: 'Size', orderable: false, width: "10%"},
                {
                    title: 'Supplier',
                    render: function(data, type, row) {
                        return data.length > 25 ? data.substr(0, 25) + '...' : data;
                    },
                    orderable: false,
                    width: "13%",
                },
                {
                    title: 'Stock',
                    orderable: false,
                    width: "7%",
                    className: "yellow-background",
                },
                {title: '', orderable: false},
                {title: '', orderable: false},
                {title: '', orderable: false},
                {title: '', orderable: false},
                {title: '', orderable: false},
                {title: '', orderable: false},
                {visible: false},
            ],
            rowCallback: function(row, data, index) {
                var inStockMonths = data[LAST_COLUMN];  // last column

                if (!showAll && data[4] <= 0) {  // current stock column
                    $(row).hide();
                    return;
                } else {
                    $(row).show();
                }

                for (var i = 0; i < FORECAST_LENGTH; i++) {
                    var col = MONTH_FIRST_COLUMN + i;
                    if (i < inStockMonths) {
                        $("td:eq(" + col + ")", row).addClass("available-month");
                    } else {
                        $("td:eq(" + col + ")", row).addClass("unavailable-month");
                    }
                }
            },
            order: [[LAST_COLUMN, 'asc'],],
            select: {
                style: 'api',
            },
            dom: 't',
            paging: false,
            scrollY: '75vh',
            scrollCollapse: true,
            autoWidth: true,
        });

        // Override the default smart search
        var typewatch_options = {
            callback: function(value) { table.search("^" + this.value, true, false).draw(); },
            wait: 500,
            highlight: true,
            captureLength: 1,
        }
        $("#stock-forecast-products-search").typeWatch(typewatch_options);

        // Checkbox
        $(".checkbox").iCheck({
            checkboxClass: "icheckbox_square-red",
            radioClass: "iradio_square-red",
        });

        setupEventTriggers();
        loadData();
    });
})(window, document);

//# sourceURL=stock_forecast.js
