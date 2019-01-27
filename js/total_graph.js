var SALES_TOTAL_URL = "http://127.0.0.1:80/api/v1/sales/total/";

var CURRENT_DATE = new Date();
var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function populateChartData(sales) {
    var salesData = []
    var profitData = []
    var labels = []
    var salesDict = {}
    var profitsDict = {}

    for (i in sales) {
        // If sales entry for this month has been seen before and if the year is earlier than the current
        // year, skip to next item. This is to ensure we have the latest sale value for each month
        // when looking at multiple years.
        if (salesDict[sales[i].month] !== undefined && sales[i].year < CURRENT_DATE.getFullYear()) {
            continue;
        }

        salesDict[sales[i].month] = sales[i].sales;
        profitsDict[sales[i].month] = sales[i].profit;
    }

    var currentMonth = CURRENT_DATE.getMonth() + 1;  // Adding one as jan is zero
    var currentYear = parseInt(CURRENT_DATE.getFullYear().toString().substr(-2));  // Get last two digits of year

    var month;
    for (var i = 0; i <= 11; i++) {
        if (currentMonth - i < 1) {
            currentMonth = i + 12;
            currentYear--;
        }

        month = currentMonth - i;

        if (month in salesDict) {
            salesData.unshift(salesDict[month]);
            profitData.unshift(profitsDict[month]);
        } else {
            salesData.unshift(null);
            profitData.unshift(null);
        }

        labels.unshift(MONTHS[month - 1] + ' ' + currentYear);
    }

    return {'sales': salesData, 'profit': profitData, 'labels': labels};
}

$(document).ready(function() {
    var yearFilter = "?year=" + CURRENT_DATE.getFullYear();

    if (CURRENT_DATE.getMonth() != 12) {
        yearFilter = yearFilter + "," + (CURRENT_DATE.getFullYear() - 1);
    }

    $.get(SALES_TOTAL_URL + yearFilter)
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
                        xAxisID: 'xAxis1',
                        data: chartData.sales,
                        datalabels: {
                            align: 'end',
                            anchor: 'end',
                        },
                        fill: false,
                        lineTension: 0,
                        spanGaps: true,
                    },
                    {
                        label: "Total Profit",
                        backgroundColor: 'red',
                        borderColor: 'red',
                        xAxisID: 'xAxis1',
                        data: chartData.profit,
                        datalabels: {
                            align: 'end',
                            anchor: 'end',
                        },
                        fill: false,
                        lineTension: 0,
                        spanGaps: true,
                    },
                ],
            };

            // Options
            var options = {
                responsive: true,
                animation: false,
                title: {
                    display: true,
                    text: "Total Sales & Profit per Month",
                },
                plugins: {
                    datalabels: {
                        backgroundColor: function(context) {
                            return context.dataset.backgroundColor;
                        },
                        borderRadius: 4,
                        color: 'black',
                        font: {
                            size: '14',
                        },
                    }
                },
                scales:{
                    xAxes:[
                    {
                        id: 'xAxis1',
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                        }
                    }]
                },
            };

            // Chart
            var chart = new Chart($("#sales-total"), {
                type: 'line',
                data: data,
                options: options,
            });
        })
    .fail(function() {
        console.log("Failed to get sales data.");
    });
});
