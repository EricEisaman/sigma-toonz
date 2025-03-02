// IndexedDB Database for Sigma Toonz

class SigmaToonzDB {
  constructor() {
    this.dbName = 'SigmaToonzDB';
    this.dbVersion = 1;
    this.db = null;
    this.initDB();
  }

  // Initialize the database
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Error opening database:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create folders store
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id', autoIncrement: true });
          folderStore.createIndex('folderId', 'folderId', { unique: true });
          folderStore.createIndex('name', 'name', { unique: false });
          folderStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          folderStore.createIndex('dateAdded', 'dateAdded', { unique: false });
        }

        // Create tags store
        if (!db.objectStoreNames.contains('tags')) {
          const tagStore = db.createObjectStore('tags', { keyPath: 'id', autoIncrement: true });
          tagStore.createIndex('name', 'name', { unique: true });
        }
      };
    });
  }

  // Add a new folder
  async addFolder(folderData) {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['folders'], 'readwrite');
        const store = transaction.objectStore('folders');
        
        // Add dateAdded property
        folderData.dateAdded = new Date();
        
        const request = store.add(folderData);
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          // Check if it's a duplicate folderId error
          if (event.target.error.name === 'ConstraintError') {
            reject(new Error('This folder has already been saved'));
          } else {
            reject(event.target.error);
          }
        };
        
        transaction.oncomplete = () => {
          console.log('Folder added successfully');
        };
      });
    } catch (error) {
      console.error('Error adding folder:', error);
      throw error;
    }
  }

  // Update folder
  async updateFolder(id, folderData) {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['folders'], 'readwrite');
        const store = transaction.objectStore('folders');
        
        const getRequest = store.get(id);
        
        getRequest.onsuccess = (event) => {
          const folder = event.target.result;
          if (!folder) {
            reject(new Error('Folder not found'));
            return;
          }
          
          // Update folder properties
          const updatedFolder = { ...folder, ...folderData };
          
          const updateRequest = store.put(updatedFolder);
          
          updateRequest.onsuccess = () => {
            resolve(updatedFolder);
          };
          
          updateRequest.onerror = (event) => {
            reject(event.target.error);
          };
        };
        
        getRequest.onerror = (event) => {
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    }
  }

  // Delete folder
  async deleteFolder(id) {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['folders'], 'readwrite');
        const store = transaction.objectStore('folders');
        
        const request = store.delete(id);
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  // Get all folders
  async getAllFolders() {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['folders'], 'readonly');
        const store = transaction.objectStore('folders');
        
        const request = store.getAll();
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error getting all folders:', error);
      throw error;
    }
  }

  // Get folder by ID
  async getFolderById(id) {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['folders'], 'readonly');
        const store = transaction.objectStore('folders');
        
        const request = store.get(id);
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error getting folder by ID:', error);
      throw error;
    }
  }

  // Get folder by Google Drive Folder ID
  async getFolderByDriveId(folderId) {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['folders'], 'readonly');
        const store = transaction.objectStore('folders');
        const index = store.index('folderId');
        
        const request = index.get(folderId);
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error getting folder by Drive ID:', error);
      throw error;
    }
  }

  // Search folders
  async searchFolders(query) {
    try {
      const allFolders = await this.getAllFolders();
      
      if (!query) return allFolders;
      
      query = query.toLowerCase();
      
      return allFolders.filter(folder => {
        // Search in name
        if (folder.name && folder.name.toLowerCase().includes(query)) return true;
        
        // Search in tags
        if (folder.tags && folder.tags.some(tag => tag.toLowerCase().includes(query))) return true;
        
        // Search in folder ID
        if (folder.folderId && folder.folderId.toLowerCase().includes(query)) return true;
        
        return false;
      });
    } catch (error) {
      console.error('Error searching folders:', error);
      throw error;
    }
  }

  // Search folders by tag
  async searchFoldersByTag(tag) {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['folders'], 'readonly');
        const store = transaction.objectStore('folders');
        const index = store.index('tags');
        
        const request = index.getAll(tag);
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error searching folders by tag:', error);
      throw error;
    }
  }

  // Add a new tag
  async addTag(tagName) {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['tags'], 'readwrite');
        const store = transaction.objectStore('tags');
        
        const request = store.add({ name: tagName });
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          // Check if it's a duplicate tag error
          if (event.target.error.name === 'ConstraintError') {
            reject(new Error('This tag already exists'));
          } else {
            reject(event.target.error);
          }
        };
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  }

  // Get all tags
  async getAllTags() {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['tags'], 'readonly');
        const store = transaction.objectStore('tags');
        
        const request = store.getAll();
        
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
        
        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error getting all tags:', error);
      throw error;
    }
  }

  // Delete tag
  async deleteTag(id) {
    try {
      await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['tags'], 'readwrite');
        const store = transaction.objectStore('tags');
        
        const request = store.delete(id);
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = (event) => {
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const sigmaToonzDB = new SigmaToonzDB(); 