"use strict";

var updateEverything = function(){}
$(document).ready(function() {
    $.ajaxSetup({ cache: false });
    
    var comconfig = { url: "http://xs.powerdns.com:8000/", beginTime: -3*3600, datapoints: 100 };

    var current;
    $(window).bind('popstate',  
		   function(event) {
		       if(event.originalEvent.state != undefined) {
			   $("#server").val(event.originalEvent.state.server);
			   $("#duration").val(event.originalEvent.state.beginTime);
			   current = configAll();
			   updateEverything();
		       }
		   });

    function configAll()
    {
	var servername=$("#server").val();
	if(servername=='')
	    return [];

	var config1 = { items: [ 
            { name: servername+".servfail-answers", legend: "Servfail answers/s"},
            { name: servername+".questions", legend: "Questions/s" }, 
            { name: servername+".all-outqueries", legend: "All outqueries/s"}
        ]};
	
	
	var config2 = { renderer: 'stack', items: [ 
            { name: servername+".answers-slow", legend: "Slow answers/s"},
	    { name: servername+".packetcache-hits", legend: "0ms answers/s"},
            { name: servername+".answers0-1", legend: "<1 ms answers/s"},
            { name: servername+".answers1-10", legend: "1-10ms answers/s"},
            { name: servername+".answers10-100", legend: "10-100ms answers/s"},
            { name: servername+".answers100-1000", legend: "100-1000ms answers/s"}
	    
	]};
	
	var config2a = { renderer: 'stack', items: [ 
            { name: servername+".servfail-answers", legend: "SERVFAIL answers/s"},
            { name: servername+".nxdomain-answers", legend: "NXDOMAIN answers/s"},
            { name: servername+".noerror-answers", legend: "Normal answers/s"}	    
	]};
	
	var config2b = { items: [ 
            { name: servername+".tcp-questions", legend: "TCP/IP questions/s"},
            { name: servername+".tcp-outqueries", legend: "TCP/IP outqueries/s"},
            { name: servername+".tcp-client-overflow", legend: "TCP/IP overflows/s"}	    
	]};

	
	var config3 ={ renderer: "stack", items: [ 
            { metrics: [servername+".user-msec"], legend: "User CPU%",
	      formula: function(r,d) { return d[0]/10.0; }
	    }, 
            { metrics: [servername+".sys-msec"], legend: "System CPU%",
	      formula: function(r,d) { return d[0]/10.0; }
	    }]};
	
	var config3a = { items: [ 
            { name: servername+".throttled-out", legend: "Throttled/s" }, 
            { name: servername+".resource-limits", legend: "Resource limited/s"}]};

	var config3b ={ items: [
            { name: servername+".concurrent-queries", legend: "Concurrent queries", kind: "gauge"}
        ]};

	
	var config4 = { items: [ 
            { 
		metrics: [servername+".packetcache-hits",servername+".packetcache-misses"], 
		legend: "% packetcache hitrate", 
		formula: percentalizer
	    }]};    

	var config5 = { items: [ 
            { 
		metrics: [servername+".cache-hits",servername+".cache-misses"], 
		legend: "% cache hitrate", 
		formula: percentalizer
	    }]};    


	var config6 ={ renderer: "stack", items: [
            { name: servername+".cache-entries", legend: "Cache entries", kind: "gauge"}, 
            { name: servername+".packetcache-entries", legend: "Packetcache entries", kind: "gauge"}]};


	var config7 = { items: [ 
            { name: servername+".udp-queries", legend: "Questions/s" }, 
            { name: servername+".udp-answers", legend: "Answers/s"}]};

	var config7a = { items: [ 
            { name: servername+".tcp-queries", legend: "TCP Questions/s" }, 
            { name: servername+".tcp-answers", legend: "TCP Answers/s"}]};

	var config7b = { items: [ 
            { name: servername+".qsize-q", legend: "DB Queue", kind: "gauge"}
            ]};


	var config8 = { items: [ 
            { 
		metrics: [servername+".packetcache-hit",servername+".packetcache-miss"], 
		legend: "% packet cache hitrate", 
		formula: percentalizer
	    }]};    

	var config9 = { items: [ 
            { 
		metrics: [servername+".query-cache-hit",servername+".query-cache-miss"], 
		legend: "% query cache hitrate", 
		formula: percentalizer
 	    }]};    

	var config10 = { items: [ 
		{name: servername+".query-cache-miss", legend: "Database queries/s"}
	]};

	var configs;
	if(servername.split('.')[2]=="recursor") { 
	    configs=[config1, config2, config2a, config2b, config3, config3a, config3b, config4, config5, config6];
	}
	else if(servername.split('.')[2]=="auth") { 
	    configs=[config7, config7a, config7b, config8, config9, config10];
	}
	else if(servername.split('.')[2]=="network") { 
	    configs=[ { 
		items: [ 
		    {name: servername+".udp.in-errors", legend: "UDP Input error/s"},
		    {name: servername+".udp.sndbuf-errors", legend: "UDP SNDBuf error/s"},
		    {name: servername+".udp.rcvbuf-errors", legend: "UDP RCVBuf error/s"},
		    {name: servername+".udp.noport-errors", legend: "UDP Noport error/s"}
		]
	    }, {
		items: [ 
		    { name: servername+".interfaces.bond0.tx_bytes", legend: "bond0 TX bits/s", bytesToBits: true},
		    { name: servername+".interfaces.bond0.rx_bytes", legend: "bond0 RX bits/s", bytesToBits: true},
		    ]
	    }
		    ];
	}
	
	return setupMetronomeHTML("#graphs", configs);	
    }

    function showAll()
    {
	showStuff(comconfig, current);
    }
    
    var interval;     

    window.updateEverything = function() { 
	comconfig.beginTime = parseInt($("#duration").val());
	
	if(interval != undefined)
	    clearInterval(interval);
	interval = setInterval(updateEverything, -comconfig.beginTime*1000/comconfig.datapoints);    

	showAll();
    };    

    window.updateFromForm = function() {
	current = configAll();

	var stateObj = { server: $("#server").val(), beginTime: parseInt($("#duration").val()) };
	history.pushState(stateObj, "Metronome", "?server="+stateObj.server+"&beginTime="+stateObj.beginTime);
	updateEverything();
    }


    getServers(comconfig, function(servers) { 

	var ret="";
	$.each(servers, function(a,b) {
	    ret+= "<option value='"+b+"'>"+b+"</option>";
	});
	$("#server").html(ret);

	if($.url().param('server') != undefined) {
	    $("#server").val($.url().param('server'));
	}
	if($.url().param('beginTime') != undefined)
	    $("#duration").val($.url().param('beginTime'));
	
	var stateObj = { server: $("#server").val(), beginTime: parseInt($("#duration").val()) };
	history.replaceState(stateObj, "Metronome", "?server="+stateObj.server+"&beginTime="+stateObj.beginTime);

	current=configAll();
	updateEverything();
    });
 
});
