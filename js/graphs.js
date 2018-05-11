var SALES_TOTAL_URL = "http://127.0.0.1:80/api/v1/sales/total/";

var YEAR = 2018
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function monthNumberToName(number) {
    return MONTHS[number - 1];
}

function populateChartData(sales) {
    var data = []
    var labels = []
    var salesDict = {}

    for (i in sales) {
        salesDict[i.month] = i.sum;
    }

    for (var i = 1; i <= 12; i++) {
        if (i in salesDict) {
            data.push(salesDict[i]);
        } else {
            data.push(0);
        }

        labels.push(monthNumberToName(i) + YEAR);
    }

    return {'data': data, 'labels': labels};
}

$(document).ready(function() {
    $.get(SALES_TOTAL_URL + "?year=" + YEAR)
        .done (function(sales) {
            // Data
            chartData = populateChartData(sales);

            var data = {
                labels: chartData.labels,
                datasets: [{
                    label: "Total Sales",
                }],
            };

            // Options

            // Chart
            var chart = new Chart($("#sales-total"), {
                type: 'line',
                data: data,
                options: options,
            })
        })
    .fail(function() {
        console.log("Failed to get sales data.");
    });
});
