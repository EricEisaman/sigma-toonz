
/*
var mylist = $('#track-list');
var listitems = mylist.children('button').get();
listitems.sort(function(a, b) {
  return $(a).text().toUpperCase().localeCompare($(b).text().toUpperCase());
})
$.each(listitems, function(idx, itm) { mylist.append(itm); });

// highlight current track, if available
var currentTrackId = $('source').attr("data-track-id");
$(".track[data-track-id='" + currentTrackId + "']").addClass('track-active');
*/

function getContents(id, type) {
  var contentsQuery = "'" + id + "'" + " in parents and trashed = false ";
  gapi.client.drive.files.list({
    'pageSize': 1000,
    'q' : contentsQuery,
    'orderBy': 'name',
    'fields': "nextPageToken, files(id, name, mimeType, webContentLink)"
  }).then(function(response) {

    // hide intro
    document.getElementById('intro').style.display = 'none';

    // set location
    if ( type == "initial" ) {
      var location = "contents";
    } else {
      var location = id;

      // check for previous load
      if ( document.getElementById(location).classList.contains("loaded") ) {
        return;
      }
    }
    
    var files = response.result.files;
    if (files && files.length > 0) {

      for (var i = 0; i < files.length; i++) {
        var file = files[i];

        if ( file.mimeType.includes("application/vnd.google-apps.folder") ) {
          document.getElementById(location).innerHTML += `
          <details id="${file.id}">
            <summary onclick="getContents('${file.id}')">${file.name}</summary>
          </details>
          `;
        }

        if ( file.mimeType.includes("audio") ) {
          document.getElementById(location).innerHTML += `
          <a class="track" data-track-src="${file.webContentLink}">${file.name}</a>
          `;
        }

        document.getElementById(location).classList.add("loaded");
        
      }
    } else {
      alert('No files found.'); 
    }
  });
}


