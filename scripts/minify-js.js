const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const crypto = require('crypto');

const publicDir = path.join(__dirname, '..', 'public');
const jsDir = path.join(publicDir, 'js');
const distDir = path.join(publicDir, 'dist');

// Criar diretório dist se não existir
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Configuração do Terser
const terserOptions = {
  compress: {
    dead_code: true,
    drop_console: false,
    drop_debugger: true,
    keep_classnames: false,
    keep_fnames: false,
    passes: 2,
  },
  mangle: {
    toplevel: true,
  },
  format: {
    comments: false,
  },
};

// Função para gerar hash do conteúdo
function generateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Função para minificar um arquivo
async function minifyFile(filePath, outputPath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const result = await minify(code, terserOptions);
    
    if (result.code) {
      const hash = generateHash(result.code);
      const ext = path.extname(outputPath);
      const basename = path.basename(outputPath, ext);
      const hashedName = `${basename}.${hash}${ext}`;
      const hashedPath = path.join(path.dirname(outputPath), hashedName);
      
      fs.writeFileSync(hashedPath, result.code);
      console.log(`✓ Minified: ${path.basename(filePath)} -> ${hashedName}`);
      
      return { original: path.basename(outputPath), hashed: hashedName };
    }
  } catch (error) {
    console.error(`✗ Error minifying ${filePath}:`, error.message);
  }
}

// Função principal
async function minifyAllJS() {
  console.log('🚀 Starting JavaScript minification...\n');
  
  const files = fs.readdirSync(jsDir).filter(file => 
    file.endsWith('.js') && !file.endsWith('.min.js')
  );
  
  const manifest = {};
  
  for (const file of files) {
    const inputPath = path.join(jsDir, file);
    const outputPath = path.join(distDir, file.replace('.js', '.min.js'));
    const result = await minifyFile(inputPath, outputPath);
    
    if (result) {
      manifest[file] = result.hashed;
    }
  }
  
  // Salvar manifest para referência
  const manifestPath = path.join(distDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('\n✓ Manifest created:', manifestPath);
  
  console.log('\n✅ JavaScript minification completed!\n');
}

minifyAllJS().catch(console.error);