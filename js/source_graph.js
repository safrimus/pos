var SOURCES_URL = "http://127.0.0.1:80/api/v1/sources/";
var SALES_SOURCE_URL = "http://127.0.0.1:80/api/v1/sales/source/";

var YEAR = 2018
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

var sourceList = {};
var salesValuesPerMonth = {};


function addValuetoSalesValuesPerMonth(index, value) {
    if (salesValuesPerMonth[index]) {
        salesValuesPerMonth[index].push(value);
    } else {
        salesValuesPerMonth[index] = [value];
    }
}

function monthIsNull(month) {
    var flag = true;

    for (i = 0; i < salesValuesPerMonth[month].length; i++) {
        if (salesValuesPerMonth[month][i] != null)
        {
            flag = false;
            break;
        }
    }

    return flag;
}

function populateChartData(sales) {
    var labels = [];
    var dataset = [];
    var tempDict = {};

    for (i in sales) {
        if (!(sales[i].source in tempDict))
        {
            tempDict[sales[i].source] = {};
            tempDict[sales[i].source] = {};

            tempDict[sales[i].source]["sales"] = {};
            tempDict[sales[i].source]["profit"] = {};
        }

        tempDict[sales[i].source]["sales"][sales[i].month] = sales[i].sales;
        tempDict[sales[i].source]["profit"][sales[i].month] = sales[i].profit;
    }

    for (source in tempDict) {
        var salesData = [];
        var marginData = [];
        var profitData = [];

        for (var i = 1; i <= 12; i++) {
            if (i in tempDict[source]["sales"]) {
                salesData.push(tempDict[source]["sales"][i]);
                profitData.push(tempDict[source]["profit"][i]);
                marginData.push((tempDict[source]["profit"][i] / tempDict[source]["sales"][i]) * 100);

                addValuetoSalesValuesPerMonth(i, tempDict[source]["sales"][i]);
            } else {
                salesData.push(0);
                profitData.push(0);
                marginData.push(0);

                addValuetoSalesValuesPerMonth(i, null);
            }
        }

        var salesDict = {
            label: sourceList[source],
            stack: sourceList[source],
            backgroundColor: 'lightblue',
            borderColor: 'lightblue',
            yAxisID: 'yAxis1',
            data: salesData,
            datalabels: {
                align: 'start',
                anchor: 'start',
                rotation: 90,
            },
            // Keys below are not used by chartjs
            customData: "sales",
            hiddenCounter: 0,
        };

        var profitDict = {
            label: sourceList[source],
            stack: sourceList[source],
            backgroundColor: 'red',
            borderColor: 'red',
            yAxisID: 'yAxis1',
            data: profitData,
            datalabels: {
                align: 'start',
                anchor: 'start',
                rotation: 90,
            },
            // Keys below are not used by chartjs
            customData: "profit",
            hiddenCounter: 0,
        };

        var marginDict = {
            label: sourceList[source],
            stack: sourceList[source],
            pointBackgroundColor: 'grey',
            borderColor: 'lightgrey',
            yAxisID: 'yAxis2',
            data: marginData,
            type: 'line',
            fill: false,
            hidden: true,
            datalabels: {
                align: 'right',
                anchor: 'end',
                display: function(context) {
                    return (context.dataIndex == (context.chart.data.labels.length - 1));
                },
            },
            // Keys below are not used by chartjs
            customData: "margin",
            hiddenCounter: 1,
        };

        dataset.push(marginDict);
        dataset.push(profitDict);
        dataset.push(salesDict);
    }

    // Add labels to enable grouping by month. Don't display trailing months that have zero
    // sales in all sources.
    var nonEmptyMonthSeen = false;
    for (var i = 12; i >= 1; i--) {
        if (!monthIsNull(i) || nonEmptyMonthSeen) {
            labels.unshift(MONTHS[i - 1]);
        }

        if (!monthIsNull(i))
        {
            nonEmptyMonthSeen = true;
        }
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
    var myLegendContainer = document.getElementById("chart-legends");

    // generate HTML legend
    myLegendContainer.innerHTML = chart.generateLegend();

    // bind onClick event to all LI-tags of the legend
    var legendItems = myLegendContainer.getElementsByTagName('li');
    for (var i = 0; i < legendItems.length; i += 1) {
        legendItems[i].addEventListener("click", legendClickCallback, false);
        legendItems[i].chartID = chart.id;
    }
}

$(document).ready(function() {
    $.get(SOURCES_URL)
        .done (function(source) {
            for (i in source) {
                sourceList[source[i].id] = source[i].name;
            }
        })
        .fail(function() {
            console.log("Failed to get source.");
        });

    $.get(SALES_SOURCE_URL + "?year=" + YEAR)
        .done (function(sales) {
            // Data
            chartData = populateChartData(sales);

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

                        // Legend for all sources
                        text.push('<ul class="custom-legend list-inline">');
                        for (i in sourceList) {
                            text.push('<li class="list-inline-item btn btn-sm btn-warning">' + sourceList[i] + '</li>');
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

                                if (currentHiddenCounter == 0) {
                                    chart.data.datasets[i].hidden = false;
                                } else {
                                    chart.data.datasets[i].hidden = true;
                                }
                            }
                        }

                        // We hid dataset(s) ... rerender the chart
                        chart.update();
                    },
                },
                title: {
                    display: true,
                    text: "Source Data per Month for " + YEAR,
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
                        sourcePercentage: 0.90,
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
            var chart = new Chart($("#sales-source"), {
                type: 'bar',
                data: data,
                options: options,
            });

            generateCustomLegend(chart);
        })
    .fail(function() {
        console.log("Failed to get sales data.");
    });
});
