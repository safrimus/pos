$(document).ready(function(){
    $("#home").click(function() {
        $(".submenu").hide("fast");
        $("#mainmenu").delay(100).show("fast");
    });
    // Invoice menu
    $("#invoice").click(function() {
        $("#mainmenu").hide("fast");
        $("#invoicemenu").delay(100).show("fast");
    });
    // Credit menu
    $("#credit").click(function() {
        $("#mainmenu").hide("fast");
        $("#creditmenu").delay(100).show("fast");
    });
    // Stock menu
    $("#stock").click(function() {
        $("#mainmenu").hide("fast");
        $("#stockmenu").delay(100).show("fast");
    });
    // Sales Reports menu
    $("#salesreports").click(function() {
        $("#mainmenu").hide("fast");
        $("#salesreportsmenu").delay(100).show("fast");
    });
});
