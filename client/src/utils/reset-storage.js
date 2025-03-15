/**
 * Reset local storage and reload the page.
 * Run this in the browser console when testing gets stuck:
 * 
 * 1. Open Developer Tools (F12 or Ctrl+Shift+I)
 * 2. Copy and paste this entire function
 * 3. Run: resetSpheneStorage()
 */
function resetSpheneStorage() {
    localStorage.removeItem('sphene_user_id');
    console.log('Cleared Sphene user ID from local storage');
    console.log('Reloading page...');
    window.location.reload();
}

// Export the function so it can be imported in development
export { resetSpheneStorage };
