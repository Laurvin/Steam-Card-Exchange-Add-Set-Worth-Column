// ==UserScript==
// @name Steam Card Exchange Add Set Worth Column
// @namespace Steam Card Exchange Add Set Worth Column
// @author Laurvin
// @description Adds Set Worth
// @version 1.1
// @icon http://i.imgur.com/XYzKXzK.png
// @downloadURL https://github.com/Laurvin/Steam-Card-Exchange-Add-Set-Worth-Column/raw/master/Steam_Card_Exchange_Add_Set_Worth_Column.user.js
// @include http://www.steamcardexchange.net/index.php?userlist
// @include https://www.steamcardexchange.net/index.php?userlist
// @include http://www.steamcardexchange.net/index.php?inventory
// @include https://www.steamcardexchange.net/index.php?inventory
// @grant none
// @run-at document-idle
// ==/UserScript==

$( document ).ready(function()
	{
	console.log("Starting Steam Card Exchange Add Set Worth Column!");
	$("#inventorylist tr:first").append('<th>Set Worth</th>');

	var MyRows = $('#inventorylist').find('tbody').find('tr');

	for (var i = 0; i < MyRows.length; i++)
	{
		var Worth = $(MyRows[i]).find('td:eq(1)').text();
		Worth = Worth.substring(0, Worth.length - 1);
		var SetSize = $(MyRows[i]).find('td:eq(3)').text();
		SetSize = SetSize.substring(SetSize.length - 9, SetSize.length - 7);
		var SetWorth = Worth*SetSize;
		$(MyRows[i]).append('<td>'+SetWorth+'</td>');
	}

	if (window.location.href == "http://www.steamcardexchange.net/index.php?userlist")
	{
		var initOptions =
		{
			widgets: ["zebra"],
			sortList: [[4,1]]
		};
	}
	else
	{
		var initOptions =
		{
			widgets: ["zebra"],
			sortList: [[4,0]]
		};		
	}

	$("#inventorylist").trigger("destroy");
	$("#inventorylist").tablesorter(initOptions);
	console.log("Finished Steam Card Exchange Add Set Worth Column!");
});
