// ==UserScript==
// @name Steam Card Exchange Add Set Worth Column
// @namespace Steam Card Exchange Add Set Worth Column
// @author Laurvin
// @description Adds Set Worth
// @version 4.0
// @icon https://i.imgur.com/XYzKXzK.png
// @downloadURL https://github.com/Laurvin/Steam-Card-Exchange-Add-Set-Worth-Column/raw/master/Steam_Card_Exchange_Add_Set_Worth_Column.user.js
// @updateURL https://github.com/Laurvin/Steam-Card-Exchange-Add-Set-Worth-Column/raw/master/Steam_Card_Exchange_Add_Set_Worth_Column.user.js
// @match http://www.steamcardexchange.net/index.php?userlist
// @match https://www.steamcardexchange.net/index.php?userlist
// @match http://www.steamcardexchange.net/index.php?inventory
// @match https://www.steamcardexchange.net/index.php?inventory
// @grant GM_xmlhttpRequest
// @connect store.steampowered.com
// @run-at document-idle
// ==/UserScript==

/* globals jQuery, $ */

var AppsOwned = {};
var AddSetWorth = "";
var TableID = (window.location.href.indexOf("userlist") > -1)? 'private_watchlist' : 'inventorylist';
var InitialSort = (window.location.href.indexOf("userlist") > -1)? 'desc' : 'asc';

$( document ).ready(function()
{
	init();
});

function init()
{
	console.log("Starting Steam Card Exchange Add Set Worth Column!");

    $("<style type='text/css'> .w-14 {width: 3.5rem;} </style>").appendTo("head"); // Adding a 56px wide style for the columns.

	$('span[class="tracking-wider font-league-gothic"]').eq(1).after('&nbsp;<a class="btn-primary lg:w-min" id="HideButtons" title="Hide the below div with the checkbox toggles that control the table filtering.">Hide Toggles</a>');
	$('#HideButtons').data("hide-show", "Hide");
    $('#HideButtons').on("click", function()
	{
		HideButtons();
	});

	$('#HideButtons').after('&nbsp;<a class="btn-primary lg:w-min" id="SCEFilter" title="Hides all rows not Green (Normal Price Games), cannot use the toggles below cause that messes with filtering.">Show Green</a>');
	$('#SCEFilter').data("green-all", "Green");
    $('#SCEFilter').on("click", function()
	{
		FilterTable(TableID);
	});

	if (TableID == "inventorylist")
	{
		$('#SCEFilter').after('&nbsp;<a class="btn-primary lg:w-min" id="BoosterCalc" title="Make sure to open both the Steam Inventory and Steam Store in tabs in this browser session before clicking this button!">Calculate Boosterpack Values</a>');
		$('#BoosterCalc').on("click", function()
		{
			$('#BoosterCalc').text('Loading...');
			$('#BoosterCalc').after('&nbsp;<a href="https://steamcommunity.com/tradingcards/boostercreator/" class="btn-primary lg:w-min" id="BoosterLink" target="_blank" title="Opens the Steam Booster Creator in a new tab.">To Booster Creator</a>');
			loadBoosterPage('https://store.steampowered.com/dynamicstore/userdata/');
		});
	}

	// Setting paging to All or everything will bork.
	$(`#${TableID}`).on( 'init.dt', function ()
	{
		if ($(`#${TableID}`).DataTable().page.len() != -1)
		{
			$(`#${TableID}`).DataTable().page.len(-1).draw();
		}
	} ).dataTable();

	// We can't divine when the full table is on the page via .on() so we just wait some seconds before calling ChangeTable.
	AddSetWorth = setTimeout(ChangeTable, 4000, TableID, InitialSort, 'no');
}

function monkeyRequest(url)
{
	return new Promise(function(resolve, reject) {
		GM_xmlhttpRequest({
			method: 'GET',
			url: url,
			timeout: 9000,
			onload: function(response) {
				var BoosterJSON = JSON.parse(response.responseText);
				resolve(BoosterJSON);
			},
			onerror: function(response) {
				console.log(response.statusText);
				reject(response.statusText);
			},
			ontimeout: function(response) {
				reject("Timed out!");
			}
		});
	});
}

function loadBoosterPage(url)
{
	console.log('Getting Owned Apps');
	monkeyRequest(url).then(function(response) {
		parseBoosterPage(response);
	}, function(error) {
		console.log(error);
		alert('Failed loading page.', error);
	})
}

