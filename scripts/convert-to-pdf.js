const fs = require('fs');
const path = require('path');

// Проверяем, установлен ли puppeteer
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.error('❌ Puppeteer не установлен. Установите его командой:');
  console.error('npm install puppeteer');
  process.exit(1);
}

// CSS стили для красивого отображения
const CSS_STYLES = `
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f8f9fa;
  }
  
  .container {
    background: white;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  h1 {
    color: #2c3e50;
    border-bottom: 3px solid #3498db;
    padding-bottom: 10px;
    margin-bottom: 30px;
  }
  
  h2 {
    color: #34495e;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 8px;
    margin-top: 40px;
    margin-bottom: 20px;
  }
  
  h3 {
    color: #7f8c8d;
    margin-top: 30px;
    margin-bottom: 15px;
  }
  
  ul {
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 8px;
  }
  
  strong {
    color: #2c3e50;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 20px 0;
  }
  
  .stat-card {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #3498db;
  }
  
  .stat-number {
    font-size: 24px;
    font-weight: bold;
    color: #3498db;
  }
  
  .stat-label {
    color: #7f8c8d;
    font-size: 14px;
    margin-top: 5px;
  }
  
  .file-tree {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.4;
  }
  
  .file-tree ul {
    list-style: none;
    padding-left: 20px;
  }
  
  .file-tree li {
    margin-bottom: 4px;
  }
  
  .directory {
    color: #2980b9;
    font-weight: bold;
  }
  
  .file {
    color: #27ae60;
  }
  
  .file-info {
    color: #7f8c8d;
    font-size: 12px;
  }
  
  .extensions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    margin: 15px 0;
  }
  
  .extension-item {
    background: #ecf0f1;
    padding: 8px 12px;
    border-radius: 4px;
    text-align: center;
  }
  
  .extension-name {
    font-weight: bold;
    color: #2c3e50;
  }
  
  .extension-count {
    color: #7f8c8d;
    font-size: 12px;
  }
  
  .largest-files {
    background: #fff3cd;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #ffc107;
  }
  
  .largest-files h3 {
    color: #856404;
    margin-top: 0;
  }
  
  .file-item {
    margin-bottom: 8px;
    padding: 8px;
    background: white;
    border-radius: 4px;
  }
  
  .file-path {
    font-weight: bold;
    color: #2c3e50;
  }
  
  .file-details {
    color: #7f8c8d;
    font-size: 12px;
  }
  
  .header-info {
    background: #e8f4fd;
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 30px;
    border-left: 4px solid #3498db;
  }
  
  .header-info em {
    color: #2980b9;
    font-style: italic;
  }
</style>
`;

// Функция для конвертации Markdown в HTML
function markdownToHtml(markdown) {
  // Простая конвертация Markdown в HTML
  let html = markdown
    // Заголовки
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Жирный текст
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Курсив
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Списки
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    
    // Переносы строк
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  // Обработка списков
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  
  // Обработка параграфов
  html = '<p>' + html + '</p>';
  html = html.replace(/<p><\/p>/g, '');
  
  return html;
}

