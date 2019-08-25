(function(window, document) {
	var SALES_URL = "http://127.0.0.1:80/api/v1/sales/products/";
    var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/?fields=id,name";
    var SUPPLIERS_URL = "http://127.0.0.1:80/api/v1/suppliers/?fields=id,company";
    var PRODUCTS_URL = "http://127.0.0.1:80/api/v1/products/?ordering=name_sort,description_sort,size_sort";

    var chart = null;
    var firstLoad = true;
    var supplierList = {};
    var customerList  = {};
    var dateFilterBy = "dates"
	var productsTable = null;
    var customersTable = null;
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    window.refreshProductSalesReportPage = function() {
        loadInitialData();
        productsTable.ajax.reload();
    }

    function format_number(n) {
        return parseFloat(n).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }

    function format_percentage(n) {
        return parseFloat(n).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,") + "%";
    }

    function format_stock(n) {
        return n.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    }

    function daysInMonth(month) {
        now = new Date();
        return new Date(now.getFullYear(), month, 0).getDate();
    }

    function loadInitialData() {
        $.get(CUSTOMERS_URL)
            .done (function(customers) {
                for (i in customers) {
                    customerList[customers[i].id] = customers[i].name;
                }
            })
            .fail(function() {
                console.log("Failed to get customers.");
            });

        $.get(SUPPLIERS_URL)
            .done (function(suppliers) {
                for (i in suppliers) {
                    supplierList[suppliers[i].id] = suppliers[i].company;
                }
            })
            .fail(function() {
                console.log("Failed to get suppliers.");
            });

        currentDate = new Date();
        $("#product-sales-report-by-year-input").val(currentDate.getFullYear());
        $("#product-sales-report-by-month-input-year").val(currentDate.getFullYear());
        $("#product-sales-report-by-month-input-month").val(currentDate.getMonth() + 1);
    }

    function clearGraphPlot() {
        if (chart) {
            chart.data.datasets[0].data = [];
            chart.data.datasets[1].data = [];
            chart.data.datasets[2].data = [];
            chart.update();
        }
    }

    function populateChartData(sales) {
        var salesData = []
        var profitData = []
        var unitsData = []
        var labels = []
        var salesDict = {}
        var profitsDict = {}
        var unitsDict = {}

        if (dateFilterBy == "year") {
            for (i in sales) {
                salesDict[sales[i].month] = sales[i].sales;
                profitsDict[sales[i].month] = sales[i].profit;
                unitsDict[sales[i].month] = sales[i].units;
            }

            for (var month = 1; month <= 12; month++) {
                if (month in salesDict) {
                    salesData.push(salesDict[month]);
                    profitData.push(profitsDict[month]);
                    unitsData.push(unitsDict[month]);
                } else {
                    salesData.push(null);
                    profitData.push(null);
                    unitsData.push(null);
                }

                labels.push(MONTHS[month - 1]);
            }
        } else if (dateFilterBy == "month") {
            for (i in sales) {
                salesDict[sales[i].day] = sales[i].sales;
                profitsDict[sales[i].day] = sales[i].profit;
                unitsDict[sales[i].day] = sales[i].units;
            }

            month = $("#product-sales-report-by-month-input-month").val();
            for (var day = 1; day <= daysInMonth(month); day++) {
                if (day in salesDict) {
                    salesData.push(salesDict[day]);
                    profitData.push(profitsDict[day]);
                    unitsData.push(unitsDict[day]);
                } else {
                    salesData.push(null);
                    profitData.push(null);
                    unitsData.push(null);
                }

                labels.push(day);
            }
        }

        return {'sales': salesData, 'profit': profitData, 'unitsSold': unitsData, 'labels': labels};
    }

    function loadGraph(baseURL) {
        if (dateFilterBy == "year") {
            groupBy = "group_by=month";
        } else if (dateFilterBy == "month") {
            groupBy = "group_by=day";
        } else {  // custom dates
            clearGraphPlot();
            return;
        }

        $.get(baseURL + "&" + groupBy)
            .done (function(sales) {
                // Data
                chartData = populateChartData(sales);

                var data = {
                    labels: chartData.labels,
                    datasets: [
                        {
                            label: "Total Sales",
                            backgroundColor: 'lightblue',
                            borderColor: 'lightblue',
                            yAxisID: 'yAxis1',
                            data: chartData.sales,
                            fill: false,
                            lineTension: 0,
                            spanGaps: true,
                            type: 'line',
                        },
                        {
                            label: "Total Profit",
                            backgroundColor: 'red',
                            borderColor: 'red',
                            yAxisID: 'yAxis1',
                            data: chartData.profit,
                            fill: false,
                            lineTension: 0,
                            spanGaps: true,
                            type: 'line',
                        },
                        {
                            label: "Units Sold",
                            yAxisID: 'yAxis2',
                            backgroundColor: 'darkgrey',
                            borderColor: 'darkgrey',
                            data: chartData.unitsSold,
                        }
                    ],
                };

                // Options
                var options = {
                    responsive: true,
                    animation: false,
                    title: {
                        display: false,
                    },
                    legend: {
                        display: false,
                    },
                    plugins: {
                        datalabels: {
                            display: false,
                        }
                    },
                    scales:{
                        xAxes:[
                        {
                            id: 'xAxis1',
                            ticks: {
                                fontStyle: "bold",
                            },

                        }],
                        yAxes: [
                        {
                            id: 'yAxis1',
                            position: 'left',
                            scaleLabel: {
                                display: true,
                                labelString: "KWD",
                                fontStyle: "bold",
                            },
                            ticks: {
                                beginAtZero: true,
                                fontStyle: "bold",
                            },
                        },
                        {
                            id: 'yAxis2',
                            position: 'right',
                            gridLines: {
                                display: false,
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "Units Sold",
                                fontStyle: "bold",
                            },
                            ticks: {
                                beginAtZero: true,
                                fontStyle: "bold",
                            },
                        }],
                    },
                };

                // Chart
                if (firstLoad) {
                    chart = new Chart($("#product-sales-report-graph"), {
                        type: 'bar',
                        data: data,
                        options: options,
                    });
                    firstLoad = false;
                } else {
                    chart.data = data;
                    chart.update();
                }
            })
            .fail(function() {
                console.log("Failed to get sales data for graph.");
            });
    }

    function setupEventTriggers() {
        // Select invoice
        productsTable.on('select deselect', function(e, dt, type, indexes) {
            baseURL = ""
            products = []

            // Get product IDs of all selected products
            productsTable.rows('.selected').data().each(function (value, index) {
                products.push(value.id);
            });

            if (products.length == 0) {
                return;
            }

            // Construct filter url
            if (dateFilterBy == "month") {
                month = $("#product-sales-report-by-month-input-month").val();
                year = $("#product-sales-report-by-month-input-year").val();

                if (!month || !year) {
                    return;
                }

                filterURL = "month=" + month + "&year=" + year;
            } else if (dateFilterBy == "year") {
                filterURL = "year=" + $("#product-sales-report-by-year-input").val();
            } else {  // filter by custom dates
                startDate = $("#product-sales-report-by-date-input").data('daterangepicker')
                                                                    .startDate.format("YYYY-MM-DD") + "+00:00:00";
                endDate = $("#product-sales-report-by-date-input").data('daterangepicker')
                                                                  .endDate.format("YYYY-MM-DD") + "+23:59:59";
                filterURL = "date_start=" + startDate + "&date_end=" + endDate;
            }

            // Construct base url
            baseURL = SALES_URL + "?id=" + products.toString() + "&" + filterURL;

            // Triggger graph update
            loadGraph(baseURL)

            // Update total stats
            $.get(baseURL + "&group_by=product")
                .done(function(sales) {
                    totalSales = 0.0;
                    totalProfit = 0.0;
                    totalUnits = 0;

                    for (i in sales) {
                        totalSales += parseFloat(sales[i].sales);
                        totalProfit += parseFloat(sales[i].profit);
                        totalUnits += parseFloat(sales[i].units);
                    }

                    $("#product-sales-report-total-sales").val(format_number(totalSales)).trigger("change");
                    $("#product-sales-report-total-profit").val(format_number(totalProfit)).trigger("change");
                    $("#product-sales-report-total-units").val(format_stock(totalUnits)).trigger("change");

                    margin = (totalSales > 0.0) ? format_percentage((totalProfit / totalSales) * 100) : "0.0%";
                    $("#product-sales-report-profit-margin").val(margin).trigger("change");
                })
                .fail(function() {
                    console.log("Failed to get sales data per product.");
                });

            // Update per customer stats
            url = baseURL + "&group_by=customer";
            $.get(url)
                .done(function(sales) {
                    for (i in sales) {
                        sales[i].customer = customerList[sales[i].customer];
                        sales[i].margin = (sales[i].sales > 0.0) ?
                                            format_percentage((sales[i].profit / sales[i].sales) * 100) : "0.0%";
                        sales[i].sales = format_number(sales[i].sales);
                        sales[i].profit = format_number(sales[i].profit);
                        sales[i].units = format_stock(sales[i].units)
                    }

                    customersTable.clear().draw();
                    customersTable.rows.add(sales);
                    customersTable.columns.adjust().draw();
                })
                .fail(function() {
                    console.log("Failed to get sales data per customer.");
                });
        });

        // Date search change
        $("#product-sales-report-by-month-input-month,\
           #product-sales-report-by-month-input-year,\
           #product-sales-report-by-year-input").on('change', function(event, params) {
            productsTable.row(productsTable.rows('.selected')[0]).select();
        });

        // Date checkboxes
        $("#product-sales-report-by-month-btn").on('change', function(event, params) {
            $("#product-sales-report-by-month").removeClass("hide");
            $("#product-sales-report-by-date").addClass("hide");
            $("#product-sales-report-by-year").addClass("hide");

            dateFilterBy = "month";
            productsTable.row(productsTable.rows('.selected')[0]).select();
            $("#product-sales-report-by-month-input-month").focus();
        });

        $("#product-sales-report-by-year-btn").on('change', function(event, params) {
            $("#product-sales-report-by-month").addClass("hide");
            $("#product-sales-report-by-date").addClass("hide");
            $("#product-sales-report-by-year").removeClass("hide");

            dateFilterBy = "year";
            productsTable.row(productsTable.rows('.selected')[0]).select();
            $("#product-sales-report-by-year-input").focus();
        });

        $("#product-sales-report-by-date-btn").on('change', function(event, params) {
            $("#product-sales-report-by-month").addClass("hide");
            $("#product-sales-report-by-date").removeClass("hide");
            $("#product-sales-report-by-year").addClass("hide");

            dateFilterBy = "day";
            productsTable.row(productsTable.rows('.selected')[0]).select();
        });

        // Daterangepicker date selection change
        $("#product-sales-report-by-date-input").on('apply.daterangepicker', function(event, picker) {
            productsTable.row(productsTable.rows('.selected')[0]).select();
        });
    }

	$(document).ready(function() {
        loadInitialData();

        // Customers table
        customersTable = $("#product-sales-report-customer-table").DataTable({
            columns: [
                {data: 'customer', type: 'natural-ci'},
                {data: 'sales', type: 'num-fmt'},
                {data: 'profit', type: 'num-fmt'},
                {data: 'margin', type: 'num-fmt'},
                {data: 'units', type: 'num-fmt'},
            ],
            order: [[1, 'desc']],
            select: {
                style: 'api',
            },
            dom: 't',
            scroller: true,
            autoWidth: true,
            scrollY: '20vh',
            scrollCollapse: true,
        });

        // Setup products table
        productsTable = $("#product-sales-report-products-table").DataTable({
            ajax: {
                url: PRODUCTS_URL,
                dataSrc: '',
            },
            columns: [
                {data: 'name', searchable: true},
                {data: 'description', searchable: false},
                {data: 'size', searchable: false},
                {
                    data: 'supplier',
                    searchable: false,
                    render: function(data, type, row) {
                        return supplierList[data];
                    },
                },
            ],
            select: {
                style: 'multi',
                items: 'row',
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
            scrollY: '54vh',
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
        $("#product-sales-report-products-search").typeWatch(typewatch_options);

        // Search date range
        $("#product-sales-report-by-date-input").daterangepicker({
            showDropdowns: true,
            drops: 'up',
            ranges: {
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
        });

        setupEventTriggers();
	});

})(window, document);

//# sourceURL=product_sales_report.js
