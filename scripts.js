/* ----------------------- */
/* ------GOOGLE INIT------ */
/* ----------------------- */

const CLIENT_ID = '783982757730-g8jhuuoi9i5jfgqsa8kd8s2t1co0ssbq.apps.googleusercontent.com';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '',
  });
  gisInited = true;
}

function handleAuthClick(folderId) {
  tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        throw (resp);
      }

      // set parentfolder as root if nothing set
      if ( localStorage.getItem("parentfolder") == "" || localStorage.getItem("parentfolder") == null ) {
        localStorage.setItem("parentfolder", "root");
        folderId = "root";
      }

      // Load contents regardless of loaded state
      getContents(folderId, "initial");
      
      // Show the current folder display
      showCurrentFolderInfo(folderId);

      // set user email and URL
      gapi.client.drive.about.get({
        'fields' : "user",
      }).then(function(response) {
        window.location.hash = '#~' + response.result.user.permissionId;
        localStorage.setItem("email", response.result.user.emailAddress);
      });      
  };
  
  if ( gapi.client.getToken() === null ) {
    tokenClient.requestAccessToken({prompt: '', login_hint: localStorage.getItem("email")});
  } else {
    tokenClient.requestAccessToken({prompt: '', login_hint: localStorage.getItem("email")});
  }

  // use to see token
  //console.log( gapi.client.getToken() );
}

function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      // can use this to simulate expired token
      gapi.client.setToken('');
  }
}

/* ----------------------- */
/* -------DRIVE API------- */
/* ----------------------- */

function changeImgSrc(detailsId, newSrc) {
  var detailsElement = document.getElementById(detailsId);
  if (detailsElement) {
    var summaryElement = detailsElement.querySelector('summary');
    var imgElement = summaryElement.querySelector('img');
    if (imgElement) {
      imgElement.src = newSrc;
    }
  }
}

function getArts() {
  var albumartquery = "mimeType contains 'image/' and trashed = false and name contains 'folder.jpg' ";
  gapi.client.drive.files.list({
    'pageSize': 1000,
    'q' : albumartquery,
    'fields': "nextPageToken, files(id, name, webContentLink, parents)"
  }).then(function(response) {
    if (response.result.files && response.result.files.length > 0) {
      //console.log(response);
      for (var i = 0; i < response.result.files.length; i++) {
        changeImgSrc(response.result.files[i].parents[0], response.result.files[i].webContentLink);
      }
    }
  });
}

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

    // Clear the contents div when switching folders
    const contentsDiv = document.getElementById("contents");
    contentsDiv.innerHTML = '';
    contentsDiv.classList.remove("loaded");
    
    var files = response.result.files;
    if (files && files.length > 0) {

      // loop folders
      for (var i = 0; i < files.length; i++) {
        var file = files[i];

        if ( file.mimeType.includes("application/vnd.google-apps.folder") ) {
          contentsDiv.innerHTML += `
          <details id="${file.id}">
            <summary onclick="getContents('${file.id}')"><img src=""/><span>${file.name}</span></summary>
          </details>
          `;
        }
      }

      //getArts();

      // loop files
      for (var i = 0; i < files.length; i++) {
        var file = files[i];

        if ( file.mimeType.includes("audio") ) {
          contentsDiv.innerHTML += `
          <button class="track" onclick="playTrack('${file.id}', this)"><i class="fas fa-play"></i> ${file.name}</button>
          `;
        }
      }

      // Mark as loaded after all content is added
      contentsDiv.classList.add("loaded");

    } else {
      contentsDiv.innerHTML = '<p>No files found in this folder.</p>'; 
    }

    if (contentsDiv.firstElementChild) {
      contentsDiv.firstElementChild.focus();
    }
  }).catch(function(error) {
    if (error.status === 401) {
      alert("Sessions are only valid for 1 hour. Session will refresh automatically.");
      tokenClient.requestAccessToken({prompt: '', login_hint: localStorage.getItem("email")});
    } 
  });
}

/* ----------------------- */
/* ------USER FOLDER------ */
/* ----------------------- */

function submitFolderId(e) {
  e.preventDefault();
  const folderId = document.getElementById('parentfolder').value.trim();
  
  if (!folderId) {
    alert('Please enter a Google Drive folder ID');
    return;
  }
  
  // Store the folder ID in localStorage for compatibility with existing code
  localStorage.setItem("parentfolder", folderId);
  
  // Try to get folder info from Drive to save it
  saveCurrentFolder(folderId);
  
  // Proceed with authentication and loading
  handleAuthClick(folderId);
}

