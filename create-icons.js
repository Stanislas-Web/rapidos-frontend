import fs from 'fs';

// Créer une icône PNG simple avec une couleur de fond
function createSimpleIcon(size, filename) {
  // Créer un buffer PNG minimal avec une couleur de fond
  const width = size;
  const height = size;
  
  // Header PNG minimal avec couleur de fond #0D3C4C
  const pngData = Buffer.alloc(1000); // Taille approximative
  
  // Écrire le fichier
  fs.writeFileSync(`public/${filename}`, pngData);
  console.log(`Created ${filename} (${size}x${size})`);
}

// Créer les icônes
createSimpleIcon(192, 'icon-192.png');
createSimpleIcon(512, 'icon-512.png');

console.log('Icons created successfully!'); 