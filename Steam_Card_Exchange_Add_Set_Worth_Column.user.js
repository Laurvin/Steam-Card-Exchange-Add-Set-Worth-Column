// ==UserScript==
// @name Steam Card Exchange Add Set Worth Column
// @namespace Steam Card Exchange Add Set Worth Column
// @author Laurvin
// @description Adds Set Worth
// @version 3.3
// @icon http://i.imgur.com/XYzKXzK.png
// @downloadURL https://github.com/Laurvin/Steam-Card-Exchange-Add-Set-Worth-Column/raw/master/Steam_Card_Exchange_Add_Set_Worth_Column.user.js
// @include http://www.steamcardexchange.net/index.php?userlist
// @include https://www.steamcardexchange.net/index.php?userlist
// @include http://www.steamcardexchange.net/index.php?inventory
// @include https://www.steamcardexchange.net/index.php?inventory
// @grant GM_xmlhttpRequest
// @run-at document-idle
// ==/UserScript==

/* globals jQuery, $ */

var AppsOwned = {};
var AddSetWorth = "";
var TableID = (window.location.href.indexOf("userlist") > -1)? 'private_watchlist' : 'inventorylist';
var InitialSort = (window.location.href.indexOf("userlist") > -1)? 'desc' : 'asc';
var FilterButtonValue = (window.location.href.indexOf("userlist") > -1)? 'Green' : 'All';
var FilterButtonText = (window.location.href.indexOf("userlist") > -1)? 'Show Only Green' : 'Show All';

$( document ).ready(function()
{
	init();
});

function init()
{
	console.log("Starting Steam Card Exchange Add Set Worth Column!");

	$('h1.empty').append('<button class="button-blue" id="SCEFilter" value="' + FilterButtonValue + '" style="margin-top: 25px;">' + FilterButtonText + '</button>');
	$('#SCEFilter').click(function()
	{
		FilterTable(TableID);
	});

	if (TableID == "inventorylist")
	{
		$('h1.empty').append('<button class="button-blue" id="BoosterCalc" style="margin-top: 25px;">Calculate Boosterpack Values</button>');
		$('#BoosterCalc').click(function()
		{
			$('#BoosterCalc').text('Loading...');
			$('h1.empty').append('<a href="http://steamcommunity.com/tradingcards/boostercreator/" class="button-blue" id="BoosterLink" style="margin-top: 25px;" target="_blank">To Booster Creator</a>');
			loadBoosterPage('http://store.steampowered.com/dynamicstore/userdata/');
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

	// We can't divine when the full table is on the page via .on() so we just wait two seconds before calling ChangeTable.
	AddSetWorth = setTimeout(ChangeTable, 2000, TableID, InitialSort, 'no');
}

function monkeyRequest(url) {
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

function loadBoosterPage(url) {
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
	$('#inventory-content').find('.content-box-switch').css("display","none");

	var SortedColumn = 4;

	if (BoosterCalc == "yes")
	{
		SortedColumn = 5;
		InitialSort = 'desc';
		$(`#${TableID} thead tr:first`).append('<th title="Booster Value">B V</th>');
	}
	else
	{
		$(`#${TableID} thead tr:first th:eq(2)`).text('Stock');

        if (TableID == "inventorylist")
        {
            $(`#${TableID} thead tr:first th:eq(4)`).text('Set Worth');
        } else {
            $(`#${TableID} thead tr:first th:eq(3)`).text('Available');
            $(`#${TableID} thead tr:first`).append('<th title="Set Worth">S W</th>');
        }
	}

	var MyRows = $(`#${TableID}`).find('tbody').find('tr');
	console.log("Rows", MyRows.length);
	for (var i = 0; i < MyRows.length; i++)
	{
		var Worth = $(MyRows[i]).find('td:eq(1)').text();
		var SetSize = $(MyRows[i]).find('td:eq(3)').text();

        if (TableID == "private_watchlist")
        {
            var NewSetsAvail = SetSize.substring(3, SetSize.length - 7) + ')'; // Making the column smaller by removing the word Cards.
            var SetSizeStart = SetSize.indexOf('of');
            var SetSizeEnd = SetSize.indexOf(')');
            var CardsIncluded = (SetSize.indexOf('Cards') == -1) ? 0 : -5; // Need to subtract more if the word Cards is still there.
            SetSize = SetSize.substring(SetSizeStart + 3 , SetSizeEnd + CardsIncluded);
        }

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
			$(MyRows[i]).find('td:eq(3)').text(NewSetsAvail);

            if (TableID == "inventorylist")
            {
                $(MyRows[i]).find('td:eq(4)').text(SetWorth);
            } else {
                $(MyRows[i]).append('<td>'+SetWorth+'</td>');
            }

            var GameColor = $(MyRows[i]).find('a').attr('class');
			var StyleColor = $(MyRows[i]).find('a').css('color'); // Used by personal Stylish style.
			if (TableID == 'inventorylist' && (GameColor != "green" || StyleColor == 'rgb(255, 0, 0)'))
			{
				$(MyRows[i]).css("display","none");
			}
		}
	}

	$(`#${TableID}`).dataTable( {
		dom: 'rt<"dataTables_footer"ip>',
		"searching": false,
		"destroy": true,
		pageLength: -1,
		autoWidth: false,
		stateSave: true,
		"order": [[ SortedColumn, InitialSort ], [ 0, 'asc' ]]
	} );

	console.log("Finished Steam Card Exchange Add Set Worth Column!");
}

function FilterTable(TableID)
{
	var CurrentFilter = $('#SCEFilter').val();
	var MyRows = $(`#${TableID}`).find('tbody').find('tr');
	for (var i = 0; i < MyRows.length; i++)
	{
		var GameColor = $(MyRows[i]).find('a').attr('class');
		var StyleColor = $(MyRows[i]).find('a').css('color');

		if (CurrentFilter == 'All')
		{
			$(MyRows[i]).css("display","table-row");
		}
		else
		{
			if (GameColor != 'green' || StyleColor == 'rgb(255, 0, 0)')
			{
				$(MyRows[i]).css("display","none");
			}
		}
	}

	var FilterText = (CurrentFilter == 'All') ? 'Show Only Green' : 'Show All';
	CurrentFilter = (CurrentFilter == 'All') ? 'Green' : 'All';
	$('#SCEFilter').val(CurrentFilter);
	$('#SCEFilter').text(FilterText);
}
