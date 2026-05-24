import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = path.join(repoRoot, 'data', 'ads-works.json');

const ADS_ENDPOINT = 'https://api.adsabs.harvard.edu/v1/search/query';
const DEFAULT_QUERY = 'author:"Benest Couzinou" AND property:refereed AND (database:astronomy OR database:physics)';
const MARKER_START = '<!-- ADS-WORKS:START -->';
const MARKER_END = '<!-- ADS-WORKS:END -->';

function firstText(value) {
	if (Array.isArray(value)) {
		return firstText(value[0]);
	}

	if (typeof value === 'string') {
		return value.trim();
	}

	if (value === null || value === undefined) {
		return '';
	}

	return String(value).trim();
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function sanitizeId(value) {
	return String(value || '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'article';
}

function formatDate(value, year, month) {
	const rawDate = firstText(value) || [year, month, '01'].filter(Boolean).join('-');

	if (!rawDate) {
		return 'Date unavailable';
	}

	const parsedDate = new Date(rawDate);

	if (Number.isNaN(parsedDate.getTime())) {
		return rawDate;
	}

	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	}).format(parsedDate);
}

function previewText(text, maxLength = 280) {
	const normalized = firstText(text).replace(/\s+/g, ' ');

	if (!normalized) {
		return 'Abstract unavailable in ADS.';
	}

	if (normalized.length <= maxLength) {
		return normalized;
	}

	const slice = normalized.slice(0, maxLength);
	const lastSpace = slice.lastIndexOf(' ');
	return `${slice.slice(0, lastSpace > 0 ? lastSpace : maxLength).trim()}...`;
}

function pickUrl(record) {
	const doi = firstText(record.doi);

	if (doi) {
		return `https://doi.org/${doi}`;
	}

	const bibcode = firstText(record.bibcode);

	if (bibcode) {
		return `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(bibcode)}/abstract`;
	}

	return 'https://ui.adsabs.harvard.edu/';
}

function renderArticle(record, index) {
	const bibcode = firstText(record.bibcode) || `ads-${index}`;
	const safeId = sanitizeId(bibcode);
	const title = firstText(record.title) || 'Untitled article';
	const authors = Array.isArray(record.author)
		? record.author.map((author) => firstText(author)).filter(Boolean).join(', ')
		: firstText(record.author);
	const journal = firstText(record.pub) || 'ADS record';
	const date = formatDate(record.date, record.year, record.month);
	const articleUrl = pickUrl(record);
	const abstract = firstText(record.abstract) || 'Abstract unavailable in ADS.';
	const preview = previewText(abstract);
	const fullId = `AbstractFull-${safeId}`;
	const previewId = `AbstractPreview-${safeId}`;

	return [
		'<article class="col-6 col-12-xsmall work-item">',
		`	<a href="${escapeHtml(articleUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>`,
		`	<h3>${escapeHtml(authors || 'Author unavailable')}</h3>`,
		`	<h4 class="work-meta">${escapeHtml(journal)} · ${escapeHtml(date)}</h4>`,
		`	<div class="readmore-btn js-toggle-abstract" data-full="#${fullId}" data-preview="#${previewId}">Read abstract</div>`,
		`	<div class="text-wrapper" id="Abstract-${safeId}">`,
		`		<p id="${previewId}" class="abstract-preview">${escapeHtml(preview)}</p>`,
		`		<p id="${fullId}" style="display:none;">${escapeHtml(abstract)}</p>`,
		'	</div>',
		'</article>',
	].join('\n');
}

function indentBlock(block, indent) {
	return block
		.split('\n')
		.map((line) => (line.length ? `${indent}${line}` : line))
		.join('\n');
}

async function fetchAdsArticles({ token, query, rows }) {
	const records = [];
	let start = 0;
	let total = Number.POSITIVE_INFINITY;

	while (start < total) {
		const url = new URL(ADS_ENDPOINT);
		url.searchParams.set('q', query);
		url.searchParams.set('fl', 'bibcode,title,author,abstract,pub,date,year,month,doi');
		url.searchParams.set('rows', String(rows));
		url.searchParams.set('start', String(start));
		url.searchParams.set('sort', 'date desc,bibcode desc');

		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`ADS request failed with HTTP ${response.status} ${response.statusText}`);
		}

		const payload = await response.json();
		const searchResponse = payload?.response ?? {};
		const batch = Array.isArray(searchResponse.docs) ? searchResponse.docs : [];

		records.push(...batch);
		total = Number.isFinite(Number(searchResponse.numFound)) ? Number(searchResponse.numFound) : records.length;

		if (!batch.length) {
			break;
		}

		start += batch.length;
	}

	return records;
}

async function main() {
	const token = process.env.ADS_API_TOKEN;
	if (!token) {
		throw new Error('Missing ADS_API_TOKEN environment variable.');
	}

	const query = process.env.ADS_QUERY || DEFAULT_QUERY;
	const rows = Number(process.env.ADS_ROWS || '100');
	const records = await fetchAdsArticles({ token, query, rows });
	const normalizedRecords = records.map((record) => ({
		bibcode: firstText(record.bibcode),
		title: firstText(record.title),
		author: Array.isArray(record.author) ? record.author.map((author) => firstText(author)).filter(Boolean) : firstText(record.author),
		abstract: firstText(record.abstract),
		pub: firstText(record.pub),
		date: firstText(record.date),
		year: firstText(record.year),
		month: firstText(record.month),
		doi: firstText(record.doi),
	}));

	await mkdir(path.dirname(dataPath), { recursive: true });
	await writeFile(
		dataPath,
		`${JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				query,
				count: normalizedRecords.length,
				articles: normalizedRecords,
			},
			null,
			2,
		)}\n`,
		'utf8',
	);

	console.log(`Updated Works section with ${records.length} ADS articles.`);
}

main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
