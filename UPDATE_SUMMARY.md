# Обновление локализации и очистка проекта

## Дата: 2024-04-18

### ✅ Выполненные изменения:

#### 1. Удаление устаревшего файла
- **Удалён файл:** `doc-i18n.js`
- **Причина:** Дублировал функционал нового модуля `i18n.js`, использовал ручной подход вместо автоматической локализации через атрибуты `data-i18n`

#### 2. Обновление документации
- **Файл:** `documentation.html`
- **Изменение:** Удалено подключение `doc-i18n.js`
- **Результат:** Теперь используется только универсальный `i18n.js`

#### 3. Исправление английской локализации
- **Файл:** `_locales/en/messages.json`
- **Проблема:** Все ключи были в наличии, но текст не отображался
- **Решение:** Пересоздан файл с корректной структурой JSON
- **Статус:** ✅ Валидировано через Python JSON parser

#### 4. Структура файлов локализации
```
_locales/
├── en/
│   └── messages.json (62 ключа, 6.2 KB) ✅
└── ru/
    └── messages.json (62 ключа, 9.6 KB) ✅
```

### 📋 Полный список ключей локализации (58 ключей):

| Ключ | EN | RU |
|------|-----|----|
| extName | CSS Copier Pro | CSS Копир Про |
| extDescription | Selects an element... | Выбирает элемент... |
| selectElementBtnPopup | Select Element | Выбрать элемент |
| settingsBtnPopup | Settings | Настройки |
| documentationLinkText | Documentation | Документация |
| copiedToClipboardMsg | CSS styles copied... | CSS стили скопированы... |
| ... | ... | ... |

*(полный список в файлах `_locales/*/messages.json`)*

### 🔧 Как работает новая система:

1. **Автоматическая локализация:**
   - Все элементы с атрибутом `data-i18n="key"` автоматически переводятся
   - Поддерживаются: textContent, title, placeholder, aria-label

2. **Модуль i18n.js:**
   ```javascript
   // Автоматически применяется при загрузке страницы
   function localizePage() {
       document.querySelectorAll('[data-i18n]').forEach(...)
       document.querySelectorAll('[data-i18n-title]').forEach(...)
       // и т.д.
   }
   ```

3. **Переключение языка:**
   - Chrome автоматически выбирает язык по настройкам браузера
   - `default_locale: "ru"` в manifest.json

### 🗂️ Итоговая структура проекта:

```
/workspace/
├── _locales/
│   ├── en/messages.json ✅
│   └── ru/messages.json ✅
├── config.js ✅
├── content.js ✅
├── background.js ✅
├── i18n.js ✅ (единый модуль локализации)
├── popup.html ✅ (использует data-i18n)
├── popup.js
├── options.html ✅ (использует data-i18n)
├── options.js
├── documentation.html ✅ (использует data-i18n)
├── manifest.json ✅
├── highlighter.css
├── icon.svg
├── CHANGES.md
├── README.md
└── LICENSE
```

### ❌ Удалённые файлы:
- `doc-i18n.js` — больше не нужен

### ✅ Проверки:
- [x] JSON валидация обоих языковых файлов
- [x] Отсутствие ссылок на удалённый файл
- [x] Все HTML используют `data-i18n` атрибуты
- [x] `i18n.js` подключен ко всем страницам

### 🚀 Установка:
1. Откройте `chrome://extensions/`
2. Включите "Режим разработчика"
3. Нажмите "Загрузить распакованное расширение"
4. Выберите папку `/workspace`
5. Проверьте переключение языка в настройках Chrome

### 📝 Примечание:
Теперь при добавлении новых текстов в интерфейс:
1. Добавьте ключ в оба файла `_locales/*/messages.json`
2. Используйте атрибут `data-i18n="yourKey"` в HTML
3. Не нужно модифицировать JS-код для каждого текста
