(function(window, document) {
    var SALES_TOTAL_URL = "http://127.0.0.1:80/api/v1/sales/total/";

    var CURRENT_DATE = new Date();
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var chart = null;


    window.refreshTotalGraphPage = function() {
        loadChart();
    }

    function populateChartData(sales) {
        var salesData = []
        var profitData = []
        var labels = []
        var salesDict = {}
        var profitsDict = {}

        var currentMonth = CURRENT_DATE.getMonth() + 1;  // Adding one as jan is zero
        var currentYear = parseInt(CURRENT_DATE.getFullYear().toString().substr(-2));  // Get last two digits of year

        for (i in sales) {
            // This is to ensure we have the latest sale value for each month when looking at multiple years.
            if (sales[i].year < CURRENT_DATE.getFullYear() && sales[i].month <= currentMonth) {
                continue;
            }

            salesDict[sales[i].month] = sales[i].sales;
            profitsDict[sales[i].month] = sales[i].profit;
        }

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

    function loadChart(firstLoad=false) {
        var yearFilter = "?year=" + CURRENT_DATE.getFullYear();

        if (CURRENT_DATE.getMonth() != 12) {
            yearFilter = yearFilter + "," + (CURRENT_DATE.getFullYear() - 1);
        }

        $.get(SALES_TOTAL_URL + yearFilter)
            .done(function(sales) {
                var salesHidden = false;
                var profitHidden = false;

                // Data
                chartData = populateChartData(sales);

                // Hidden graph logic
                if (!firstLoad) {
                    salesHidden = !chart.isDatasetVisible(0);
                    profitHidden = !chart.isDatasetVisible(1);
                }

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
                            hidden: salesHidden,
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
                            hidden: profitHidden,
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
                if (firstLoad) {
                    chart = new Chart($("#total-sales-profit"), {
                        type: 'line',
                        data: data,
                        options: options,
                    });
                } else {
                    chart.data = data;
                    chart.update();
                }
            })
            .fail(function() {
                console.log("Failed to get sales/profit data.");
            });
    }

    $(document).ready(function() {
        loadChart(firstLoad=true);
    });
})(window, document);

//# sourceURL=total_graph.js 
