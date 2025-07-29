const fs = require('fs');
const path = require('path');

// Игнорируемые директории и файлы
const IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'coverage',
  'logs',
  '.cursor',
  '.qodo',
  'uploads'
];

const IGNORE_FILES = [
  '.gitignore',
  'package-lock.json',
  'tsconfig.build.tsbuildinfo',
  'tsconfig.tsbuildinfo',
  '*.map',
  '*.d.ts'
];

// Функция для проверки, нужно ли игнорировать файл/директорию
function shouldIgnore(name) {
  if (IGNORE_DIRS.includes(name)) return true;
  if (IGNORE_FILES.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(name);
    }
    return pattern === name;
  })) return true;
  return false;
}

// Функция для получения размера файла
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

// Функция для подсчета строк в файле
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

// Функция для анализа файла
function analyzeFile(filePath, relativePath) {
  const ext = path.extname(filePath);
  const size = getFileSize(filePath);
  const lines = countLines(filePath);
  
  return {
    path: relativePath,
    extension: ext,
    size: size,
    lines: lines,
    sizeFormatted: formatBytes(size)
  };
}

// Функция для форматирования размера файла
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Функция для рекурсивного обхода директории
function scanDirectory(dirPath, relativePath = '') {
  const items = [];
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      if (shouldIgnore(file)) continue;
      
      const fullPath = path.join(dirPath, file);
      const itemRelativePath = relativePath ? path.join(relativePath, file) : file;
      
      if (fs.statSync(fullPath).isDirectory()) {
        const subItems = scanDirectory(fullPath, itemRelativePath);
        if (subItems.length > 0) {
          items.push({
            type: 'directory',
            name: file,
            path: itemRelativePath,
            items: subItems
          });
        }
      } else {
        items.push({
          type: 'file',
          ...analyzeFile(fullPath, itemRelativePath)
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
  
  return items.sort((a, b) => {
    // Сначала директории, потом файлы
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

// Функция для генерации статистики
function generateStats(items) {
  const stats = {
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    totalLines: 0,
    extensions: {},
    largestFiles: []
  };
  
  function processItems(items) {
    for (const item of items) {
      if (item.type === 'directory') {
        stats.totalDirectories++;
        if (item.items) {
          processItems(item.items);
        }
      } else {
        stats.totalFiles++;
        stats.totalSize += item.size;
        stats.totalLines += item.lines;
        
        if (item.extension) {
          stats.extensions[item.extension] = (stats.extensions[item.extension] || 0) + 1;
        }
        
        stats.largestFiles.push({
          path: item.path,
          size: item.size,
          sizeFormatted: item.sizeFormatted,
          lines: item.lines
        });
      }
    }
  }
  
  processItems(items);
  
  // Сортируем файлы по размеру
  stats.largestFiles.sort((a, b) => b.size - a.size);
  stats.largestFiles = stats.largestFiles.slice(0, 10); // Топ 10 самых больших файлов
  
  return stats;
}

// Функция для генерации Markdown
function generateMarkdown(items, stats, projectName) {
  let markdown = `# Карта кодовой базы: ${projectName}\n\n`;
  markdown += `*Сгенерировано: ${new Date().toLocaleString('ru-RU')}*\n\n`;
  
  // Статистика
  markdown += `## 📊 Статистика проекта\n\n`;
  markdown += `- **Всего файлов:** ${stats.totalFiles}\n`;
  markdown += `- **Всего директорий:** ${stats.totalDirectories}\n`;
  markdown += `- **Общий размер:** ${formatBytes(stats.totalSize)}\n`;
  markdown += `- **Общее количество строк:** ${stats.totalLines.toLocaleString()}\n\n`;
  
  // Расширения файлов
  markdown += `### Расширения файлов\n\n`;
  const sortedExtensions = Object.entries(stats.extensions)
    .sort(([,a], [,b]) => b - a);
  
  for (const [ext, count] of sortedExtensions) {
    markdown += `- **${ext}:** ${count} файлов\n`;
  }
  markdown += `\n`;
  
  // Самые большие файлы
  markdown += `### Самые большие файлы\n\n`;
  for (const file of stats.largestFiles) {
    markdown += `- **${file.path}** (${file.sizeFormatted}, ${file.lines} строк)\n`;
  }
  markdown += `\n`;
  
  // Структура проекта
  markdown += `## 📁 Структура проекта\n\n`;
  
  function generateTree(items, level = 0) {
    let tree = '';
    const indent = '  '.repeat(level);
    
    for (const item of items) {
      if (item.type === 'directory') {
        tree += `${indent}- 📁 **${item.name}/**\n`;
        if (item.items && item.items.length > 0) {
          tree += generateTree(item.items, level + 1);
        }
      } else {
        const icon = getFileIcon(item.extension);
        tree += `${indent}- ${icon} **${item.name}** (${item.sizeFormatted}, ${item.lines} строк)\n`;
      }
    }
    
    return tree;
  }
  
  markdown += generateTree(items);
  
  return markdown;
}

// Функция для получения иконки файла
function getFileIcon(extension) {
  const icons = {
    '.ts': '🔷',
    '.js': '🟡',
    '.json': '📄',
    '.md': '📝',
    '.html': '🌐',
    '.css': '🎨',
    '.scss': '🎨',
    '.sass': '🎨',
    '.less': '🎨',
    '.xml': '📋',
    '.yml': '⚙️',
    '.yaml': '⚙️',
    '.env': '🔧',
    '.txt': '📄',
    '.log': '📋',
    '.sql': '🗄️',
    '.sh': '🐚',
    '.ps1': '💻',
    '.bat': '💻',
    '.cmd': '💻'
  };
  
  return icons[extension] || '📄';
}

// Основная функция
function main() {
  const projectRoot = process.cwd();
  const projectName = path.basename(projectRoot);
  
  console.log('🔍 Сканирование кодовой базы...');
  const items = scanDirectory(projectRoot);
  
  console.log('📊 Генерация статистики...');
  const stats = generateStats(items);
  
  console.log('📝 Создание Markdown...');
  const markdown = generateMarkdown(items, stats, projectName);
  
  const outputPath = path.join(projectRoot, 'CODEBASE-MAP.md');
  fs.writeFileSync(outputPath, markdown, 'utf8');
  
  console.log(`✅ Карта кодовой базы создана: ${outputPath}`);
  console.log(`📊 Статистика:`);
  console.log(`   - Файлов: ${stats.totalFiles}`);
  console.log(`   - Директорий: ${stats.totalDirectories}`);
  console.log(`   - Общий размер: ${formatBytes(stats.totalSize)}`);
  console.log(`   - Строк кода: ${stats.totalLines.toLocaleString()}`);
}

if (require.main === module) {
  main();
}

module.exports = { generateMarkdown, scanDirectory, generateStats }; 