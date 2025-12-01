#!/bin/bash

# Запуск нескольких Claude Code сессий параллельно
# Каждое окно открывается с промтом в буфере обмена

PROJECT_DIR="/Users/nikolajeliseev/Desktop/Школа ремонт"
cd "$PROJECT_DIR"

echo "═══════════════════════════════════════════════════"
echo "  ПАРАЛЛЕЛЬНЫЙ ЗАПУСК CLAUDE CODE"
echo "═══════════════════════════════════════════════════"
echo ""

if [ $# -eq 0 ]; then
    echo "Использование: ./run-parallel.sh D02 D04 D09 ..."
    echo ""
    echo "Фаза 1: ./run-parallel.sh D02 D04 D09 D12 D06 D10 D13"
    echo "Фаза 2: ./run-parallel.sh D08 D01 D05 D16"
    echo "Фаза 3: ./run-parallel.sh D11 D14 D15 D17 D07 D03 D18 D00"
    exit 1
fi

echo "Запускаю направления: $@"
echo ""
echo "В каждом окне:"
echo "  1. Откроется Claude Code"
echo "  2. Промт УЖЕ В БУФЕРЕ — просто нажми Cmd+V"
echo ""

for DIR in "$@"; do
    PROMPT_FILE="$PROJECT_DIR/scripts/prompts/$DIR.md"

    if [ ! -f "$PROMPT_FILE" ]; then
        echo "❌ Файл не найден: $PROMPT_FILE"
        continue
    fi

    echo "🚀 $DIR — открываю окно..."

    # Копируем промт в буфер и открываем окно с Claude
    osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR' && cat '$PROMPT_FILE' | pbcopy && echo '═══════════════════════════════════════' && echo '  $DIR — ПРОМТ СКОПИРОВАН В БУФЕР' && echo '═══════════════════════════════════════' && echo '' && echo 'Нажми Cmd+V чтобы вставить промт' && echo '' && claude"
end tell
EOF

    sleep 2  # Даём время на копирование в буфер
done

echo ""
echo "✅ Запущено окон: $#"
echo ""
echo "⚠️  ВАЖНО: Каждое окно по очереди копирует свой промт в буфер."
echo "    Переключайся на окна и сразу жми Cmd+V пока буфер свежий!"
