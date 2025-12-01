#!/usr/bin/env node
/**
 * Скрипт сборки данных из MD-файлов в JSON
 * Запуск: node app/scripts/build-data.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUTPUT = path.join(__dirname, '..', 'public', 'data.json');

// Маппинг ID направлений на папки технологий
const DIRECTION_FOLDERS = {
  'D00': 'культура-производства',
  'D01': 'демонтаж',
  'D02': 'электрика',
  'D03': 'слаботочка',
  'D04': 'сантехника',
  'D05': 'климат',
  'D06': 'монтаж',
  'D07': 'изоляция',
  'D08': 'подготовка-стен',
  'D09': 'штукатурка',
  'D10': 'покраска',
  'D11': 'обои',
  'D12': 'плитка',
  'D13': 'полы-черновые',
  'D14': 'полы-чистовые',
  'D15': 'окна',
  'D16': 'двери-межкомнатные',
  'D17': 'двери-входные',
  'D18': 'фасад'
};

// Информация о направлениях
const DIRECTIONS_INFO = {
  'D00': { name: 'Культура производства', block: 'Системное', stages: ['черновая', 'чистовая'] },
  'D01': { name: 'Демонтаж', block: 'Подготовка', stages: ['черновая'] },
  'D02': { name: 'Электрика', block: 'Коммуникации', stages: ['черновая', 'чистовая'] },
  'D03': { name: 'Слаботочка', block: 'Коммуникации', stages: ['черновая', 'чистовая'] },
  'D04': { name: 'Сантехника', block: 'Коммуникации', stages: ['черновая', 'чистовая'] },
  'D05': { name: 'Климат', block: 'Коммуникации', stages: ['черновая', 'чистовая'] },
  'D06': { name: 'Монтаж', block: 'Конструктив', stages: ['черновая', 'чистовая'] },
  'D07': { name: 'Изоляция', block: 'Конструктив', stages: ['черновая'] },
  'D08': { name: 'Подготовка стен', block: 'Отделка', stages: ['черновая'] },
  'D09': { name: 'Штукатурка', block: 'Отделка', stages: ['черновая'] },
  'D10': { name: 'Покраска', block: 'Отделка', stages: ['чистовая'] },
  'D11': { name: 'Обои', block: 'Отделка', stages: ['чистовая'] },
  'D12': { name: 'Плитка', block: 'Отделка', stages: ['чистовая'] },
  'D13': { name: 'Полы черновые', block: 'Полы', stages: ['черновая'] },
  'D14': { name: 'Полы чистовые', block: 'Полы', stages: ['чистовая'] },
  'D15': { name: 'Окна', block: 'Двери/Окна', stages: ['чистовая'] },
  'D16': { name: 'Двери межкомнатные', block: 'Двери/Окна', stages: ['чистовая'] },
  'D17': { name: 'Двери входные', block: 'Двери/Окна', stages: ['чистовая'] },
  'D18': { name: 'Фасад', block: 'Фасад', stages: ['черновая', 'чистовая'] }
};

// Связи между направлениями (что ПЕРЕД чем)
const DEPENDENCIES = {
  'D01': [],
  'D02': ['D01'],
  'D03': ['D01'],
  'D04': ['D01'],
  'D05': ['D01', 'D02'],
  'D06': ['D02', 'D03'],
  'D07': ['D02', 'D03', 'D04', 'D05', 'D06'],
  'D08': ['D06', 'D07'],
  'D09': ['D08'],
  'D10': ['D09'],
  'D11': ['D09'],
  'D12': ['D07', 'D09', 'D13'],
  'D13': ['D02', 'D04', 'D07'],
  'D14': ['D10', 'D11', 'D12'],
  'D15': ['D14'],
  'D16': ['D14'],
  'D17': ['D14'],
  'D18': ['D06', 'D07']
};

/**
 * Парсит YAML frontmatter из MD-файла
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result = {};

  yaml.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Убираем кавычки
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  });

  return result;
}

/**
 * Извлекает описание из MD-файла (первый параграф после заголовка)
 */
function extractDescription(content) {
  const match = content.match(/^#[^#].*\n\n>\s*(.+)/m);
  return match ? match[1] : '';
}

/**
 * Извлекает тело контента (без frontmatter)
 */
function extractContent(content) {
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  return withoutFrontmatter.trim();
}

/**
 * Извлекает связанные технологии из таблицы
 */
function extractRelatedTechnologies(content) {
  const related = [];
  const tableMatch = content.match(/## Связанные технологии[\s\S]*?\|[^\n]+\|[^\n]+\|[\s\S]*?(?=\n---|\n## |$)/);

  if (tableMatch) {
    const rows = tableMatch[0].split('\n').filter(line => line.startsWith('|') && !line.includes('---'));
    rows.slice(2).forEach(row => { // Пропускаем заголовок и разделитель
      const cells = row.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 2) {
        const techMatch = cells[0].match(/T-[A-Z]{2}-\d+/);
        if (techMatch) {
          related.push({
            id: techMatch[0],
            name: cells[0].replace(techMatch[0], '').trim(),
            reason: cells[1] || ''
          });
        }
      }
    });
  }
  return related;
}

/**
 * Извлекает разделы из контента
 */
function extractSections(content) {
  const sections = [];
  const sectionRegex = /^## (.+)$/gm;
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    const title = match[1];
    const start = match.index;
    sections.push({ title, start });
  }

  return sections.map(s => s.title);
}

