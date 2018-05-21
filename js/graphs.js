var SALES_TOTAL_URL = "http://127.0.0.1:80/api/v1/sales/total/";

var YEAR = 2018
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function monthNumberToName(number) {
    return MONTHS[number - 1];
}

function populateChartData(sales) {
    var salesData = []
    var profitData = []
    var labels = []
    var salesDict = {}
    var profitsDict = {}

    for (i in sales) {
        salesDict[sales[i].month] = sales[i].sales;
        profitsDict[sales[i].month] = sales[i].profit;
    }

    for (var i = 1; i <= 12; i++) {
        if (i in salesDict) {
            salesData.push(salesDict[i]);
            profitData.push(profitsDict[i]);
        } else {
            salesData.push(0);
            profitData.push(0);
        }

        labels.push(monthNumberToName(i) + ';' + YEAR);
    }

    return {'sales': salesData, 'profit': profitData, 'labels': labels};
}

$(document).ready(function() {
    $.get(SALES_TOTAL_URL + "?year=" + YEAR)
        .done (function(sales) {
            // Data
            chartData = populateChartData(sales);

            var data = {
                labels: chartData.labels,
                datasets: [
                    {
                        label: "Total Sales",
                        backgroundColor: 'blue',
                        borderColor: 'blue',
                        xAxisID: 'xAxis1',
                        data: chartData.sales,
                        datalabels: {
                            align: 'end',
                            anchor: 'end',
                        },
                        fill: false,
                        lineTension: 0,
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
                    },
                ],
            };

            // Options
            var options = {
                responsive: true,
                animation: false,
                title: {
                    display: true,
                    text: "Total Sales & Profit per Month for " + YEAR,
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
                        type: "category",
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
                        type: "category",
                        gridLines: {
                            drawOnChartArea: false, // only want the grid lines for one axis to show up
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
