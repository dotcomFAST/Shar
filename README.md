# Shar — тепло без розетки

Концепт-кейс інтернет-магазину функціонального одягу шарами для холодних квартир, офісів, укриттів і міста.
Дорослий одяг, доставка по Україні, ціни в гривнях. Інтерфейс українською та англійською (перемикач UA / EN).

## Сторінки

| Десктоп (1440) | Мобільна (390) |
|---|---|
| `Main.dc.html` — головна | `Mobile-Main.dc.html` |
| `Catalog.dc.html` — каталог з фільтрами | `Mobile-Catalog.dc.html` |
| `Product.dc.html` — картка товару | `Mobile-Product.dc.html` |
| `Builder.dc.html` — конструктор шарів | `Mobile-Builder.dc.html` |
| `Cart.dc.html` — кошик і оформлення | `Mobile-Cart.dc.html` |

`index.html` сам відкриває мобільну або десктопну версію залежно від ширини екрана.

## Структура

```
index.html        — точка входу (редирект за шириною екрана)
*.dc.html         — сторінки: шаблон + логіка
support.js        — невеликий рантайм, що рендерить сторінки через React
vendor/           — React 18.3.1 (UMD, ліцензія MIT)
images/           — фото товарів і сцен
.nojekyll         — вимикає Jekyll на GitHub Pages
```

Мова та кошик зберігаються в `localStorage` браузера (`shar-lang`, `shar-items`) і спільні для всіх сторінок.

## Запуск локально

Сторінки треба відкривати через локальний сервер, а не подвійним кліком по файлу:

```bash
python -m http.server 8000
```

Потім відкрийте http://localhost:8000

## Публікація на GitHub Pages

1. Завантажте вміст цієї папки в корінь репозиторію (гілка `main`).
2. Settings → Pages → Source: **Deploy from a branch** → `main` / `(root)` → Save.
3. Через 1–2 хвилини сайт буде доступний за адресою `https://<username>.github.io/<repo>/`.

## Автори та ліцензії

- Дизайн, тексти, UX — портфоліо-кейс.
- Фото згенеровані в Google Gemini.
- Шрифти: Rubik Spray Paint та інші — Google Fonts (SIL Open Font License), підключаються з інтернету.
- React — MIT, див. `vendor/LICENSE-react.txt`.

Промокод для демо: `ТЕПЛО10` / `WARM10`.
