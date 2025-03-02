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
        id: '1APpe9Hv5CEIs4pQrLW4YcA57FVb_xDv3',
        name: 'Sigma Scholars Pathway',
        description: 'A collection of Sigma Toonz inspired by the Sigma Scholars Pathway project.',
        tags: ['rap', 'sigma scholars', 'community']
      }
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