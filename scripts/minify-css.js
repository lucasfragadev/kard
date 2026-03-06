const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const cssnano = require('cssnano');
const crypto = require('crypto');

const publicDir = path.join(__dirname, '..', 'public');
const cssDir = path.join(publicDir, 'css');
const distDir = path.join(publicDir, 'dist');

// Criar diretório dist se não existir
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Função para gerar hash do conteúdo
function generateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Função para minificar CSS
async function minifyCSS(inputPath, outputPath) {
  try {
    const css = fs.readFileSync(inputPath, 'utf8');
    
    const result = await postcss([
      cssnano({
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          colormin: true,
          minifyFontValues: true,
          minifySelectors: true,
        }]
      })
    ]).process(css, { from: inputPath, to: outputPath });
    
    const hash = generateHash(result.css);
    const ext = path.extname(outputPath);
    const basename = path.basename(outputPath, ext);
    const hashedName = `${basename}.${hash}${ext}`;
    const hashedPath = path.join(path.dirname(outputPath), hashedName);
    
    fs.writeFileSync(hashedPath, result.css);
    console.log(`✓ Minified: ${path.basename(inputPath)} -> ${hashedName}`);
    
    return { original: path.basename(outputPath), hashed: hashedName };
  } catch (error) {
    console.error(`✗ Error minifying ${inputPath}:`, error.message);
  }
}

// Função principal
async function minifyAllCSS() {
  console.log('🚀 Starting CSS minification...\n');
  
  const files = fs.readdirSync(cssDir).filter(file => 
    file.endsWith('.css') && !file.endsWith('.min.css')
  );
  
  const manifest = {};
  
  for (const file of files) {
    const inputPath = path.join(cssDir, file);
    const outputPath = path.join(distDir, file.replace('.css', '.min.css'));
    const result = await minifyCSS(inputPath, outputPath);
    
    if (result) {
      manifest[file] = result.hashed;
    }
  }
  
  // Salvar manifest
  const manifestPath = path.join(distDir, 'css-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('\n✓ CSS Manifest created:', manifestPath);
  
  console.log('\n✅ CSS minification completed!\n');
}

minifyAllCSS().catch(console.error);