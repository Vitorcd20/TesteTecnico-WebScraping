// ==UserScript==
// @name         Books to Scrape - CSV Exporter
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Exporta categorias e livros do books.toscrape.com para CSV
// @author       You
// @match        https://books.toscrape.com/*
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    // ── Utilitários ──────────────────────────────────────────────────────────

    function cleanText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    function toAbsoluteUrl(href, base) {
        if (!href) return '';
        try {
            return new URL(href, base || 'https://books.toscrape.com/').href;
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
            if (IGNORE.includes(name.toLowerCase())) return;
            const url = toAbsoluteUrl(link.getAttribute('href'));
            const isCurrent = currentUrl.startsWith(url) && url !== 'https://books.toscrape.com/'
                ? 'true'
                : 'false';
            rows.push(rowToCSV([name, url, isCurrent]));
        });

        return rows;
    }

    // ── Extração de livros de um documento HTML ───────────────────────────────

    function extractBooksFromDoc(doc, categoryName, baseUrl) {
        const articles = doc.querySelectorAll('article.product_pod');
        const rows = [];

        articles.forEach(article => {
            const titleEl = article.querySelector('h3 a');
            const title = titleEl ? cleanText(titleEl.getAttribute('title') || titleEl.textContent) : '';
            const priceRaw = cleanText(article.querySelector('.price_color')?.textContent || '');
            const currency = priceRaw.replace(/[0-9.,]/g, '').trim() || '£';
            const price = priceRaw.replace(/[^0-9.,]/g, '').trim();
            const availability = cleanText(article.querySelector('.availability')?.textContent || '');
            const rating = getRating(article);
            const bookUrl = toAbsoluteUrl(titleEl?.getAttribute('href') || '', baseUrl);
            const imageUrl = toAbsoluteUrl(article.querySelector('img')?.getAttribute('src') || '', baseUrl);

            rows.push(rowToCSV([
                categoryName, title, price, currency,
                availability, rating, bookUrl, imageUrl
            ]));
        });

        return rows;
    }

    // ── Paginação ─────────────────────────────────────────────────────────────

    function getNextPageUrl(doc, currentUrl) {
        const nextBtn = doc.querySelector('li.next a');
        if (!nextBtn) return null;
        return toAbsoluteUrl(nextBtn.getAttribute('href'), currentUrl);
    }

    // ── Execução principal ────────────────────────────────────────────────────

    async function run() {
        const categoryRows = scrapeCategories();

        const categoryName = cleanText(
            document.querySelector('.page-header.action h1')?.textContent || 'All products'
        );

        const header = rowToCSV([
            'category_name', 'book_title', 'price', 'currency',
            'availability', 'rating', 'book_url', 'image_url'
        ]);
        const allBookRows = [header];

        // Página atual (já carregada)
        let currentUrl = window.location.href;
        allBookRows.push(...extractBooksFromDoc(document, categoryName, currentUrl));

        // Percorre as demais páginas automaticamente
        let nextUrl = getNextPageUrl(document, currentUrl);
        while (nextUrl) {
            const response = await fetch(nextUrl);
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            allBookRows.push(...extractBooksFromDoc(doc, categoryName, nextUrl));
            currentUrl = nextUrl;
            nextUrl = getNextPageUrl(doc, currentUrl);
        }

        downloadCSV('categories.csv', categoryRows);
        setTimeout(() => downloadCSV('books.csv', allBookRows), 500);
    }

    // ── Registro do menu no Tampermonkey (somente manual) ─────────────────────

    GM_registerMenuCommand('📥 Exportar CSV (categorias + livros)', run);

})();