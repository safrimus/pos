(function(window, document) {
    var CUSTOMERS_URL = "http://127.0.0.1:80/api/v1/customers/";
    var INVOICES_URL = "http://127.0.0.1:80/api/v1/invoices/?fields=id,date_of_sale,customer,invoice_total,payments_total&credit=true&unpaid_invoices=true";

    var table = null;
    var customerList = {};
    var collapsedGroups = {};


    function format_number(n) {
      return parseFloat(n).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }

    window.refreshUnpaidInvoices = function() {
        $.get(CUSTOMERS_URL)
            .done (function(customers) {
                for (i in customers) {
                    customerList[customers[i].id] = customers[i].name;
                }
            })
            .fail(function() {
                console.log("Failed to get customers.");
            });

        table.ajax.reload();

        setTimeout( function() {
            $("#unpaid-customers-search").focus();
        }, 1);
    }

    function setupTable() {
        table = $("#unpaid-invoices-table").DataTable({
            ajax: {
                url: INVOICES_URL,
                dataSrc: '',
            },
            rowGroup: {
                dataSrc: 'customer',
                startRender: function (rows, group) {
                    var collapsed = !!collapsedGroups[group];

                    rows.nodes().each(function (r) {
                        r.style.display = collapsed ? 'none' : '';
                    });    

                    // Add category name to the <tr>. NOTE: Hardcoded colspan
                    return $('<tr/>')
                        .append('<td colspan="5">' + customerList[group] + '</td>')
                        .attr('data-name', group)
                        .toggleClass('collapsed', collapsed);
                },
            },
            columns: [
                {
                    data: 'customer',
                    searchable: true,
                    orderable: true,
                    type: 'natural-ci',
                    visible: false,
                    render: function(data, type, row) {
                                return customerList[data];
                            },
                },

                {data: 'id', type: 'num', orderable: false,},
                {
                    data: 'date_of_sale',
                    searchable: false,
                    orderable: false,
                    render: function(data, type, row) {
                                return $.datepicker.formatDate("d MM yy", new Date(data));
                            },
                },
                {
                    data: 'invoice_total',
                    searchable: false,
                    orderable: false,
                    render: function(data, type, row) {
                                return format_number(data || 0);
                            },

                },
                {
                    data: 'payments_total',
                    searchable: false,
                    orderable: false,
                    render: function(data, type, row) {
                                return format_number(data || 0);
                            },
                },
                {
                    searchable: false,
                    orderable: false,
                    type: 'num',
                    render: function(data, type, row) {
                                var total = row['invoice_total'] || 0;
                                var payments = row['payments_total'] || 0;
                                return format_number(total - payments);
                            },
                }
            ],
            orderFixed: [0, 'asc'],
            order: [[1, 'asc']],
            select: {
                style: 'api',
            },
            footerCallback: function(row, data, start, end, display) {
                var credit_owed = 0.0;

                this.api().column(5, { page: 'current'}).nodes().each(function(cell, index) {
                    credit_owed += parseFloat($(cell).text().replace(/,/g,''));
                });

                $(this.api().column(5).footer()).html(
                    "KD " + format_number(credit_owed)
                );
            },
            rowId: 'id',
            dom: 't',
            paging: false,
            scrollY: '70vh',
            scrollCollapse: true,
            autoWidth: true,
        });

        // Override the default smart search
        $("#unpaid-customers-search").on('keyup', function(event, params) {
            table.search("^" + this.value, true, false).draw();
        });
    }

    function setupEventTriggers() {
       $('#unpaid-invoices-table tbody').on('click', 'tr.dtrg-start', function () {
            var name = $(this).data('name');
            collapsedGroups[name] = !collapsedGroups[name];
            table.draw();
        });
    }

    $(document).ready(function() {
        $.get(CUSTOMERS_URL)
        .done (function(customers) {
            for (i in customers) {
                customerList[customers[i].id] = customers[i].name;
            }

            setupTable();
            setupEventTriggers();
            $("#unpaid-customers-search").focus();
        })
        .fail(function() {
            console.log("Failed to get customers.");
        });
    });
})(window, document);
