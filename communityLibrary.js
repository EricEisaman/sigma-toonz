// Community Library for Sigma Toonz

class CommunityLibrary {
  constructor() {
    // Initial community folders - hard coded for now
    this.communityFolders = [
      {
        id: '1q9a1oInU7kbqraACMzV_vae3Ie4qw2OS',
        name: 'Waterfall',
        description: 'A collection of Sigma Toonz inspired by the Waterfall project.',
        tags: ['rap', 'nature', 'community', 'sigma scholars']
      },
      {
        id: '1kiHv3lP6b60ZL7l6PoRGahK7Aeyf6Yb_',
        name: 'Sigma Scholars Classical',
        description: 'Classical music compilation.',
        tags: ['classical', 'sigma scholars', 'community']
      },
      {
        id: '1DAW0SUAKYsPXPCi-28g4c_kpeRmNexI6',
        name: 'Peppa',
        description: 'Peppa at da window.',
        tags: ['window', 'sigma scholars', 'community']
      },
      {
        id: '1f0h9NHLDAMbJrnyY8hiO-THdlGzojid0',
        name: 'Chica',
        description: 'Chica at da window.',
        tags: ['window', 'sigma scholars', 'community']
      },
      {
        id: '1JuAUtI9qoEwDpsW1g3HUCBR9CicyA-yr',
        name: 'Elmo',
        description: 'Elmo at da window.',
        tags: ['window', 'sigma scholars', 'community']
      },
      {
        id: '1iL9UxeBDUUE1WndNO-8YP-RN0XSH2UpO',
        name: 'Monsters Inc',
        description: 'Sulley and Mike at da window.',
        tags: ['window', 'sigma scholars', 'community']
      },
      {
        id: '1Q_835Xw37gq4GxN-YzsBbZIojzWH2Op5',
        name: 'Fredy Fazbear',
        description: 'Freddy at da window.',
        tags: ['window', 'sigma scholars', 'community']
      },
      {
        id: '18EGclnwjYSOMODe0H-ALGLwqgYXu24o2',
        name: 'Plushy Bounce',
        description: 'Chill Hiphop.',
        tags: ['hiphop', 'sigma scholars', 'community']
      },
      {
        id: '1o1TFFR6YbwDFXIjwpVm1DHpEofTc9t3J',
        name: 'Big Sig Crush Da Skib',
        description: 'Competetive learning.',
        tags: ['sigma scholars', 'community']
      },
      {
        id: '1aI0lHvYLDjbUoru9oz5Ws1L8VRnX3Hco',
        name: 'Doo-wop',
        description: 'Sock hoppin.',
        tags: ['sigma scholars', 'community']
      },
      {
        id: '1mprU6ic-pagAAmirSgHtAGcnzX7aBlXf',
        name: 'Saucy Sigs',
        description: 'Thumpin.',
        tags: ['sigma scholars', 'community']
      },
      {
        id: '1o6qt4yth692ReP0Tq9t4aHvwubWlRusR',
        name: 'Mount Sigma',
        description: 'Country.',
        tags: ['sigma scholars', 'community']
      },
      {
        id: '1s01ytEhirOBuFLTjCjlIwgPj2IXagC9j',
        name: 'Boss Battle',
        description: 'Skib Bustin.',
        tags: ['sigma scholars', 'community']
      },
      {
        id: '1HJwFuS38QYY4mCMCwGHmMg986r-_Kbtu',
        name: 'It Starts with Math',
        description: 'Rising Together.',
        tags: ['sigma scholars', 'community']
      },
      {
        id: '12SNeimgmMEdHA8ix45uKTlp2p2q-cRcv',
        name: 'Lil Siggy in Da City',
        description: 'Country gal goes sigma.',
        tags: ['sigma scholars', 'community']
      },
      {
        id: '1MvZyev8Tc8uZddmpeP-UZbhctnCyyzcO',
        name: 'Sigma Scholar Pants',
        description: 'New Pop.',
        tags: ['sigma scholars', 'community']
      },
      {
        id: '1VGPcB2-L5psCFluIzdY95MJCx43RMer2',
        name: 'We thank the Mids and Skibs',
        description: 'Country.',
        tags: ['sigma scholars', 'community']
      },
      {
        id: '1XDSTqVL2ylweu1J_HLgNcw4seyhg6f0-',
        name: 'Moose Juice Party',
        description: 'Bouncy.',
        tags: ['sigma scholars', 'community']
      },
      {
        id: '1hEDZieB-jc2HD8j07Vz-DtfXVmEbJF5J',
        name: 'SIGMATOPIA',
        description: 'Mix it up!',
        tags: ['sigma scholars', 'community']
      },
      {
        id: '1Bwh7BPfxdG0fl0Jgvejmput3001yJsmb',
        name: 'Heart Warming',
        description: 'Love and Peace',
        tags: ['sigma scholars', 'community']
      },
      {
        id: '1APpe9Hv5CEIs4pQrLW4YcA57FVb_xDv3',
        name: 'Sigma Scholars Pathway',
        description: 'A collection of Sigma Toonz inspired by the Sigma Scholars Pathway project.',
        tags: ['rap', 'sigma scholars', 'community']
      },
      {
        id: '1b3wtCCqjSExDotilcSlXRdWgrXa0p_bO',
        name: 'Trail Vibes',
        description: 'Sigma Scholar Toonz wit dat Trail Vibe.',
        tags: ['nature', 'sigma scholars', 'community']
      },
      {
        id: '1pEaSkdI6TcrdjJx8VaWX_q7CQpuzBpfp',
        name: 'Meadow Munchies',
        description: 'A collection of Sigma Toonz inspired by Nature.',
        tags: ['nature', 'sigma scholars', 'community']
      },
      {
        id: '19gVvLwgfrWbnkolrKPwHBz_zv2CV6TBH',
        name: 'Ski Lake',
        description: 'A collection of Sigma Toonz inspired by lake water sports.',
        tags: ['nature', 'sigma scholars', 'community']
      },
      {
        id: '1mWj536qxqfH_okE2yeeiIuUD9JZ7N3vJ',
        name: 'Chill Hop Instrumentals',
        description: 'Sigma Scholar Instrumentals wit dat Chill Hop Vibe.',
        tags: ['chill', 'sigma scholars', 'community', 'lofi']
      },
      {
        id: '1hLsS_6HIkg9kK7Lux3I4MMR_sjtUbe2m',
        name: 'Meadow Dancing',
        description: 'Sigma Scholar Instrumentals wit dat dancin vibe.',
        tags: ['dance', 'sigma scholars', 'community', 'lofi']
      },
      {
        id: '1ON4laMBkMR1YqOFOlLD_GiDaD2M6iiTv',
        name: 'Say What',
        description: 'Promoting good listeners.',
        tags: ['service', 'sigma scholars', 'community', 'lofi', 'jazz']
      },
    ];
    
    this.initEventListeners();
  }

