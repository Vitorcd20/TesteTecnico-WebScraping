# 📚 Books Scraper — Tampermonkey UserScript

Script para extração de dados do site [books.toscrape.com](https://books.toscrape.com), desenvolvido como parte de um teste técnico de Web Scraping.

## 🎯 Objetivo

Extrair automaticamente as categorias e livros do site e exportar os dados em dois arquivos CSV separados, diretamente pelo navegador.

---

## ⚙️ Como instalar

1. Instale a extensão **Tampermonkey** no seu navegador:
   - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. Clique no ícone do Tampermonkey → **"Criar novo script"**

3. Apague o conteúdo padrão e cole o conteúdo do arquivo `books_scraper.user.js`

4. Salve com `Ctrl + S`

---

## ▶️ Como usar

1. Acesse [https://books.toscrape.com](https://books.toscrape.com) (ou qualquer categoria do site)
2. Clique no ícone do **Tampermonkey** na barra do navegador
3. Clique em **"📥 Exportar CSV (categorias + livros)"**
4. Os dois arquivos serão baixados automaticamente na sua pasta de Downloads

---

## 📁 Arquivos gerados

### `categories.csv`
Lista todas as categorias da sidebar do site.

| Coluna | Descrição |
|--------|-----------|
| `category_name` | Nome da categoria |
| `category_url` | URL completa da categoria |
| `is_current_category` | `true` se for a categoria atual, `false` caso contrário |

### `books.csv`
Lista todos os livros da página/categoria atual.

| Coluna | Descrição |
|--------|-----------|
| `category_name` | Nome da categoria atual |
| `book_title` | Título do livro |
| `price` | Preço (valor numérico) |
| `currency` | Símbolo da moeda (ex: `£`) |
| `availability` | Disponibilidade (ex: `In stock`) |
| `rating` | Avaliação em estrelas (1 a 5) |
| `book_url` | URL completa da página do livro |
| `image_url` | URL completa da imagem da capa |

---

## ✅ Requisitos atendidos

- [x] Roda dentro do Tampermonkey
- [x] Executa apenas em `books.toscrape.com`
- [x] Menu manual para disparar a extração
- [x] `categories.csv` com todas as categorias
- [x] `books.csv` com todos os livros da categoria atual
- [x] CSVs com cabeçalhos corretos
- [x] URLs completas (não relativas)
- [x] Dados limpos (sem whitespace quebrado)

---

## 🛠️ Tecnologias

- JavaScript (Vanilla)
- Tampermonkey API (`GM_registerMenuCommand`)
- Web Scraping via DOM (`querySelector`, `querySelectorAll`)
- Download via `Blob` + `URL.createObjectURL`