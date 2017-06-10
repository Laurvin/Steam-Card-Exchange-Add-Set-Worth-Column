// ==UserScript==
// @name Steam Card Exchange Add Set Worth Column
// @namespace Steam Card Exchange Add Set Worth Column
// @author Laurvin
// @description Adds Set Worth
// @version 2.0
// @icon http://i.imgur.com/XYzKXzK.png
// @downloadURL https://github.com/Laurvin/Steam-Card-Exchange-Add-Set-Worth-Column/raw/master/Steam_Card_Exchange_Add_Set_Worth_Column.user.js
// @include http://www.steamcardexchange.net/index.php?userlist
// @include https://www.steamcardexchange.net/index.php?userlist
// @include http://www.steamcardexchange.net/index.php?inventory
// @include https://www.steamcardexchange.net/index.php?inventory
// @grant none
// @run-at document-idle
// ==/UserScript==

// http://www.steamcardexchange.net/api/request.php?GetWatchlist_Private
// http://www.steamcardexchange.net/api/request.php?GetInventory

$( document ).ready(function()
{
	console.log("Starting Steam Card Exchange Add Set Worth Column!");

	var TableID = (window.location.href.indexOf("userlist") > -1)? 'private_watchlist' : 'inventorylist';
	var InitialSort = (window.location.href.indexOf("userlist") > -1)? 'desc' : 'asc';

	// Setting paging to All or everything will bork.
	$(`#${TableID}`).on( 'init.dt', function ()
	{
		if ($(`#${TableID}`).DataTable().page.len() != -1)
		{
			$(`#${TableID}`).DataTable().page.len(-1).draw();
		}
	} ).dataTable();
	
	function ChangeTable(TableID, InitialSort)
	{
		$(`#${TableID} tr:first`).append('<th title="Set Worth">S W</th>');

		var MyRows = $(`#${TableID}`).find('tbody').find('tr');
		console.log("Rows", MyRows.length);
		for (var i = 0; i < MyRows.length; i++)
		{
			var Worth = $(MyRows[i]).find('td:eq(1)').text();
			var SetSize = $(MyRows[i]).find('td:eq(3)').text();
			SetSize = SetSize.substring(SetSize.length - 9, SetSize.length - 7);
			var SetWorth = Worth*SetSize;
			$(MyRows[i]).append('<td>'+SetWorth+'</td>');
		}

		$(`#${TableID}`).dataTable( {
			"searching": false,
			"destroy": true,
			pageLength: -1,
			autoWidth: false,
			stateSave: true,
			"order": [[ 4, `${InitialSort}` ], [ 0, 'asc' ]]
		} );

		console.log("Finished Steam Card Exchange Add Set Worth Column!");
	}
	
	myVar = setTimeout(ChangeTable, 2500, TableID, InitialSort);
});
