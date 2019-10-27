(function(window, document) {
    var CASHFLOW_URL = "http://127.0.0.1:80/api/v1/cashflow/total/?group_by=month,year";

    var CURRENT_DATE = moment();
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var chart = null;
    var dateFilterBy = "last_12_months";


    window.refreshCashflowGraphPage = function() {
        loadChart();
    }

    function format_number(n) {
      return parseFloat(n).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }

    function daysInMonth(month) {
        now = new Date();
        return new Date(now.getFullYear(), month, 0).getDate();
    }

    function setupEventTriggers() {
        // Date search change
        $("#total-cashflow-graph-by-month-input-month,\
           #total-cashflow-graph-by-month-input-year").on('change', function(event, params) {
            loadChart();
        });

        // Date checkboxes
        $("#total-cashflow-graph-by-month-btn").on('change', function(event, params) {
            $("#total-cashflow-graph-by-month").removeClass("hide");

            dateFilterBy = "month";
            loadChart();
            $("#total-cashflow-graph-by-month-input-month").focus();
        });

        $("#total-cashflow-graph-by-year-btn").on('change', function(event, params) {
            $("#total-cashflow-graph-by-month").addClass("hide");

            dateFilterBy = "last_12_months";
            loadChart();
        });
    }

    function populateChartData(cashflow) {
        var invoiceData = []
        var paymentsData = []
        var labels = []
        var invoiceDict = {}
        var paymentsDict = {}

        if (dateFilterBy == "last_12_months") {
            var currentMonth = CURRENT_DATE.month() + 1;  // Adding one as jan is zero
            var currentYear = parseInt(CURRENT_DATE.format("YY"));  // Get last two digits of year

            for (i in cashflow) {
                if (cashflow[i].type == "credit_payment") {
                    paymentsDict[cashflow[i].month] = cashflow[i].cash;
                } else if (cashflow[i].type == "invoice") {
                    invoiceDict[cashflow[i].month] = cashflow[i].cash;
                }
            }

            var month;
            for (var i = 0; i <= 11; i++) {
                if (currentMonth - i < 1) {
                    currentMonth = i + 12;
                    currentYear--;
                }

                month = currentMonth - i;

                if (month in invoiceDict) {
                    invoiceData.unshift(invoiceDict[month]);
                    paymentsData.unshift(paymentsDict[month]);
                } else {
                    invoiceData.unshift(null);
                    paymentsData.unshift(null);
                }

                labels.unshift(MONTHS[month - 1] + ' ' + currentYear);
            }
        } else if (dateFilterBy == "month") {
            for (i in cashflow) {
                if (cashflow[i].type == "credit_payment") {
                    paymentsDict[cashflow[i].day] = cashflow[i].cash;
                } else if (cashflow[i].type == "invoice") {
                    invoiceDict[cashflow[i].day] = cashflow[i].cash;
                }
            }

            month = $("#total-cashflow-graph-by-month-input-month").val();
            for (var day = 1; day <= daysInMonth(month); day++) {
                if (day in invoiceDict) {
                    invoiceData.push(invoiceDict[day]);
                    paymentsData.push(paymentsDict[day]);
                } else {
                    invoiceData.push(null);
                    paymentsData.push(null);
                }

                labels.push(day);
            }
        }

        return {'invoice': invoiceData, 'payments': paymentsData, 'labels': labels};
    }

    function loadChart(firstLoad=false) {
        // Construct filter url
        var urlFilter = null

        if (dateFilterBy == "month") {
            month = $("#total-cashflow-graph-by-month-input-month").val();
            year = $("#total-cashflow-graph-by-month-input-year").val();

            if (!month || !year) {
                return;
            }

            urlFilter = "&month=" + month + "&year=" + year;
        } else if (dateFilterBy == "last_12_months") {
            var momentDate = moment()
            var endDate = momentDate.endOf('month').format("YYYY-MM-DD") + "+23:59:59";
            var startDate = momentDate.subtract(11, 'months').startOf('month').format("YYYY-MM-DD") + "+00:00:00";
            urlFilter = "&date_start=" + startDate + "&date_end=" + endDate;
        }

        $.get(CASHFLOW_URL + urlFilter)
            .done(function(cashflow) {
                // Data
                chartData = populateChartData(cashflow);

                var data = {
                    labels: chartData.labels,
                    datasets: [
                        {
                            label: "Cash Invoice",
                            backgroundColor: 'lightblue',
                            borderColor: 'lightblue',
                            data: chartData.invoice,
                        },
                        {
                            label: "Payments",
                            backgroundColor: 'red',
                            borderColor: 'red',
                            data: chartData.payments,
                        },
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
                    tooltips: {
                        mode: 'label',
                        intersect: false,
                        bodyFontSize: 14,
                        footerFontSize: 14,
                        callbacks: {
                            label: function(tooltipItem, data) {
                                var label = data.datasets[tooltipItem.datasetIndex].label;
                                var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] || 0.0;
                                return label + ": " + format_number(value);
                            },
                            footer: function(tooltipItems, data) {
                                var total = 0.0;
                                for (var i = 0; i < tooltipItems.length; i++) {
                                    total += parseFloat(tooltipItems[i].yLabel || 0.0);
                                }
                                return 'Total: ' + format_number(total);
                            },
                        },
                    },
                    scales:{
                        xAxes:[
                        {
                            stacked: true,
                        }],
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                            },
                            stacked: true,
                        }]
                    },
                };

                // Chart
                if (firstLoad) {
                    chart = new Chart($("#cashflow"), {
                        type: 'bar',
                        data: data,
                        options: options,
                    });
                } else {
                    chart.data = data;
                    chart.update();
                }
            })
            .fail(function() {
                console.log("Failed to get cashflow data.");
            });
    }

    $(document).ready(function() {
        currentDate = new Date();
        $("#total-cashflow-graph-by-month-input-year").val(currentDate.getFullYear());
        $("#total-cashflow-graph-by-month-input-month").val(currentDate.getMonth() + 1);

        setupEventTriggers();
        loadChart(firstLoad=true);
    });
})(window, document);

//# sourceURL=cashflow_graph.js 
