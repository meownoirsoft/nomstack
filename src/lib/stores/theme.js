import { writable } from 'svelte/store';

// Available theme colors
export const availableThemes = [
  { name: 'Purple', value: 'purple', color: '#8b5cf6' },
  { name: 'Blue', value: 'blue', color: '#3b82f6' },
  { name: 'Green', value: 'green', color: '#10b981' },
  { name: 'Red', value: 'red', color: '#ef4444' },
  { name: 'Orange', value: 'orange', color: '#f97316' },
  { name: 'Pink', value: 'pink', color: '#ec4899' },
  { name: 'Indigo', value: 'indigo', color: '#6366f1' },
  { name: 'Cyan', value: 'cyan', color: '#06b6d4' }
];

// Default theme
const defaultTheme = 'purple';

// Load theme from localStorage or use default
function loadTheme() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('nomstack-theme');
    if (saved && availableThemes.find(t => t.value === saved)) {
      return saved;
    }
  }
  return defaultTheme;
}

// Create the theme store
export const currentTheme = writable(loadTheme());

// Get appropriate background color for each theme
function getAppBackgroundColor(themeValue) {
  const backgroundColors = {
    purple: '#f3f0ff',   // Light purple
    blue: '#f0f8ff',     // Light blue
    green: '#f0fff4',    // Light green (not blue-tinted)
    red: '#fff5f5',      // Light red
    orange: '#fffaf0',   // Light orange
    pink: '#fdf2f8',     // Light pink
    indigo: '#f0f4ff',   // Light indigo
    cyan: '#ecfeff'      // Light cyan
  };
  return backgroundColors[themeValue] || '#ffffff';
}