function parseBoosterPage(BoosterJSON)
{
    console.log(BoosterJSON.rgOwnedApps);
    if (BoosterJSON.rgOwnedApps.length === 0)
	{
		alert('You need to be logged into the Steam Store on this browser to use this function.');
		return;
	}

	$.each(BoosterJSON.rgOwnedApps, function (index, item)
		   {
		AppsOwned[item] = 1;
	});
	console.log('Received Owned Apps');

	ChangeTable(TableID, 'asc', 'yes');
	$('#BoosterCalc').text('Done!');
}

function ChangeTable(TableID, InitialSort, BoosterCalc)
{
    $(`#${TableID} thead tr th`).each(function(index)
    {
      if (index >= 3 && index <= 4) // Check if the current column is the 4th through 5th column (index 3 or 4)
      {
        $(this).removeClass('w-32'); // Remove the existing classes
        $(this).addClass('w-24');
      }
    });

	var MyRows = $(`#${TableID}`).find('tbody').find('tr');
	console.log("Rows", MyRows.length);
	for (var i = 0; i < MyRows.length; i++)
	{
		var Worth = $(MyRows[i]).find('td').eq(1).text();
		var SetSize = $(MyRows[i]).find('td').eq(3).text();

		if (BoosterCalc == "yes")
		{
			var BoosterPackGems = 0;
			var appID = $(MyRows[i]).find('a').attr('href');
			appID = appID.substring(appID.lastIndexOf('-')+1);
			if (AppsOwned[appID] === undefined) // Setting value to 0 if we don't own the game.
			{
				BoosterPackGems = 0;
			}
			else
			{
				BoosterPackGems = Math.round((Worth * 3) / (Math.round(6000/SetSize)) * 10000);
			}
			$(MyRows[i]).append('<td>' + BoosterPackGems + '</td>');
			$(MyRows[i]).css("display","table-row");
		}
		else
		{
			var SetWorth = Worth*SetSize;
            $(MyRows[i]).find('td').eq(4).text(SetWorth);
		}
	}

    var table = $(`#${TableID}`).DataTable();
    table.destroy(); // Need to destroy the table and then add headers before initiating new table.

	var SortedColumn = 4;

    if (BoosterCalc == "yes")
	{
		SortedColumn = 5;
		InitialSort = 'desc';
		$(`#${TableID} thead tr`).append('<th class="w-14" title="Booster Value">B V</th>');
	}
	else
	{
        $(`#${TableID} thead tr th`).eq(4).text('Set Worth');
	}

	$(`#${TableID}`).dataTable( {
		dom: 'rt<"dataTables_footer"ip>',
		"searching": false,
		pageLength: -1,
		autoWidth: false,
		stateSave: true,
		"order": [[ SortedColumn, InitialSort ], [ 0, 'asc' ]]
	} );

    $('#HideButtons').trigger('click'); // Hiding by default after loading this script.

    console.log("Finished Steam Card Exchange Add Set Worth Column!");
}

function FilterTable(TableID)
{
    var CurrentFilter = $('#SCEFilter').data("green-all");

    var MyRows = $(`#${TableID}`).find('tbody').find('tr');
	for (var i = 0; i < MyRows.length; i++)
	{
		var IsGreen = $(MyRows[i]).find('a div').hasClass('bg-key-green');
		var StyleColor = $(MyRows[i]).find('a').css('color'); // Used by personal css style.

        if (CurrentFilter == 'All')
		{
			$(MyRows[i]).css("display","table-row");
		}
		else
		{
			if (!IsGreen || StyleColor == 'rgb(255, 0, 0)')
			{
				$(MyRows[i]).css("display","none");
			}
		}
	}

	CurrentFilter = (CurrentFilter == 'All') ? 'Green' : 'All';
	$('#SCEFilter').data("green-all", CurrentFilter);
	$('#SCEFilter').text("Show "+ CurrentFilter);
}

function HideButtons()
{
	var CurrentHider = $('#HideButtons').data("hide-show");
    CurrentHider = (CurrentHider == 'Hide') ? 'Show' : 'Hide';
	$('#HideButtons').data("hide-show", CurrentHider);
	$('#HideButtons').text(CurrentHider + " Toggles");
    $('div[class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 my-0.5 items-start"]').toggle();
}
