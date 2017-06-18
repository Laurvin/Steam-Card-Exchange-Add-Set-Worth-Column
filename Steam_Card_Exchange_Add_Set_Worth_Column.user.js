// ==UserScript==
// @name Steam Card Exchange Add Set Worth Column
// @namespace Steam Card Exchange Add Set Worth Column
// @author Laurvin
// @description Adds Set Worth
// @version 2.1
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
		$('#inventory-content').find('.content-box-switch').css("display","none");
		
		$(`#${TableID} thead tr:first th:eq(2)`).text('Stock');
		$(`#${TableID} thead tr:first`).append('<th title="Set Worth">S W</th>');

		var MyRows = $(`#${TableID}`).find('tbody').find('tr');
		console.log("Rows", MyRows.length);
		for (var i = 0; i < MyRows.length; i++)
		{
			var Worth = $(MyRows[i]).find('td:eq(1)').text();
			var SetSize = $(MyRows[i]).find('td:eq(3)').text();
			var NewSetsAvail = SetSize.substring(0, SetSize.length - 7) + ')'; // Making the column smaller by removing the word Cards.
			var SetSizeStart = SetSize.indexOf('of');
			var SetSizeEnd = SetSize.indexOf(')');
			var CardsIncluded = (SetSize.indexOf('Cards') == -1) ? 0 : -5; // Need to subtract more if the word Cards is still there.
			SetSize = SetSize.substring(SetSizeStart + 3 , SetSizeEnd + CardsIncluded);
			var SetWorth = Worth*SetSize;
			$(MyRows[i]).find('td:eq(3)').text(NewSetsAvail);
			$(MyRows[i]).append('<td>'+SetWorth+'</td>');
			var GameColor = $(MyRows[i]).find('a').attr('class');
			if (TableID == 'inventorylist' && GameColor != "green")
			{
				$(MyRows[i]).css("display","none");
			}
		}

		$(`#${TableID}`).dataTable( {
			dom: 'rt<"dataTables_footer"ip>',
			"searching": false,
			"destroy": true,
			pageLength: -1,
			autoWidth: false,
			stateSave: true,
			"order": [[ 4, `${InitialSort}` ], [ 0, 'asc' ]]
		} );

		console.log("Finished Steam Card Exchange Add Set Worth Column!");
	}
	
	myVar = setTimeout(ChangeTable, 2000, TableID, InitialSort);
});