// Update CSS custom properties when theme changes
export function updateTheme(themeValue) {
  const theme = availableThemes.find(t => t.value === themeValue);
  if (theme) {
    console.log('Updating theme to:', theme.name, theme.color);
    
      // Update CSS custom properties
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--primary', theme.color);
        document.documentElement.style.setProperty('--primary-focus', adjustBrightness(theme.color, -20));
        
        // Set appropriate text colors based on theme
        if (themeValue === 'dark') {
          document.documentElement.style.setProperty('--primary-content', '#ffffff');
          document.documentElement.style.setProperty('--text-primary', '#ffffff');
          document.documentElement.style.setProperty('--text-secondary', '#d1d5db');
          document.documentElement.style.setProperty('--text-muted', '#9ca3af');
          document.documentElement.classList.add('dark-theme');
        } else {
          document.documentElement.style.setProperty('--primary-content', '#ffffff');
          document.documentElement.style.setProperty('--text-primary', theme.color);
          document.documentElement.style.setProperty('--text-secondary', hexToRgba(theme.color, 0.7));
          document.documentElement.style.setProperty('--text-muted', hexToRgba(theme.color, 0.6));
          document.documentElement.classList.remove('dark-theme');
        }
      
      // Update secondary colors based on theme (much lighter versions)
      const lightSecondary = adjustBrightness(theme.color, 90);
      const darkSecondary = adjustBrightness(theme.color, 85);
      document.documentElement.style.setProperty('--secondary', lightSecondary);
      document.documentElement.style.setProperty('--secondary-dark', darkSecondary);
      
      // Create app background color (custom light versions for each theme)
      const appBackground = getAppBackgroundColor(theme.value);
      document.documentElement.style.setProperty('--app-background', appBackground);
      
      // Create opacity variants
      document.documentElement.style.setProperty('--primary-70', hexToRgba(theme.color, 0.7));
      document.documentElement.style.setProperty('--primary-60', hexToRgba(theme.color, 0.6));
      document.documentElement.style.setProperty('--primary-50', hexToRgba(theme.color, 0.5));
      document.documentElement.style.setProperty('--primary-40', hexToRgba(theme.color, 0.4));
      document.documentElement.style.setProperty('--primary-30', hexToRgba(theme.color, 0.3));
      document.documentElement.style.setProperty('--primary-20', hexToRgba(theme.color, 0.2));
      document.documentElement.style.setProperty('--primary-10', hexToRgba(theme.color, 0.1));
      document.documentElement.style.setProperty('--primary-5', hexToRgba(theme.color, 0.05));
      
      // Override DaisyUI's CSS custom properties
      document.documentElement.style.setProperty('--p', theme.color);
      document.documentElement.style.setProperty('--pc', '#ffffff');
      document.documentElement.style.setProperty('--pf', adjustBrightness(theme.color, -20));
      
      console.log('CSS properties updated:', {
        primary: theme.color,
        primaryFocus: adjustBrightness(theme.color, -20),
        secondary: lightSecondary,
        secondaryDark: darkSecondary,
        appBackground: appBackground,
        daisyUI: {
          p: theme.color,
          pc: '#ffffff',
          pf: adjustBrightness(theme.color, -20)
        }
      });
      
             // Force update any existing checkboxes and add checkmarks
             setTimeout(() => {
               const checkboxes = document.querySelectorAll('input[type="checkbox"]');
               checkboxes.forEach(checkbox => {
                 // Remove any existing checkmark
                 const existingCheckmark = checkbox.parentNode.querySelector('.custom-checkmark');
                 if (existingCheckmark) {
                   existingCheckmark.remove();
                 }
                 
                 if (checkbox.checked) {
                   checkbox.style.setProperty('background-color', theme.color, 'important');
                   checkbox.style.setProperty('background', theme.color, 'important');
                   
                   // Add checkmark icon
                   const checkmark = document.createElement('div');
                   checkmark.className = 'custom-checkmark';
                   checkmark.innerHTML = `
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;">
                       <path d="M20 6L9 17l-5-5"></path>
                     </svg>
                   `;
                   checkmark.style.cssText = `
                     position: absolute;
                     top: 0;
                     left: 0;
                     width: 100%;
                     height: 100%;
                     pointer-events: none;
                     z-index: 1;
                   `;
                   
                   // Make sure checkbox parent is positioned
                   const parent = checkbox.parentNode;
                   if (getComputedStyle(parent).position === 'static') {
                     parent.style.position = 'relative';
                   }
                   
                   parent.appendChild(checkmark);
                 }
               });
               
               // Add event listeners for future checkbox changes
               checkboxes.forEach(checkbox => {
                 checkbox.addEventListener('change', function() {
                   const existingCheckmark = this.parentNode.querySelector('.custom-checkmark');
                   if (existingCheckmark) {
                     existingCheckmark.remove();
                   }
                   
                   if (this.checked) {
                     this.style.setProperty('background-color', theme.color, 'important');
                     this.style.setProperty('background', theme.color, 'important');
                     
                     const checkmark = document.createElement('div');
                     checkmark.className = 'custom-checkmark';
                     checkmark.innerHTML = `
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;">
                         <path d="M20 6L9 17l-5-5"></path>
                       </svg>
                     `;
                     checkmark.style.cssText = `
                       position: absolute;
                       top: 0;
                       left: 0;
                       width: 100%;
                       height: 100%;
                       pointer-events: none;
                       z-index: 1;
                     `;
                     
                     const parent = this.parentNode;
                     if (getComputedStyle(parent).position === 'static') {
                       parent.style.position = 'relative';
                     }
                     
                     parent.appendChild(checkmark);
                   } else {
                     this.style.setProperty('background-color', 'transparent', 'important');
                     this.style.setProperty('background', 'transparent', 'important');
                   }
                 });
               });
             }, 100);
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('nomstack-theme', themeValue);
    }
    
    // Update store
    currentTheme.set(themeValue);
  }
}

// Helper function to adjust color brightness
function adjustBrightness(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Helper function to convert hex to rgba
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  updateTheme(loadTheme());
}
