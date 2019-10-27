(function(window, document) {
    var SOURCES_URL = "http://127.0.0.1:80/api/v1/sources/";
    var CATEGORIES_URL = "http://127.0.0.1:80/api/v1/categories/";
    var SALES_URL = "http://127.0.0.1:80/api/v1/sales/category_source/?group_by=month,year,requested_type";

    var CURRENT_DATE = moment();
    var CURRENT_MONTH = CURRENT_DATE.month() + 1;  // Adding one as jan is zero
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var chart = null;
    var canvas = null;
    var dataURL = null;
    var salesURL = null;
    var urlFilter = null;
    var requestedTypeList = {};
    var myLegendContainer = null;


    function dynamicColours() {
        var r = Math.floor(Math.random() * 150);
        var g = Math.floor(Math.random() * 150);
        var b = Math.floor(Math.random() * 150);

        return "rgb(" + r + "," + g + "," + b + ")";
    }

    function decideHidden(counter) {
        return counter == 0 ? false : true;
    }

    function populateChartData(sales, firstLoad=false) {
        var labels = [];
        var dataset = [];
        var dataDict = {};
        var hiddenDict = {};

        // Take sales data and format it for processing
        for (i in sales) {
            // Seeing this requested_type (category or source) for the first time
            if (!(sales[i].requested_type in dataDict))
            {
                dataDict[sales[i].requested_type] = {};
                dataDict[sales[i].requested_type]["sales"] = {};
                dataDict[sales[i].requested_type]["profit"] = {};
            }

            dataDict[sales[i].requested_type]["sales"][sales[i].month] = sales[i].sales;
            dataDict[sales[i].requested_type]["profit"][sales[i].month] = sales[i].profit;
        }

        // Store default or current value of hidden field/counter and border colour for all datasets if not firstLoad
        if (!firstLoad) {
            for (i in chart.data.datasets) {
                var data = chart.data.datasets[i];

                if (!(data.label in hiddenDict)) {
                    hiddenDict[data.label] = {};
                }

                hiddenDict[data.label][data.customData] = [decideHidden(data.hiddenCounter), data.hiddenCounter, data.borderColor];
            }
        }

        for (requestedType in dataDict) {
            var salesData = [];
            var marginData = [];
            var profitData = [];

            var month;
            var currentMonth = CURRENT_MONTH
            for (var i = 0; i <= 11; i++) {
                if (currentMonth - i < 1) {
                    currentMonth = i + 12;
                }

                month = currentMonth - i;

                if (month in dataDict[requestedType]["sales"]) {
                    salesData.unshift(dataDict[requestedType]["sales"][month]);
                    profitData.unshift(dataDict[requestedType]["profit"][month]);
                    marginData.unshift((dataDict[requestedType]["profit"][month] / dataDict[requestedType]["sales"][month]) * 100);
                } else {
                    salesData.unshift(null);
                    profitData.unshift(null);
                    marginData.unshift(null);
                }
            }

            var salesDict = {
                label: requestedTypeList[requestedType],
                stack: requestedTypeList[requestedType],
                backgroundColor: 'lightblue',
                borderColor: 'lightblue',
                yAxisID: 'yAxis1',
                data: salesData,
                datalabels: {
                    align: 'start',
                    anchor: 'start',
                    rotation: 90,
                    font: {
                        style: 'bold',
                    },
                },
                hidden: firstLoad ? false : hiddenDict[requestedTypeList[requestedType]]["sales"][0],
                // Keys below are not used by chartjs
                customData: "sales",
                hiddenCounter: firstLoad ? 0 : hiddenDict[requestedTypeList[requestedType]]["sales"][1],
            };

            var profitDict = {
                label: requestedTypeList[requestedType],
                stack: requestedTypeList[requestedType],
                backgroundColor: 'red',
                borderColor: 'red',
                yAxisID: 'yAxis1',
                data: profitData,
                datalabels: {
                    align: 'start',
                    anchor: 'start',
                    rotation: 90,
                    font: {
                        style: 'bold',
                    },
                },
                hidden: firstLoad ? false : hiddenDict[requestedTypeList[requestedType]]["profit"][0],
                // Keys below are not used by chartjs
                customData: "profit",
                hiddenCounter: firstLoad ? 0 : hiddenDict[requestedTypeList[requestedType]]["profit"][1],
            };

            var marginDict = {
                label: requestedTypeList[requestedType],
                stack: requestedTypeList[requestedType],
                pointBackgroundColor: 'grey',
                borderColor: firstLoad ? dynamicColours() : hiddenDict[requestedTypeList[requestedType]]["margin"][2],
                yAxisID: 'yAxis2',
                data: marginData,
                type: 'line',
                fill: false,
                spanGaps: true,
                datalabels: {
                    align: 'right',
                    anchor: 'end',
                    display: function(context) {
                        return (context.dataIndex == (context.chart.data.labels.length - 1));
                    },
                },
                hidden: firstLoad ? true : hiddenDict[requestedTypeList[requestedType]]["margin"][0],
                // Keys below are not used by chartjs
                customData: "margin",
                hiddenCounter: firstLoad ? 1 : hiddenDict[requestedTypeList[requestedType]]["margin"][1],
            };

            dataset.push(marginDict);
            dataset.push(profitDict);
            dataset.push(salesDict);
        }

        // Add labels to enable grouping by month.
        var month;
        var currentMonth = CURRENT_MONTH;
        var currentYear = parseInt(CURRENT_DATE.format("YY"));  // Get last two digits of year
        for (var i = 0; i <= 11; i++) {
            if (currentMonth - i < 1) {
                currentMonth = i + 12;
                currentYear--;
            }

            month = currentMonth - i;

            labels.unshift(MONTHS[month - 1] + ' ' + currentYear);
        }

        return {'dataset': dataset, 'labels': labels};
    }

    function legendClickCallback(event) {
        event = event || window.event;

        var target = event.currentTarget;
        var chart = Chart.instances[target.chartID];

        $(target).toggleClass('disable');

        chart.legend.options.onClick.call(chart, event, $(target).text(), $(target).hasClass('disable'));
    }

    function generateCustomLegend(chart) {
        // generate HTML legend
        myLegendContainer.innerHTML = chart.generateLegend();

        // bind onClick event to all LI-tags of the legend
        var legendItems = myLegendContainer.getElementsByTagName('li');
        for (var i = 0; i < legendItems.length; i += 1) {
            legendItems[i].addEventListener("click", legendClickCallback, false);
            legendItems[i].chartID = chart.id;
        }
    }

    function loadChart(firstLoad=false) {
        // Get graph type and create year filter
        $.get(dataURL)
            .done(function(data) {
                for (i in data) {
                    requestedTypeList[data[i].id] = data[i].name;
                }
            })
            .fail(function() {
                console.log("Failed to get data.");
            });

        $.get(salesURL + urlFilter)
            .done(function(sales) {
                // Data
                chartData = populateChartData(sales, firstLoad);

                var data = {
                    labels: chartData.labels,
                    datasets: chartData.dataset,
                };

                // Options
                var options = {
                    responsive: true,
                    animation: false,
                    legendCallback: function(chart) {
                            var text = [];

                            // Legend for all categories
                            text.push('<ul class="custom-legend list-inline">');
                            for (i in requestedTypeList) {
                                text.push('<li class="list-inline-item btn btn-sm btn-warning">' + requestedTypeList[i] + '</li>');
                            }
                            text.push('</ul>');

                            // Legend for sales, profit and margin data
                            text.push('<ul class="custom-legend list-inline">');
                            text.push('<li class="list-inline-item btn btn-sm btn-info">Sales</li>');
                            text.push('<li class="list-inline-item btn btn-sm btn-danger">Profit</li>');
                            text.push('<li class="list-inline-item btn btn-sm btn-secondary disable">Margin</li>');
                            text.push('</ul>');

                            return text.join('');
                        },
                    legend: {
                        display: false,
                        onClick: function(e, filter, hide) {
                            var chart = this.chart;

                            for (i in chart.data.datasets) {
                                if (chart.data.datasets[i].label.toLowerCase() == filter.toLowerCase() ||
                                    chart.data.datasets[i].customData.toLowerCase() == filter.toLowerCase()) {

                                    var currentHiddenCounter = chart.data.datasets[i].hiddenCounter;
                                    chart.data.datasets[i].hiddenCounter = hide ? ++currentHiddenCounter : --currentHiddenCounter;
                                    chart.data.datasets[i].hidden = decideHidden(currentHiddenCounter);
                                }
                            }

                            // We hid dataset(s) ... rerender the chart
                            chart.update();
                        },
                    },
                    plugins: {
                        datalabels: {
                            formatter: function(value, context) {
                                return context.dataset.label;
                            },
                        }
                    },
                    scales:{
                        xAxes: [{
                            stacked: true,
                            categoryPercentage: 0.90,
                            gridLines: {
                                tickMarkLength: 135,
                            },
                            ticks: {
                                fontStyle: "bold",
                            },
                        }],
                        yAxes: [
                        {
                            id: 'yAxis1',
                            position: 'left',
                            stacked: false,
                            scaleLabel: {
                                display: true,
                                labelString: "KWD",
                                fontStyle: "bold",
                            },
                            ticks: {
                                beginAtZero: true,
                            },
                        },
                        {
                            id: 'yAxis2',
                            position: 'right',
                            stacked: false,
                            gridLines: {
                                display: false,
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "Margin Percentage",
                                fontStyle: "bold",
                            },
                            ticks: {
                                beginAtZero: true,
                            },
                        }],
                    },
                };

                // Chart
                if (firstLoad) {
                    chart = new Chart(canvas, {
                        type: 'bar',
                        data: data,
                        options: options,
                    });

                    generateCustomLegend(chart);
                } else {
                    chart.data = data;
                    chart.update();
                }
            })
            .fail(function() {
                console.log("Failed to get sales data.");
            });
    }

    $(document).ready(function() {
        if ($("#active-form").prop("graph") == "category") {
            dataURL = CATEGORIES_URL;
            salesURL = SALES_URL + "&type=category";

            canvas = $("#sales-category");
            myLegendContainer = document.getElementById("category-sales-chart-legends");

            window.refreshCategoryGraphPage = function() {
                loadChart();
            }
        } else {
            dataURL = SOURCES_URL;
            salesURL = SALES_URL + "&type=source";

            canvas = $("#sales-source");
            myLegendContainer = document.getElementById("source-sales-chart-legends");

            window.refreshSourceGraphPage = function() {
                loadChart();
            }
        }

        var momentDate = moment()
        var endDate = momentDate.endOf('month').format("YYYY-MM-DD") + "+23:59:59";
        var startDate = momentDate.subtract(11, 'months').startOf('month').format("YYYY-MM-DD") + "+00:00:00";
        urlFilter = "&date_start=" + startDate + "&date_end=" + endDate;

        loadChart(firstLoad=true);
    });
})(window, document);

//# sourceURL=category_source_graph.js 
