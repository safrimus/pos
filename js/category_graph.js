var CATEGORIES_URL = "http://127.0.0.1:80/api/v1/categories/";
var SALES_CATEGORY_URL = "http://127.0.0.1:80/api/v1/sales/category/";

var YEAR = 2018
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

var categoryList = {};
var salesValuesPerMonth = {};


function monthNumberToName(number) {
    return MONTHS[number - 1];
}

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
        if (!(sales[i].category in tempDict))
        {
            tempDict[sales[i].category] = {};
            tempDict[sales[i].category] = {};

            tempDict[sales[i].category]["sales"] = {};
            tempDict[sales[i].category]["profit"] = {};
        }

        tempDict[sales[i].category]["sales"][sales[i].month] = sales[i].sales;
        tempDict[sales[i].category]["profit"][sales[i].month] = sales[i].profit;
    }

    for (category in tempDict) {
        var salesData = [];
        var profitData = [];

        for (var i = 1; i <= 12; i++) {
            if (i in tempDict[category]["sales"]) {
                salesData.push(tempDict[category]["sales"][i]);
                profitData.push(tempDict[category]["profit"][i]);

                addValuetoSalesValuesPerMonth(i, tempDict[category]["sales"][i]);
            } else {
                salesData.push(null);
                profitData.push(null);

                addValuetoSalesValuesPerMonth(i, null);
            }
        }

        var salesDict = {
            label: categoryList[category],
            stack: categoryList[category],
            backgroundColor: 'lightblue',
            borderColor: 'lightblue',
            xAxisID: 'xAxis1',
            data: salesData,
            datalabels: {
                align: 'end',
                anchor: 'end',
                rotation: 90,
            },
        };

        var profitDict = {
            label: categoryList[category],
            stack: categoryList[category],
            backgroundColor: 'red',
            borderColor: 'red',
            xAxisID: 'xAxis1',
            data: profitData,
            datalabels: {
                display: false,
            },
        };

        dataset.push(profitDict);
        dataset.push(salesDict);
    }

    // Add labels to enable grouping by month. Don't display trailing months that have zero
    // sales in all categories. Trailing here means any month after the first month with non-zero
    // sales.
    var nonEmptyMonthSeen = false;
    for (var i = 1; i <= 12; i++) {
        if (!monthIsNull(i) || !nonEmptyMonthSeen) {
            labels.push(monthNumberToName(i) + ';' + YEAR);
        }

        if (!monthIsNull(i))
        {
            nonEmptyMonthSeen = true;
        }
    }

    return {'dataset': dataset, 'labels': labels};
}

$(document).ready(function() {
    $.get(CATEGORIES_URL)
        .done (function(categories) {
            for (i in categories) {
                categoryList[categories[i].id] = categories[i].name;
            }
        })
        .fail(function() {
            console.log("Failed to get categories.");
        });

    $.get(SALES_CATEGORY_URL + "?year=" + YEAR)
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
                legend: false,
                title: {
                    display: true,
                    text: "Category Sales & Profit per Month for " + YEAR,
                },
                plugins: {
                    datalabels: {
                        formatter: function(value, context) {
                            return context.dataset.label;
                        },
                    }
                },
                scales:{
                    xAxes:[
                    {
                        id: 'xAxis1',
                        stacked: true,
                        categoryPercentage: 0.90,
                        ticks: {
                            callback:function(label){
                                var month = label.split(";")[0];
                                var year = label.split(";")[1];
                                return month;
                            }
                        },
                    },
                    {
                        id: 'xAxis2',
                        gridLines: {
                            drawOnChartArea: false, // only want the grid lines for one x-axis to show up
                        },
                        ticks: {
                            callback: function(label){
                                var month = label.split(";")[0];
                                var year = label.split(";")[1];
                                if (month === "June"){
                                    return year;
                                } else {
                                    return "";
                                }
                            }
                        },
                    }],
                    yAxes: [{
                        stacked: false,
                        ticks: {
                            beginAtZero: true,
                        }
                    }]
                },
            };

            // Chart
            var chart = new Chart($("#sales-category"), {
                type: 'bar',
                data: data,
                options: options,
            });
        })
    .fail(function() {
        console.log("Failed to get sales data.");
    });
});
