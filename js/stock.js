(function(window, document) {
    var SOURCES_URL = "http://127.0.0.1:80/api/v1/sources/?fields=id,name,total_value";
    var CATEGORIES_URL = "http://127.0.0.1:80/api/v1/categories/?fields=id,name,total_value";
    var EXTERNAL_STOCK_URL = "http://127.0.0.1:80/api/v1/external/stock/";


    function format_number(n) {
      return parseFloat(n).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }

    window.refreshStockPage = function() {
        $("#stock-sources-table").DataTable().ajax.reload();
        $("#stock-categories-table").DataTable().ajax.reload();
    }

    function setupEventTriggers() {
        $("#stock-import-xls").on("change", function() {
            var data = new FormData();
            data.append('file', this.files[0]);

            $.ajax({
                url: EXTERNAL_STOCK_URL,
                type: 'POST',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                success: function(data) {
                    alert("Stock data upload successful");
                    window.refreshStockPage();
                },
                error: function() {
                    alert("Failed to upload file");
                },
            })
        });

        // Reset selected file on click
        $("#stock-import-xls").on("click", function() {
            this.value = null;
        });
    }

    $(document).ready(function() {
        setupEventTriggers();

        $("#stock-sources-table").DataTable({
            ajax: {
                url: SOURCES_URL,
                dataSrc: '',
            },
            columns: [
                {data: 'name', type: 'natural-ci'},
                {
                	data: 'total_value',
                	searchable: false,
                	type: 'natural-ci',
                    render: function(data, type, row) {
                    			var value = data || 0;
                                return format_number(value);
                            },
                },
            ],
            order: [[0, 'asc'],],
            select: {
                style: 'api',
            },
            footerCallback: function(row, data, start, end, display) {
                var total = 0.0;

                $("#stock-sources-table").DataTable().rows().every(function(rowIdx, tableLoop, rowLoop) {
                    if (this.data().total_value) {
                        total += parseFloat(this.data().total_value);
                    } else {
                        total += 0.0;
                    }
                });

                $(this.api().column(1).footer()).html(
                    "KD " + format_number(total)
                );
            },
            rowId: 'id',
            dom: 't',
            paging: false,
            scrollY: '70vh',
            scrollCollapse: true,
            autoWidth: true,
        });

        $("#stock-categories-table").DataTable({
            ajax: {
                url: CATEGORIES_URL,
                dataSrc: '',
            },
            columns: [
                {data: 'name', type: 'natural-ci'},
                {
                    data: 'total_value',
                    searchable: false,
                    type: 'natural-ci',
                    render: function(data, type, row) {
                                var value = data || 0;
                                return format_number(value);
                            },
                },
            ],
            order: [[0, 'asc'],],
            select: {
                style: 'api',
            },
            footerCallback: function(row, data, start, end, display) {
                var total = 0.0;

                $("#stock-categories-table").DataTable().rows().every(function(rowIdx, tableLoop, rowLoop) {
                    if (this.data().total_value) {
                        total += parseFloat(this.data().total_value);
                    } else {
                        total += 0.0;
                    }
                });

                $(this.api().column(1).footer()).html(
                    "KD " + format_number(total)
                );
            },
            rowId: 'id',
            dom: 't',
            paging: false,
            scrollY: '70vh',
            scrollCollapse: true,
            autoWidth: true,
        });
    });
})(window, document);

//# sourceURL=stock.js 
