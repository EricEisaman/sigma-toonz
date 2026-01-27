// PWA Support for Sigma Toonz v1.00

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

// Check if the app is already installed or running as a PWA
function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone || // for iOS
         document.referrer.includes('android-app://');
}

// Install prompt
let deferredPrompt;
const installButton = document.createElement('button');
installButton.classList.add('install-button');
installButton.innerHTML = '<i class="fas fa-download"></i> Install App';
installButton.style.display = 'none';

document.addEventListener('DOMContentLoaded', () => {
  // Add install button to the header
  const header = document.querySelector('header');
  if (header) {
    header.appendChild(installButton);
  }

  // Handle installation process
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      
      // Clear the deferred prompt variable
      deferredPrompt = null;
      
      // Hide the install button
      installButton.style.display = 'none';
    }
  });

  // Check if already running as PWA
  if (isPWA()) {
    console.log('Running as installed PWA');
    document.body.classList.add('pwa-mode');
  }

  // Handle actions from PWA shortcuts
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'manageFolders') {
    // Open folder manager when launched with the shortcut
    setTimeout(() => {
      if (typeof folderManager !== 'undefined') {
        folderManager.openFolderManager();
      }
    }, 1000);
  }
});

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 76+ from automatically showing the prompt
  e.preventDefault();
  
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Update UI to notify the user they can install the PWA
  installButton.style.display = 'block';
});

// Listen for app installed event
window.addEventListener('appinstalled', (evt) => {
  console.log('Sigma Toonz was installed');
  installButton.style.display = 'none';
});

// Add styles for the install button
const style = document.createElement('style');
style.textContent = `
  .install-button {
    position: absolute;
    top: 25px;
    right: 80px;
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #5ec9ed;
    color: #222;
    border: none;
    border-radius: 25px;
    padding: 8px 15px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    width: auto;
    margin: 0;
    z-index: 10;
  }
  
  @media (max-width: 768px) {
    .install-button {
      right: 70px;
      padding: 6px 10px;
      font-size: 12px;
    }
  }
  
  .pwa-mode .menu-toggle {
    visibility: hidden;
  }
`;
document.head.appendChild(style); 