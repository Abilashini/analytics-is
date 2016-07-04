var TOPIC = "subscriber";
var PUBLISHER_TOPIC = "chart-zoomed";
var page = gadgetUtil.getCurrentPageName();
var qs = gadgetUtil.getQueryString();
var prefs = new gadgets.Prefs();
var type;
var chart = gadgetUtil.getChart(prefs.getString(PARAM_GADGET_ROLE));
var rangeStart;
var rangeEnd;
var gadgetContext = SESSION_CONTEXT;

if (chart) {
    type = gadgetUtil.getRequestType(page, chart);
}

$(function() {
    if (!chart) {
        $("#canvas").html(gadgetUtil.getErrorText("Gadget initialization failed. Gadget role must be provided."));
        return;
    }
    /*if (page != TYPE_LANDING && qs[PARAM_ID] == null) {
        $("#canvas").html(gadgetUtil.getDefaultText());
        return;
    }*/
    var timeFrom = gadgetUtil.timeFrom();
    var timeTo = gadgetUtil.timeTo();
    gadgetUtil.fetchData(gadgetContext, {
        type: type,
        timeFrom: timeFrom,
        timeTo: timeTo,
        start: 0,
        count: 10        
    }, onData, onError);
});

gadgets.HubSettings.onConnect = function() {
    gadgets.Hub.subscribe(TOPIC, function(topic, data, subscriberData) {
        onTimeRangeChanged(data);
    });
};

function onTimeRangeChanged(data) {
    gadgetUtil.fetchData(gadgetContext, {
        type: type,
        timeFrom: data.timeFrom,
        timeTo: data.timeTo,
        start: 0,
        count: 10
    }, onData, onError);
};


function onData(response) {
    try {
        var data = response.message;
        if (data.length == 0) {
            $('#canvas').html(gadgetUtil.getEmptyRecordsText());
            return;
        }
        
        loadStats(data);
        
        //perform necessary transformation on input data
        chart.schema[0].data = chart.processData(data);
        //sort the timestamps
        chart.schema[0].data.sort(function(a, b) {
            return a[1] - b[1];
        });
        //finally draw the chart on the given canvas
        chart.chartConfig.width = $('body').width();
        chart.chartConfig.height = $('body').height();

        var vg = new vizg(chart.schema, chart.chartConfig);
        $("#canvas").empty();
        vg.draw("#canvas",[{type:"range", callback:onRangeSelected}]);

    } catch (e) {
        $('#canvas').html(gadgetUtil.getErrorText(e));
    }
};

function loadStats(data){
    var activeSessionCount = data[1].activeCount;
    $("#active-session-count").html(activeSessionCount);
}

function onError(msg) {
    $("#canvas").html(gadgetUtil.getErrorText(msg));
};

// $(window).resize(function() {
//     // if (page != TYPE_LANDING && qs[PARAM_ID]) {
//         drawChart();
//     // }
// });

document.body.onmouseup = function() {
    // var div = document.getElementById("dChart");
    // div.innerHTML = "<p> Start : " + rangeStart + "</p>" + "<p> End : " + rangeEnd + "</p>";

    if((rangeStart) && (rangeEnd) && (rangeStart.toString() !== rangeEnd.toString())){
        var message = {
            timeFrom: new Date(rangeStart).getTime(),
            timeTo: new Date(rangeEnd).getTime(),
            timeUnit: "Custom"
        };
        gadgets.Hub.publish(PUBLISHER_TOPIC, message);
    }
}

var onRangeSelected = function(start, end) {
    rangeStart = start;
    rangeEnd = end;
};