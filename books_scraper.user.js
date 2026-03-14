// ==UserScript==
// @name         Books to Scrape - CSV Exporter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Exporta categorias e livros do books.toscrape.com para CSV
// @author       You
// @match        https://books.toscrape.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ── Utilitários ──────────────────────────────────────────────────────────

    function cleanText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    function toAbsoluteUrl(href) {
        if (!href) return '';
        try {
            return new URL(href, 'https://books.toscrape.com/').href;
        } catch {
            return href;
        }
    }

    function escapeCSV(value) {
        const str = String(value ?? '');
        // Se contiver vírgula, aspas ou quebra de linha, envolve em aspas
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    function rowToCSV(fields) {
        return fields.map(escapeCSV).join(',');
    }

    function downloadCSV(filename, rows) {
        const content = rows.join('\n');
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── Mapeamento de estrelas (word → número) ────────────────────────────────

    const STAR_MAP = {
        one: 1, two: 2, three: 3, four: 4, five: 5
    };

    function getRating(articleEl) {
        const p = articleEl.querySelector('p.star-rating');
        if (!p) return '';
        for (const cls of p.classList) {
            const lower = cls.toLowerCase();
            if (STAR_MAP[lower] !== undefined) return STAR_MAP[lower];
        }
        return '';
    }

    // ── Extração de categorias ────────────────────────────────────────────────

    function scrapeCategories() {
        const currentUrl = window.location.href;
        const links = document.querySelectorAll('.side_categories ul li a');

        const rows = [rowToCSV(['category_name', 'category_url', 'is_current_category'])];

        // Palavras que indicam links falsos (não são categorias reais)
        const IGNORE = ['add a comment', 'leave a reply', 'cancel reply'];

        links.forEach(link => {
            const name = cleanText(link.textContent);
            if (IGNORE.includes(name.toLowerCase())) return; // ignora falsos positivos
            const url = toAbsoluteUrl(link.getAttribute('href'));
            const isCurrent = currentUrl.startsWith(url) && url !== 'https://books.toscrape.com/'
                ? 'true'
                : 'false';
            rows.push(rowToCSV([name, url, isCurrent]));
        });

        return rows;
    }

    // ── Extração de livros ────────────────────────────────────────────────────

    function scrapeBooks() {
        // Nome da categoria atual
        const categoryEl = document.querySelector('.side_categories ul li ul li a')
            && [...document.querySelectorAll('.side_categories ul li ul li a')]
                .find(a => {
                    const url = toAbsoluteUrl(a.getAttribute('href'));
                    return window.location.href.includes(
                        url.replace('https://books.toscrape.com/', '')
                              .replace('/index.html', '')
                    );
                });

        // Fallback: pega o <h1> da página ou "All"
        const categoryName = cleanText(
            document.querySelector('.page-header.action h1')?.textContent ||
            (categoryEl ? categoryEl.textContent : 'All')
        );

        const articles = document.querySelectorAll('article.product_pod');
        const rows = [rowToCSV([
            'category_name', 'book_title', 'price', 'currency',
            'availability', 'rating', 'book_url', 'image_url'
        ])];

        articles.forEach(article => {
            const titleEl = article.querySelector('h3 a');
            const title = titleEl ? cleanText(titleEl.getAttribute('title') || titleEl.textContent) : '';

            const priceRaw = cleanText(article.querySelector('.price_color')?.textContent || '');
            // Separa símbolo da moeda do valor numérico
            const currency = priceRaw.replace(/[0-9.,]/g, '').trim() || '£';
            const price = priceRaw.replace(/[^0-9.,]/g, '').trim();

            const availability = cleanText(article.querySelector('.availability')?.textContent || '');
            const rating = getRating(article);
            const bookUrl = toAbsoluteUrl(titleEl?.getAttribute('href') || '');
            const imageUrl = toAbsoluteUrl(article.querySelector('img')?.getAttribute('src') || '');

            rows.push(rowToCSV([
                categoryName, title, price, currency,
                availability, rating, bookUrl, imageUrl
            ]));
        });

        return rows;
    }

    // ── Execução principal ────────────────────────────────────────────────────

    function run() {
        const categoryRows = scrapeCategories();
        const bookRows = scrapeBooks();

        downloadCSV('categories.csv', categoryRows);
        // Pequeno delay para o segundo download não ser bloqueado pelo navegador
        setTimeout(() => downloadCSV('books.csv', bookRows), 500);

        const totalCategories = categoryRows.length - 1;
        const totalBooks = bookRows.length - 1;
        alert(
            `✅ CSVs gerados com sucesso!\n\n` +
            `📁 categories.csv — ${totalCategories} categoria(s)\n` +
            `📚 books.csv — ${totalBooks} livro(s) na página atual`
        );
    }

    // ── Registro do menu no Tampermonkey ──────────────────────────────────────

    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand('📥 Exportar CSV (categorias + livros)', run);
    } else {
        // Fallback: executa ao carregar se GM_registerMenuCommand não estiver disponível
        window.addEventListener('load', run);
    }

})();