  // Initialize event listeners
  initEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      // Show/hide community library button in folder manager
      const communityLibBtn = document.getElementById('community-lib-btn');
      if (communityLibBtn) {
        communityLibBtn.addEventListener('click', this.toggleCommunityLibrarySection.bind(this));
      }
      
      // Add event listeners to top-level community library buttons
      document.querySelectorAll('.community-library-btn, .browse-community-btn').forEach(button => {
        button.addEventListener('click', this.openCommunityLibrary.bind(this));
      });
    });
  }

  // Toggle the community library section visibility
  toggleCommunityLibrarySection() {
    const communitySection = document.getElementById('community-library-section');
    if (communitySection) {
      communitySection.classList.toggle('active');
      
      // Update button text
      const communityLibBtn = document.getElementById('community-lib-btn');
      if (communityLibBtn) {
        if (communitySection.classList.contains('active')) {
          communityLibBtn.innerHTML = '<i class="fas fa-times"></i> Hide Community Library';
          this.renderCommunityFolders();
        } else {
          communityLibBtn.innerHTML = '<i class="fas fa-book"></i> Browse Community Library';
        }
      }
    }
  }

  // Render the community folders in the UI
  renderCommunityFolders() {
    const communityFoldersContainer = document.getElementById('community-folders');
    if (!communityFoldersContainer) return;
    
    communityFoldersContainer.innerHTML = '';
    
    this.communityFolders.forEach(folder => {
      const folderElement = document.createElement('div');
      folderElement.className = 'community-folder';
      
      // Create the HTML for the folder
      folderElement.innerHTML = `
        <div class="folder-header">
          <h3 class="folder-name">${folder.name}</h3>
        </div>
        <div class="folder-description">${folder.description}</div>
        <div class="folder-id">${folder.id}</div>
        <div class="folder-tags">
          ${folder.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <button class="add-community-folder-btn" data-folder-id="${folder.id}" data-folder-name="${folder.name}">
          <i class="fas fa-plus"></i> Add to My Folders
        </button>
      `;
      
      communityFoldersContainer.appendChild(folderElement);
    });
    
    // Add event listeners to the Add buttons
    document.querySelectorAll('.add-community-folder-btn').forEach(button => {
      button.addEventListener('click', this.addCommunityFolder.bind(this));
    });
  }

  // Add a community folder to the user's folders
  async addCommunityFolder(event) {
    const button = event.currentTarget;
    const folderId = button.dataset.folderId;
    const folderName = button.dataset.folderName;
    
    try {
      // Check if folder already exists in the database
      const existingFolder = await sigmaToonzDB.getFolderByDriveId(folderId);
      if (existingFolder) {
        alert('This folder is already in your collection!');
        return;
      }
      
      // Get the community folder details
      const communityFolder = this.communityFolders.find(folder => folder.id === folderId);
      if (!communityFolder) {
        alert('Error: Folder information not found');
        return;
      }
      
      // Save to IndexedDB
      await sigmaToonzDB.addFolder({
        folderId: folderId,
        name: folderName,
        tags: communityFolder.tags
      });
      
      // Show success message
      button.innerHTML = '<i class="fas fa-check"></i> Added to My Folders';
      button.disabled = true;
      
      // Update the folders list if folder manager is open
      if (folderManager) {
        folderManager.loadFolders();
      }
      
      // Reset button after 2 seconds
      setTimeout(() => {
        button.innerHTML = '<i class="fas fa-plus"></i> Add to My Folders';
        button.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error('Error adding community folder:', error);
      alert('An error occurred while adding the folder');
    }
  }

  // Open the folder manager and community library section
  openCommunityLibrary() {
    // First, open the folder manager
    if (folderManager) {
      folderManager.openFolderManager();
      
      // Then, after a short delay to ensure the folder manager is open
      setTimeout(() => {
        const communitySection = document.getElementById('community-library-section');
        if (communitySection) {
          communitySection.classList.add('active');
          
          // Update button text
          const communityLibBtn = document.getElementById('community-lib-btn');
          if (communityLibBtn) {
            communityLibBtn.innerHTML = '<i class="fas fa-times"></i> Hide Community Library';
          }
          
          // Render the community folders
          this.renderCommunityFolders();
        }
      }, 100);
    }
  }
}

// Initialize the community library
const communityLibrary = new CommunityLibrary(); 