// Save the current folder to IndexedDB if not already saved
async function saveCurrentFolder(folderId) {
  try {
    // Check if folder already exists in the database
    const existingFolder = await sigmaToonzDB.getFolderByDriveId(folderId);
    if (existingFolder) {
      // Update current folder display
      showCurrentFolderInfo(folderId, existingFolder.name);
      return;
    }
    
    // Get folder info from Drive API
    gapi.client.drive.files.get({
      'fileId': folderId,
      'fields': 'name'
    }).then(function(response) {
      const folderName = response.result.name || folderId;
      
      // Save to IndexedDB
      sigmaToonzDB.addFolder({
        folderId: folderId,
        name: folderName,
        tags: []
      }).then(() => {
        console.log('Folder saved to database');
        showCurrentFolderInfo(folderId, folderName);
      }).catch(err => {
        // Ignore if it's a duplicate error
        if (err.message !== 'This folder has already been saved') {
          console.error('Error saving folder:', err);
        }
      });
    }).catch(function(error) {
      console.error('Error fetching folder info:', error);
      // If we can't get the folder name, just save with the ID as name
      if (folderId !== 'root') {
        sigmaToonzDB.addFolder({
          folderId: folderId,
          name: folderId,
          tags: []
        }).catch(err => {
          // Ignore if it's a duplicate error
          if (err.message !== 'This folder has already been saved') {
            console.error('Error saving folder:', err);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error in saveCurrentFolder:', error);
  }
}

// Show current folder info in the UI
function showCurrentFolderInfo(folderId, folderName) {
  const currentFolderDisplay = document.getElementById('current-folder-display');
  const currentFolderName = document.getElementById('current-folder-name');
  
  if (currentFolderDisplay && currentFolderName) {
    currentFolderDisplay.style.display = 'flex';
    
    if (folderName) {
      currentFolderName.textContent = folderName;
    } else if (folderId === 'root') {
      currentFolderName.textContent = 'Root Folder';
    } else {
      // Try to get the name from the database
      sigmaToonzDB.getFolderByDriveId(folderId).then(folder => {
        if (folder) {
          currentFolderName.textContent = folder.name;
        } else {
          currentFolderName.textContent = folderId;
        }
      }).catch(() => {
        currentFolderName.textContent = folderId;
      });
    }
  }
}

function getFolderId() {
  const savedFolderId = localStorage.getItem("parentfolder");
  document.getElementById('parentfolder').value = savedFolderId || '';
  
  // Check if we have a saved folder ID and we're not showing a loading UI yet
  if (savedFolderId && !document.getElementById("contents").classList.contains("loaded")) {
    // Show the folder info if available
    showCurrentFolderInfo(savedFolderId);
  }
}

/* ----------------------- */
/* ---------AUDIO--------- */
/* ----------------------- */

audio = document.getElementById('audio');
source = document.getElementById('source');
if ( document.getElementsByClassName("playing")[0] ) {
  playing = document.getElementsByClassName("playing")[0];
} else {
  playing = false;
}

function playTrack(id, element, type) {
  // remove spinner if load in progress
  if ( document.getElementById("spinner") ) {
    document.getElementById("spinner").remove();
  }

  // check if clicked track is already 'playing'
  if ( element == playing ) {
    if ( audio.paused ) {
      audio.play();
    } else {
      audio.pause();
    }
    return;
  }

  // check for something already 'playing'
  if ( playing ) {
    resetIconToPlay();
    playing.classList.remove("playing");
  }

  // set new track
  element.classList.add("playing");
  playing = document.getElementsByClassName("playing")[0];
  audio.pause();
  source.src = "";
  audio.load();

  spinner = `
    <div id="spinner">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  `;
  playing.innerHTML += spinner;

  // user track
  gapi.client.drive.files.get({
    'fileId' : id,
    'alt': 'media',
  }).then(function(response) {
    dataArr = Uint8Array.from(response.body.split('').map((chr) => chr.charCodeAt(0)));
    file = new File([dataArr], 'audiofilename', { type: response.headers['Content-Type'] });
    source.src = URL.createObjectURL(file);
    source.type = response.headers['Content-Type'];
    audio.load();
    audio.oncanplay = audio.play();
    if ( document.getElementById("spinner") ) {
      document.getElementById("spinner").remove();
    }
  }).catch(function(error) {
    if (error.status === 401) {
      alert("Sessions are only valid for 1 hour. Session will refresh automatically.");
      tokenClient.requestAccessToken({prompt: '', login_hint: localStorage.getItem("email")});
    } 
  });
}

function prevTrack() {
  if ( audio.currentTime > 3 || !playing.previousElementSibling.previousElementSibling ) {
    audio.currentTime = 0;
    audio.play();
  } else if ( playing.previousElementSibling.previousElementSibling ) {
    resetIconToPlay();
    playing.previousElementSibling.click();
  }
}

function nextTrack() {
  if ( playing.nextElementSibling ) {
    resetIconToPlay();
    playing.nextElementSibling.click();
  }
}

function resetIconToPlay() {
  playing.firstChild.classList.remove("fa-pause");
  playing.firstChild.classList.add("fa-play");
  if ( document.getElementById("bars") ) {
    document.getElementById("bars").remove();
  } 
}

function resetIconToPause() {
  playing.firstChild.classList.remove("fa-play");
  playing.firstChild.classList.add("fa-pause");
  indicator = `
    <div id="bars">
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
    </div>
  `;
  playing.innerHTML += indicator;
}

audio.onended = function() {
  if ( playing.nextElementSibling ) {
    playing.nextElementSibling.focus();
  }
  nextTrack();
};

audio.onpause = function() {
  resetIconToPlay();
}
audio.onplay = function() {
  resetIconToPause();
}

/* ----------------------- */
/* -------PAGE LOAD------- */
/* ----------------------- */

document.getElementById('intro').style.display = 'block';

function changeFolder() {
  // show intro with parentfolder form
  document.getElementById('intro').style.display = 'block';
  document.getElementById('parentfolder').focus();
  // reset contents div
  document.getElementById("contents").classList.remove("loaded");
  document.getElementById("contents").innerHTML = "";
  // hide current folder display
  document.getElementById("current-folder-display").style.display = 'none';
  // reset localstorage
  localStorage.removeItem("email");
}

/* ----------------------- */
/* ----------MENU--------- */
/* ----------------------- */

const menuButton = document.getElementById('menu-btn');
const menu = document.getElementById('menu');

menuButton.addEventListener('click', function() {
  const expanded = this.getAttribute('aria-expanded') === 'true' || false;
  this.setAttribute('aria-expanded', !expanded);
  menu.hidden = !menu.hidden;
});

document.documentElement.addEventListener('click', function(event) {
  if (menu.hidden) return;
  const isClickInsideMenu = menu.contains(event.target);
  const isClickInsideMenuButton = menuButton.contains(event.target);
  if (!isClickInsideMenu && !isClickInsideMenuButton) {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
  }
});

// Initialize app after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize folder manager
  if (folderManager) {
    folderManager.loadTagFilters();
  }
  
  // If we have a saved folder ID, attempt to show it
  const savedFolderId = localStorage.getItem("parentfolder");
  if (savedFolderId) {
    showCurrentFolderInfo(savedFolderId);
  }
});

/* ----------------------- */
/* ----------MENU--------- */
/* ----------------------- */

/*
<audio id="audio2" controls style="display: none;">
  <source id="source2" src="" type="audio/mpeg">
  Your browser does not support the audio element.
</audio>
*/

/*
audio2 = document.getElementById('audio2');

function lastSecond() {
    if ( audio.currentTime > audio.duration - .2572 ) {
      audio2.play();
      audio.removeEventListener("timeupdate", lastSecond);
    }
  }
  
function lastTenSeconds() {
    if ( audio.currentTime > audio.duration - 10 ) {
        audio.removeEventListener("timeupdate", lastTenSeconds);
        gapi.client.drive.files.get({
        'fileId' : "1UcOF2cYttKyfKcNbwFzWVKDbcGov-rMn",
        'alt': 'media',
        }).then(function(response) {
            dataArr = Uint8Array.from(response.body.split('').map((chr) => chr.charCodeAt(0)));
            file = new File([dataArr], 'audiofilename', { type: response.headers['Content-Type'] });
            source2.src = URL.createObjectURL(file);
            audio2.load();
        });
        //[audio, audio2] = [audio2, audio];
    }
}

audio.addEventListener("timeupdate", lastTenSeconds);
audio.addEventListener("timeupdate", lastSecond);
*/

