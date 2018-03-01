var SOURCES_URL = "http://127.0.0.1:80/api/v1/sources/?fields=id,name,total_value";
var CATEGORIES_URL = "http://127.0.0.1:80/api/v1/categories/?fields=id,name,total_value";


function format_number(n) {
  return n.toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
}

$(document).ready(function() {
    $("#sources-table").DataTable({
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

            $("#sources-table").DataTable().rows().every(function(rowIdx, tableLoop, rowLoop) {
                total += this.data().total_value;
            });

            $(this.api().column(1).footer()).html(
                "KD " + format_number(total)
            );
        },
        rowId: 'id',
        dom: 't',
        paging: false,
        scrollY: '85vh',
        scrollCollapse: true,
        autoWidth: true,
    });

    $("#categories-table").DataTable({
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

            $("#categories-table").DataTable().rows().every(function(rowIdx, tableLoop, rowLoop) {
                total += this.data().total_value;
            });

            $(this.api().column(1).footer()).html(
                "KD " + format_number(total)
            );
        },
        rowId: 'id',
        dom: 't',
        paging: false,
        scrollY: '85vh',
        scrollCollapse: true,
        autoWidth: true,
    });
});
