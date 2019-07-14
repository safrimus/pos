(function(window, document) {
    var SOURCES_URL = "http://127.0.0.1:80/api/v1/sources/?fields=id,name,total_value";
    var CATEGORIES_URL = "http://127.0.0.1:80/api/v1/categories/?fields=id,name,total_value";
    var EXTERNAL_STOCK_URL = "http://127.0.0.1:80/api/v1/external/stock/";
    var EXTERNAL_BACKUP_URL = "http://127.0.0.1:80/api/v1/external/backup_db/";


    function format_number(n) {
      return parseFloat(n).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }

    window.refreshStockPage = function() {
        $("#stock-sources-table").DataTable().ajax.reload();
        $("#stock-categories-table").DataTable().ajax.reload();
    }

    function setupEventTriggers() {
        $("#stock-import-xls").on("change", function() {
            if ($(this).val().split('.').pop() != 'xls') {
                alert("Import file must of type 'xls'");
                return;
            }

            $("#stock-import-confirmation-dialog").dialog("open");
        });

        // Reset selected file on click
        $("#stock-import-xls").on("click", function() {
            this.value = null;
        });
    }

    $(document).ready(function() {
        setupEventTriggers();

        // Setup dialogs
        $("#stock-import-result-dialog").dialog({
            autoOpen: false,
            closeOnEscape: false,
            draggable: false,
            modal: true,
            resizable: false,
            title: "Data Import",
            buttons: [
                {
                    id: "stock-import-result-ok-button",
                    text: "OK",
                    click: function() {
                        $(this).dialog("close");
                    }
                },
            ],
        });

        $("#stock-import-confirmation-dialog").dialog({
            autoOpen: false,
            closeOnEscape: false,
            draggable: false,
            modal: true,
            resizable: false,
            minWidth: 350,
            title: "Data Import",
            buttons: [
                {
                    text: "Backup",
                    click: function() {
                        window.location.href = EXTERNAL_BACKUP_URL;
                    }
                },
                {
                    text: "Upload",
                    click: function() {
                        $(this).dialog("close");

                        var data = new FormData();
                        data.append('file', document.getElementById("stock-import-xls").files[0]);

                        $("#stock-import-result-dialog").text("Please Wait...")
                        $("#stock-import-result-ok-button").prop("disabled", true).addClass("ui-state-disabled");
                        $("#stock-import-result-dialog").dialog("open");

                        $.ajax({
                            url: EXTERNAL_STOCK_URL,
                            type: 'POST',
                            data: data,
                            cache: false,
                            contentType: false,
                            processData: false,
                            success: function(data) {
                                $("#stock-import-result-ok-button").prop("disabled", false).removeClass("ui-state-disabled");
                                $("#stock-import-result-dialog").text("Success!")
                                window.refreshStockPage();
                            },
                            error: function() {
                                $("#stock-import-result-ok-button").prop("disabled", false).removeClass("ui-state-disabled");
                                $("#stock-import-result-dialog").text("Failed to upload file")
                            },
                        })
                    }
                },
                {
                    text: "Cancel",
                    click: function() {
                        $(this).dialog("close");
                    }
                }
            ],
        });

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
