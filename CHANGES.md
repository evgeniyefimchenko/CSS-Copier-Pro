# CSS Copier Pro v2.0 - Список изменений

## ✅ Реализованные улучшения

### 1. Единый конфигурационный файл (config.js)
**Проблема**: 3 разных списка свойств в разных файлах приводили к рассинхронизации.

**Решение**: 
- Создан `config.js` с центральным хранилищем всех констант
- Все модули (`content.js`, `background.js`, `options.js`) используют общие константы
- Версионирование конфига (PLUGIN_VERSION = '2.0.0')

**Константы в config.js**:
- `SHORTER_USEFUL_PROPS_REFERENCE` - короткий список для content.js
- `DEFAULT_USEFUL_PROPS_LIST` - полный список для options/background
- `STRICT_DEFAULTS` - браузерные значения по умолчанию
- `SUPPORTED_PSEUDO_ELEMENTS` - расширенный список псевдоэлементов
- `EXPORT_FORMATS` - форматы экспорта
- `DEFAULT_SETTINGS` - настройки по умолчанию

### 2. Поддержка Shadow DOM
**Проблема**: Плагин игнорировал элементы внутри Shadow DOM.

**Решение**:
```javascript
// Рекурсивная обработка Shadow DOM
if (element.shadowRoot) {
    for (const child of element.shadowRoot.children) {
        info.children.push(extractElementInfo(child, ownSelector));
    }
}
```

**Дополнительно**: В manifest.json добавлен флаг `"all_frames": true` для работы во фреймах.

### 3. Несколько форматов экспорта
**Проблема**: Только один формат вывода (CSS).

**Решение**: Добавлено 4 формата экспорта:

#### CSS (стандартный)
```css
.selector {
  property: value;
}
```

#### SCSS (с вложенностью)
```scss
.parent {
  property: value;
  
  &::before {
    property: value;
  }
  
  .child {
    property: value;
  }
}
```

#### JSON (структура)
```json
{
  "selector": ".selector",
  "styles": { "property": "value" },
  "children": [...]
}
```

#### Tailwind CSS (классы)
```html
<!-- .selector -->
<div class="flex justify-center items-center">
  ...
</div>
```

### 4. История копирования
**Проблема**: Нет истории скопированных стилей.

**Решение**:
- Сохранение в `chrome.storage.local`
- Настройка количества записей (maxHistoryItems)
- Каждая запись содержит: content, format, timestamp, url
- Функция `saveToCopyHistory()` вызывается при каждом копировании

### 5. Расширенные псевдоэлементы
**Проблема**: Поддерживались только `:before` и `:after`.

**Решение**: Добавлены `:first-letter` и `:first-line`:
```javascript
const SUPPORTED_PSEUDO_ELEMENTS = [':before', ':after', ':first-letter', ':first-line'];
```

### 6. Обновлённый интерфейс настроек
**Проблема**: Минималистичный UI без новых опций.

**Решение**: 
- Секции с иконками (📋 Фильтрация, 📤 Формат, 📜 История)
- Выпадающий список форматов экспорта
- Чекбоксы для псевдоэлементов и истории
- Поле для максимального количества записей истории

### 7. Улучшенная обработка ошибок
- Обновлены версии в логах (V2.0)
- Консистентные сообщения об ошибках
- Graceful degradation при отсутствии элементов UI

## 📁 Изменённые файлы

| Файл | Изменения |
|------|-----------|
| `config.js` | ✨ Новый файл - единый конфиг |
| `manifest.json` | ⬆️ Версия 2.0, добавлен config.js, all_frames: true |
| `content.js` | ⬆️ Интеграция config.js, Shadow DOM, мультиформат, история |
| `background.js` | ⬆️ Интеграция config.js, новые настройки по умолчанию |
| `options.js` | ⬆️ Интеграция config.js, управление новыми настройками |
| `options.html` | ⬆️ Новый UI с секциями и элементами управления |

## 🚀 Как использовать новые функции

### Выбор формата экспорта
1. Откройте настройки плагина
2. В секции "📤 Формат экспорта" выберите нужный формат
3. Нажмите "Сохранить"

### Просмотр истории копирования
История сохраняется в `chrome.storage.local` с ключом `copyHistory`.

### Работа с Shadow DOM
Работает автоматически - просто выбирайте элементы внутри Shadow DOM.

## 🔧 Технические детали

### Структура данных истории
```javascript
{
  id: 1234567890,
  content: "...",
  format: "css",
  timestamp: "2024-01-01T00:00:00.000Z",
  url: "https://example.com"
}
```

### Маппинг Tailwind
Базовая реализация через `TAILWIND_MAPPING` объект. Поддерживает:
- display, position, flex-direction
- justify-content, align-items, text-align
- font-weight, text-decoration, overflow, cursor
- Автоматическое преобразование px → rem для margin/padding

## 📝 Замечания

- Tailwind маппинг является базовым и может быть расширён
- История хранится локально (не синхронизируется между устройствами)
- Для полного использования Shadow DOM требуется современный браузер
