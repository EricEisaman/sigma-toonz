// Folder Manager for Sigma Toonz

class FolderManager {
  constructor() {
    this.selectedFolderId = null;
    this.currentTags = [];
    this.initEventListeners();
  }

  // Initialize event listeners for the folder manager UI
  initEventListeners() {
    // These will be set up when the DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
      // Folder search
      const folderSearchInput = document.getElementById('folder-search');
      if (folderSearchInput) {
        folderSearchInput.addEventListener('input', this.handleFolderSearch.bind(this));
      }

      // Tag filter buttons will be attached by the renderTagFilters method

      // Add new folder button
      const addFolderBtn = document.getElementById('add-folder-btn');
      if (addFolderBtn) {
        addFolderBtn.addEventListener('click', this.openAddFolderModal.bind(this));
      }

      // Save folder form
      const saveFolderForm = document.getElementById('save-folder-form');
      if (saveFolderForm) {
        saveFolderForm.addEventListener('submit', this.handleSaveFolder.bind(this));
      }

      // Add tag input
      const addTagBtn = document.getElementById('add-tag-btn');
      if (addTagBtn) {
        addTagBtn.addEventListener('click', this.addTag.bind(this));
      }

      // Tag input keypress
      const tagInput = document.getElementById('tag-input');
      if (tagInput) {
        tagInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.addTag();
          }
        });
      }
    });
  }

  // Open modal to add a new folder
  openAddFolderModal() {
    document.getElementById('folder-modal-title').textContent = 'Add New Folder';
    document.getElementById('folder-id').value = '';
    document.getElementById('folder-name').value = '';
    
    // Clear existing tags
    this.currentTags = [];
    this.renderTagsInModal();
    
    // Show the modal
    document.getElementById('folder-modal').classList.add('active');
    document.getElementById('folder-id').focus();
  }

  // Open modal to edit an existing folder
  async openEditFolderModal(folderId) {
    try {
      const folder = await sigmaToonzDB.getFolderById(folderId);
      if (!folder) {
        console.error('Folder not found');
        return;
      }
      
      document.getElementById('folder-modal-title').textContent = 'Edit Folder';
      document.getElementById('folder-id').value = folder.folderId;
      document.getElementById('folder-name').value = folder.name || '';
      document.getElementById('folder-db-id').value = folder.id;
      
      // Set current tags
      this.currentTags = folder.tags || [];
      this.renderTagsInModal();
      
      // Show the modal
      document.getElementById('folder-modal').classList.add('active');
      document.getElementById('folder-name').focus();
    } catch (error) {
      console.error('Error opening edit folder modal:', error);
      alert('An error occurred while loading the folder information');
    }
  }

  // Close the folder modal
  closeFolderModal() {
    document.getElementById('folder-modal').classList.remove('active');
    document.getElementById('folder-id').value = '';
    document.getElementById('folder-name').value = '';
    document.getElementById('folder-db-id').value = '';
    this.currentTags = [];
    this.renderTagsInModal();
  }

  // Handle saving a folder (add or update)
  async handleSaveFolder(event) {
    event.preventDefault();
    
    const folderId = document.getElementById('folder-id').value.trim();
    const folderName = document.getElementById('folder-name').value.trim();
    const folderDbId = document.getElementById('folder-db-id').value;
    
    if (!folderId) {
      alert('Please enter a Google Drive folder ID');
      return;
    }
    
    try {
      // Create folder data object
      const folderData = {
        folderId: folderId,
        name: folderName || folderId, // Use ID as name if name not provided
        tags: this.currentTags
      };
      
      // Check if we're updating or adding
      if (folderDbId) {
        await sigmaToonzDB.updateFolder(parseInt(folderDbId), folderData);
        alert('Folder updated successfully');
      } else {
        await sigmaToonzDB.addFolder(folderData);
        alert('Folder added successfully');
      }
      
      // Close the modal and refresh the folder list
      this.closeFolderModal();
      this.loadFolders();
    } catch (error) {
      console.error('Error saving folder:', error);
      alert(error.message || 'An error occurred while saving the folder');
    }
  }

  // Add a tag to the current folder being edited
  addTag() {
    const tagInput = document.getElementById('tag-input');
    const tagText = tagInput.value.trim();
    
    if (!tagText) return;
    
    // Don't add duplicate tags
    if (!this.currentTags.includes(tagText)) {
      this.currentTags.push(tagText);
      this.renderTagsInModal();
      
      // Try to save the tag in the database for future use
      sigmaToonzDB.addTag(tagText).catch(err => {
        // Ignore duplicate tag errors, they're expected if tag already exists
        if (err.message !== 'This tag already exists') {
          console.error('Error adding tag to database:', err);
        }
      });
    }
    
    tagInput.value = '';
    tagInput.focus();
  }

  // Remove a tag from the current folder being edited
  removeTag(tagText) {
    this.currentTags = this.currentTags.filter(tag => tag !== tagText);
    this.renderTagsInModal();
  }

  // Render the current tags in the modal
  renderTagsInModal() {
    const tagsContainer = document.getElementById('folder-tags');
    tagsContainer.innerHTML = '';
    
    this.currentTags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.innerHTML = `${tag} <button type="button" class="remove-tag-btn">&times;</button>`;
      
      tagElement.querySelector('.remove-tag-btn').addEventListener('click', () => {
        this.removeTag(tag);
      });
      
      tagsContainer.appendChild(tagElement);
    });
  }

  // Load and render all saved folders
  async loadFolders(query = '') {
    try {
      let folders;
      
      if (query) {
        folders = await sigmaToonzDB.searchFolders(query);
      } else {
        folders = await sigmaToonzDB.getAllFolders();
      }
      
      const folderListElement = document.getElementById('saved-folders');
      folderListElement.innerHTML = '';
      
      if (folders.length === 0) {
        folderListElement.innerHTML = '<p class="no-folders">No saved folders found. Add a folder to get started.</p>';
        return;
      }
      
      // Sort folders by date added (newest first)
      folders.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      
      folders.forEach(folder => {
        const folderElement = document.createElement('div');
        folderElement.className = 'saved-folder';
        folderElement.dataset.id = folder.id;
        folderElement.dataset.folderId = folder.folderId;
        
        // Create the HTML for the folder
        folderElement.innerHTML = `
          <div class="folder-header">
            <h3 class="folder-name">${folder.name}</h3>
            <div class="folder-actions">
              <button class="edit-folder-btn" aria-label="Edit folder">
                <i class="fas fa-edit"></i>
              </button>
              <button class="delete-folder-btn" aria-label="Delete folder">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="folder-id">${folder.folderId}</div>
          <div class="folder-tags">
            ${(folder.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <button class="select-folder-btn">Select Folder</button>
        `;
        
        // Add event listeners
        folderElement.querySelector('.edit-folder-btn').addEventListener('click', () => {
          this.openEditFolderModal(folder.id);
        });
        
        folderElement.querySelector('.delete-folder-btn').addEventListener('click', () => {
          this.deleteFolder(folder.id);
        });
        
        folderElement.querySelector('.select-folder-btn').addEventListener('click', () => {
          this.selectFolder(folder.folderId, folder.name);
        });
        
        folderListElement.appendChild(folderElement);
      });
    } catch (error) {
      console.error('Error loading folders:', error);
      document.getElementById('saved-folders').innerHTML = 
        '<p class="error">An error occurred while loading folders. Please try again.</p>';
    }
  }

  // Delete a folder
  async deleteFolder(id) {
    if (!confirm('Are you sure you want to delete this folder? This action cannot be undone.')) {
      return;
    }
    
    try {
      await sigmaToonzDB.deleteFolder(id);
      this.loadFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('An error occurred while deleting the folder');
    }
  }

  // Select a folder and load its contents
  selectFolder(folderId, folderName) {
    this.selectedFolderId = folderId;
    
    // Store the folder ID in localStorage for compatibility with existing code
    localStorage.setItem("parentfolder", folderId);
    
    // Update folder name display if available
    const folderNameDisplay = document.getElementById('current-folder-name');
    if (folderNameDisplay) {
      folderNameDisplay.textContent = folderName || folderId;
    }
    
    // Close the folder manager if it's in a modal
    const folderManager = document.getElementById('folder-manager-modal');
    if (folderManager) {
      folderManager.classList.remove('active');
    }
    
    // Load folder contents using the existing function
    handleAuthClick(folderId);
  }

  // Handle folder search
  async handleFolderSearch(event) {
    const query = event.target.value.trim();
    this.loadFolders(query);
  }

  // Load and render tag filters
  async loadTagFilters() {
    try {
      // Get unique tags from all folders
      const folders = await sigmaToonzDB.getAllFolders();
      const tagSet = new Set();
      
      folders.forEach(folder => {
        if (folder.tags && Array.isArray(folder.tags)) {
          folder.tags.forEach(tag => tagSet.add(tag));
        }
      });
      
      const tags = Array.from(tagSet).sort();
      
      const tagFilterContainer = document.getElementById('tag-filters');
      tagFilterContainer.innerHTML = '';
      
      if (tags.length === 0) {
        tagFilterContainer.innerHTML = '<p>No tags found</p>';
        return;
      }
      
      // Add "All" filter
      const allFilter = document.createElement('button');
      allFilter.className = 'tag-filter active';
      allFilter.textContent = 'All';
      allFilter.addEventListener('click', () => {
        this.setActiveTagFilter(allFilter);
        this.loadFolders();
      });
      tagFilterContainer.appendChild(allFilter);
      
      // Add each tag as a filter
      tags.forEach(tag => {
        const tagFilter = document.createElement('button');
        tagFilter.className = 'tag-filter';
        tagFilter.textContent = tag;
        tagFilter.addEventListener('click', () => {
          this.setActiveTagFilter(tagFilter);
          this.filterFoldersByTag(tag);
        });
        tagFilterContainer.appendChild(tagFilter);
      });
    } catch (error) {
      console.error('Error loading tag filters:', error);
    }
  }

  // Set the active tag filter
  setActiveTagFilter(activeElement) {
    const tagFilters = document.querySelectorAll('.tag-filter');
    tagFilters.forEach(filter => {
      filter.classList.remove('active');
    });
    activeElement.classList.add('active');
  }

  // Filter folders by tag
  async filterFoldersByTag(tag) {
    try {
      const folders = await sigmaToonzDB.searchFoldersByTag(tag);
      
      const folderListElement = document.getElementById('saved-folders');
      folderListElement.innerHTML = '';
      
      if (folders.length === 0) {
        folderListElement.innerHTML = '<p class="no-folders">No folders found with this tag.</p>';
        return;
      }
      
      // Sort folders by date added (newest first)
      folders.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      
      // Render folders (reuse the same rendering logic)
      folders.forEach(folder => {
        const folderElement = document.createElement('div');
        folderElement.className = 'saved-folder';
        folderElement.dataset.id = folder.id;
        folderElement.dataset.folderId = folder.folderId;
        
        // Create the HTML for the folder
        folderElement.innerHTML = `
          <div class="folder-header">
            <h3 class="folder-name">${folder.name}</h3>
            <div class="folder-actions">
              <button class="edit-folder-btn" aria-label="Edit folder">
                <i class="fas fa-edit"></i>
              </button>
              <button class="delete-folder-btn" aria-label="Delete folder">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="folder-id">${folder.folderId}</div>
          <div class="folder-tags">
            ${(folder.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <button class="select-folder-btn">Select Folder</button>
        `;
        
        // Add event listeners
        folderElement.querySelector('.edit-folder-btn').addEventListener('click', () => {
          this.openEditFolderModal(folder.id);
        });
        
        folderElement.querySelector('.delete-folder-btn').addEventListener('click', () => {
          this.deleteFolder(folder.id);
        });
        
        folderElement.querySelector('.select-folder-btn').addEventListener('click', () => {
          this.selectFolder(folder.folderId, folder.name);
        });
        
        folderListElement.appendChild(folderElement);
      });
    } catch (error) {
      console.error('Error filtering folders by tag:', error);
    }
  }

  // Open folder manager modal
  openFolderManager() {
    const folderManager = document.getElementById('folder-manager-modal');
    folderManager.classList.add('active');
    
    // Load folders and tag filters
    this.loadFolders();
    this.loadTagFilters();
  }

  // Close folder manager modal
  closeFolderManager() {
    const folderManager = document.getElementById('folder-manager-modal');
    folderManager.classList.remove('active');
  }
}

// Create and export a singleton instance
const folderManager = new FolderManager(); 