(function(window, document) {
	var EXTERNAL_RESTORE_URL = "http://127.0.0.1:80/api/v1/external/restore_db/";

    window.refreshAdminPage = function() {}

    function setupEventTriggers() {
        $("#admin-import-db").on("change", function() {
            split_filename = $(this).val().split('.')
            if (split_filename.pop() != 'gz' && split_filename != 'tar') {
                alert("Import file must of type '.tar.gz'");
                return;
            }

            $("#admin-import-confirmation-dialog").dialog("open");
        });

        // Reset selected file on click
        $("#admin-import-db").on("click", function() {
            this.value = null;
        });
    }

	$(document).ready(function() {
        setupEventTriggers();

        // Setup dialogs
        $("#admin-import-result-dialog").dialog({
            autoOpen: false,
            closeOnEscape: false,
            draggable: false,
            modal: true,
            resizable: false,
            title: "Data Import",
            buttons: [
                {
                    id: "admin-import-result-ok-button",
                    text: "OK",
                    click: function() {
                        $(this).dialog("close");
                        $("#admin-import-result-dialog").dialog("option", "width", "300");
                    }
                },
            ],
        });

        $("#admin-import-confirmation-dialog").dialog({
            autoOpen: false,
            closeOnEscape: false,
            draggable: false,
            modal: true,
            resizable: false,
            title: "Data Import",
            buttons: [
                {
                    text: "Upload",
                    click: function() {
                        $(this).dialog("close");

                        var data = new FormData();
                        data.append('file', document.getElementById("admin-import-db").files[0]);

                        $("#admin-import-result-dialog-text").text("Please Wait...")
                        $("#admin-import-result-ok-button").prop("disabled", true).addClass("ui-state-disabled");
                        $("#admin-import-result-dialog").dialog("open");

                        $.ajax({
                            url: EXTERNAL_RESTORE_URL,
                            type: 'POST',
                            data: data,
                            cache: false,
                            contentType: false,
                            processData: false,
                            success: function(data) {
                                $("#admin-import-result-dialog").dialog("option", "width", "auto");
                                $("#admin-import-result-ok-button").prop("disabled", false).removeClass("ui-state-disabled");
                                $("#admin-import-result-dialog-text").text("Success!\n" + data)
                            },
                            error: function() {
                                $("#admin-import-result-ok-button").prop("disabled", false).removeClass("ui-state-disabled");
                                $("#admin-import-result-dialog-text").text("Failed to upload file")
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

	});

})(window, document);

//# sourceURL=admin.js