/**
 * Считает шаги в инструкции
 */
function countSteps(content) {
  const stepMatches = content.match(/### Шаг \d+/g);
  return stepMatches ? stepMatches.length : 0;
}

/**
 * Считает чек-поинты
 */
function countCheckpoints(content) {
  const checkboxMatches = content.match(/- \[ \]/g);
  return checkboxMatches ? checkboxMatches.length : 0;
}

/**
 * Считает материалы в таблице
 */
function countMaterials(content) {
  const materialsMatch = content.match(/## Необходимые материалы[\s\S]*?(?=\n## |$)/);
  if (materialsMatch) {
    const rows = materialsMatch[0].split('\n').filter(line => line.startsWith('|') && !line.includes('---') && !line.includes('Материал'));
    return rows.length;
  }
  return 0;
}

/**
 * Считает инструменты в таблице
 */
function countTools(content) {
  const toolsMatch = content.match(/## Необходимые инструменты[\s\S]*?(?=\n## |$)/);
  if (toolsMatch) {
    const rows = toolsMatch[0].split('\n').filter(line => line.startsWith('|') && !line.includes('---') && !line.includes('Инструмент'));
    return rows.length;
  }
  return 0;
}

/**
 * Собирает технологии из папки
 */
function collectTechnologies(directionId) {
  const folder = DIRECTION_FOLDERS[directionId];
  const techPath = path.join(ROOT, 'технологии', folder);

  if (!fs.existsSync(techPath)) {
    return [];
  }

  const files = fs.readdirSync(techPath).filter(f => f.endsWith('.md') && f.startsWith('T-'));
  const technologies = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(techPath, file), 'utf-8');
    const frontmatter = parseFrontmatter(content);
    const description = extractDescription(content);

    const bodyContent = extractContent(content);

    technologies.push({
      id: frontmatter.id || file.replace('.md', ''),
      name: frontmatter.name || file.replace('.md', ''),
      process: frontmatter.process || '',
      stage: frontmatter.stage || 'черновая',
      difficulty: parseInt(frontmatter.difficulty) || 1,
      timeToLearn: frontmatter.time_to_learn || '',
      status: frontmatter.status || 'draft',
      description: description,
      content: bodyContent,
      file: `технологии/${folder}/${file}`,
      // Новые поля
      related: extractRelatedTechnologies(bodyContent),
      sections: extractSections(bodyContent),
      stats: {
        steps: countSteps(bodyContent),
        checkpoints: countCheckpoints(bodyContent),
        materials: countMaterials(bodyContent),
        tools: countTools(bodyContent)
      }
    });
  }

  // Сортируем по ID
  technologies.sort((a, b) => a.id.localeCompare(b.id));

  return technologies;
}

/**
 * Собирает все данные
 */
function buildData() {
  const directions = [];
  let totalTechnologies = 0;

  for (const [id, info] of Object.entries(DIRECTIONS_INFO)) {
    const technologies = collectTechnologies(id);
    totalTechnologies += technologies.length;

    // Считаем по этапам
    const byStage = {
      черновая: technologies.filter(t => t.stage === 'черновая').length,
      чистовая: technologies.filter(t => t.stage === 'чистовая').length
    };

    // Считаем по статусам
    const byStatus = {
      draft: technologies.filter(t => t.status === 'draft').length,
      review: technologies.filter(t => t.status === 'review').length,
      approved: technologies.filter(t => t.status === 'approved').length
    };

    directions.push({
      id,
      name: info.name,
      block: info.block,
      stages: info.stages,
      requires: DEPENDENCIES[id] || [],
      opens: Object.entries(DEPENDENCIES)
        .filter(([_, deps]) => deps.includes(id))
        .map(([dirId]) => dirId),
      technologies,
      stats: {
        total: technologies.length,
        byStage,
        byStatus
      }
    });
  }

  // Сортируем по ID
  directions.sort((a, b) => {
    const numA = parseInt(a.id.replace('D', ''));
    const numB = parseInt(b.id.replace('D', ''));
    return numA - numB;
  });

  return {
    meta: {
      generated: new Date().toISOString(),
      totalDirections: directions.length,
      totalTechnologies
    },
    directions
  };
}

// Запуск
console.log('Сборка данных...');
const data = buildData();

// Создаём папку если нет
const outputDir = path.dirname(OUTPUT);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), 'utf-8');
console.log(`✓ Создан ${OUTPUT}`);
console.log(`  Направлений: ${data.meta.totalDirections}`);
console.log(`  Технологий: ${data.meta.totalTechnologies}`);