// Функция для улучшения HTML с дополнительными стилями
function enhanceHtml(html) {
  // Добавляем специальные классы для статистики
  html = html.replace(
    /<h2>📊 Статистика проекта<\/h2>/g,
    '<h2>📊 Статистика проекта</h2><div class="stats-grid">'
  );
  
  // Обрабатываем статистические данные
  html = html.replace(
    /<li><strong>Всего файлов:<\/strong> (\d+)<\/li>/g,
    '<div class="stat-card"><div class="stat-number">$1</div><div class="stat-label">Всего файлов</div></div>'
  );
  
  html = html.replace(
    /<li><strong>Всего директорий:<\/strong> (\d+)<\/li>/g,
    '<div class="stat-card"><div class="stat-number">$1</div><div class="stat-label">Всего директорий</div></div>'
  );
  
  html = html.replace(
    /<li><strong>Общий размер:<\/strong> (.*?)<\/li>/g,
    '<div class="stat-card"><div class="stat-number">$1</div><div class="stat-label">Общий размер</div></div>'
  );
  
  html = html.replace(
    /<li><strong>Общее количество строк:<\/strong> (.*?)<\/li>/g,
    '<div class="stat-card"><div class="stat-number">$1</div><div class="stat-label">Строк кода</div></div>'
  );
  
  // Закрываем stats-grid
  html = html.replace(
    /<h3>Расширения файлов<\/h3>/g,
    '</div><h3>Расширения файлов</h3>'
  );
  
  // Обрабатываем расширения файлов
  html = html.replace(
    /<li><strong>(.*?):<\/strong> (\d+) файлов<\/li>/g,
    '<div class="extension-item"><div class="extension-name">$1</div><div class="extension-count">$2 файлов</div></div>'
  );
  
  // Добавляем класс для расширений
  html = html.replace(
    /<h3>Расширения файлов<\/h3>/g,
    '<h3>Расширения файлов</h3><div class="extensions-grid">'
  );
  
  // Закрываем extensions-grid
  html = html.replace(
    /<h3>Самые большие файлы<\/h3>/g,
    '</div><h3>Самые большие файлы</h3>'
  );
  
  // Обрабатываем самые большие файлы
  html = html.replace(
    /<h3>Самые большие файлы<\/h3>/g,
    '<div class="largest-files"><h3>Самые большие файлы</h3>'
  );
  
  html = html.replace(
    /<li><strong>(.*?)<\/strong> \((.*?), (\d+) строк\)<\/li>/g,
    '<div class="file-item"><div class="file-path">$1</div><div class="file-details">$2, $3 строк</div></div>'
  );
  
  // Закрываем largest-files
  html = html.replace(
    /<h2>📁 Структура проекта<\/h2>/g,
    '</div><h2>📁 Структура проекта</h2>'
  );
  
  // Обрабатываем структуру проекта
  html = html.replace(
    /<h2>📁 Структура проекта<\/h2>/g,
    '<h2>📁 Структура проекта</h2><div class="file-tree">'
  );
  
  // Закрываем file-tree
  html = html.replace(/<\/p>$/, '</div></p>');
  
  // Обрабатываем заголовок
  html = html.replace(
    /<h1>(.*?)<\/h1>/g,
    '<div class="header-info"><h1>$1</h1>'
  );
  
  html = html.replace(
    /<p><em>(.*?)<\/em><\/p>/g,
    '<em>$1</em></div>'
  );
  
  return html;
}

// Функция для конвертации в PDF
async function convertToPdf(inputPath, outputPath) {
  console.log('📖 Чтение Markdown файла...');
  const markdown = fs.readFileSync(inputPath, 'utf8');
  
  console.log('🔄 Конвертация в HTML...');
  let html = markdownToHtml(markdown);
  html = enhanceHtml(html);
  
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Карта кодовой базы</title>
    ${CSS_STYLES}
</head>
<body>
    <div class="container">
        ${html}
    </div>
</body>
</html>
  `;
  
  console.log('🌐 Запуск браузера...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  console.log('📄 Генерация PDF...');
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Карта кодовой базы</div>',
    footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Страница <span class="pageNumber"></span> из <span class="totalPages"></span></div>'
  });
  
  await browser.close();
  
  console.log(`✅ PDF создан: ${outputPath}`);
}

// Основная функция
async function main() {
  const inputPath = path.join(process.cwd(), 'CODEBASE-MAP.md');
  const outputPath = path.join(process.cwd(), 'CODEBASE-MAP.pdf');
  
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Файл CODEBASE-MAP.md не найден. Сначала запустите generate-codebase-map.js');
    process.exit(1);
  }
  
  try {
    await convertToPdf(inputPath, outputPath);
  } catch (error) {
    console.error('❌ Ошибка при создании PDF:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { convertToPdf }; 