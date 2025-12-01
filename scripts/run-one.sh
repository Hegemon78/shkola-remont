#!/bin/bash

# Запуск ОДНОЙ сессии Claude Code с промтом в буфере
# Использование: ./run-one.sh D02

PROJECT_DIR="/Users/nikolajeliseev/Desktop/Школа ремонт"
DIR=$1

if [ -z "$DIR" ]; then
    echo "Использование: ./run-one.sh D02"
    echo ""
    echo "Доступные направления:"
    ls "$PROJECT_DIR/scripts/prompts/" | sed 's/.md$//'
    exit 1
fi

PROMPT_FILE="$PROJECT_DIR/scripts/prompts/$DIR.md"

if [ ! -f "$PROMPT_FILE" ]; then
    echo "❌ Файл не найден: $PROMPT_FILE"
    exit 1
fi

# Копируем промт в буфер
cat "$PROMPT_FILE" | pbcopy

echo "═══════════════════════════════════════"
echo "  $DIR — ПРОМТ СКОПИРОВАН В БУФЕР"
echo "═══════════════════════════════════════"
echo ""
echo "Сейчас откроется новое окно с Claude Code."
echo "Просто нажми Cmd+V чтобы вставить промт."
echo ""

# Открываем новое окно Terminal с Claude
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR' && claude"
end tell
EOF

echo "✅ Окно открыто. Переключись на него и нажми Cmd+V"
