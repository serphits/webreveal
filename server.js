const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Ensure scans directory exists
const scansDir = path.join(__dirname, 'scans');
if (!fs.existsSync(scansDir)) {
    fs.mkdirSync(scansDir);
}

// Build signature database
function buildSignatures() {
    const sig = [];
    const byHtml = (re, name, cat, hint) => sig.push({name, category: cat, test: (html, assets) => re.test(html) ? (hint || html.match(re)[0]) : null});
    const byAsset = (re, name, cat, hint) => sig.push({name, category: cat, test: (html, assets) => { const m = assets.join(' '); const r = m.match(re); return r ? (hint || r[0]) : null }});
    const byString = (str, name, cat) => sig.push({name, category: cat, test: (html, assets) => html.includes(str.toLowerCase()) ? str : null});

    // CMS & Blog Platforms
    byHtml(/\bwp-content\b|\bwp-includes\b|\bWordPress\b|wordpress-version|wp-json/i,'WordPress','CMS');
    byHtml(/\bwoocommerce\b|wc-post-data|woocommerce-pagination/i,'WooCommerce','CMS');
    byAsset(/cdn\.shopify\.com|\.myshopify\.com|shopify\.cdn|shopifycdn|shopify-section|shopify-/i,'Shopify','CMS');
    byHtml(/\bDrupal\b|\bdrupal-settings-json\b|\bDrupal\.settings\b|drupal_settings|drupal\.org/i,'Drupal','CMS');
    byHtml(/\bJoomla!\b|index\.php\?option=com_|\bjoomla\b|\/components\/com_/i,'Joomla','CMS');
    byHtml(/\bMagento\b|mage\.js|Mage\.Cookies|Mage\.VERSION|\/mage\/|magento\.com/i,'Magento','CMS');
    byHtml(/\bPrestaShop\b|prestashop|prestashop-module/i,'PrestaShop','CMS');
    byHtml(/\bGhost\b|\/ghost\/api|ghost-api/i,'Ghost','CMS');
    byHtml(/\bSquarespace\b|squarespace-com|sqs-cdn|squarespace/i,'Squarespace','CMS');
    byAsset(/wix\.com|wixstatic|wix-analytics|wix\.mx|wix-cms/i,'Wix','CMS');
    byHtml(/\bWebflow\b|webflow\.js|webflow-css|w-tab|w-mod-js|webflow\.io/i,'Webflow','CMS');
    byAsset(/webflow\.com|cdn\.webflow\.com|webflow/i,'Webflow','CMS');

    // Frontend Frameworks
    byHtml(/\bReact\b|data-reactroot|react-dom|__REACT_DEVTOOLS_GLOBAL_HOOK__|data-reactid|__react|react\.createElement/i,'React','Frontend');
    byHtml(/\bVue\b|__VUE_DEVTOOLS_GLOBAL_HOOK__|vue\.runtime|__VUE__|new Vue\(|Vue\.config|vue\.global/i,'Vue','Frontend');
    byHtml(/\bAngular\b|ng-app|ng-version|angular\.module|ng-controller|\/angular\.js|angular\.bootstrap/i,'Angular','Frontend');
    byHtml(/_next\/static|next\.js|next\/data|__NEXT_DATA__|__NEXT_PAGE__|next-router/i,'Next.js','Frontend');
    byHtml(/\bGatsby\b|__gatsby|gatsby-ssr|gatsby-browser|gatsby-focus|gatsby-image/i,'Gatsby','Frontend');
    byHtml(/\bSvelte\b|svelte|__svelte|svelte:component/i,'Svelte','Frontend');
    byHtml(/\bEmber\b|ember\.js|__ember|ember\.data/i,'Ember.js','Frontend');
    byHtml(/\bBackbone\b|backbone\.js|Backbone\.Router/i,'Backbone.js','Frontend');
    byHtml(/\bAlpine\b|Alpine\.data|x-data|@click/i,'Alpine.js','Frontend');

    // CSS Frameworks
    byAsset(/tailwindcss|cdn\.tailwindcss\.com|tailwind/i,'Tailwind CSS','CSS');
    byAsset(/bootstrap(\d+)?(\.\d+)?(\.\d+)?(\.min)?\.css|getbootstrap/i,'Bootstrap','CSS');
    byAsset(/foundation(\d+)?\.css|foundation\.zurb/i,'Foundation','CSS');
    byAsset(/bulma\.css|bulma/i,'Bulma','CSS');
    byAsset(/materialize\.css|materialize/i,'Materialize','CSS');

    // JavaScript Libraries
    byAsset(/jquery(\d+)?(\.\d+)?(\.\d+)?(\.min)?\.js|jQuery|jquery\.com/i,'jQuery','Library');
    byAsset(/lodash|underscore\.js|ramda/i,'Utility Libraries','Library');
    byAsset(/\bD3\.js\b|d3\.v\d|d3\.min\.js/i,'D3.js','Library');
    byAsset(/chart\.js|chartjs|charting/i,'Chart.js','Library');
    byAsset(/three\.js|threejs|three\.min/i,'Three.js','Library');
    byAsset(/gsap|greensock/i,'GSAP','Library');

    // Analytics & Tracking
    byAsset(/googletagmanager|gtm\.js|GTM-\w+/i,'Google Tag Manager','Analytics');
    byAsset(/gtag\(|google-analytics|analytics\.js|UA-\d{4,}|G-[A-Z0-9]+/i,'Google Analytics','Analytics');
    byAsset(/facebook\.net|fbq\(|fbevents|pixel\.quantserve/i,'Facebook Pixel','Analytics');
    byAsset(/mixpanel|mp\.mixpanel/i,'Mixpanel','Analytics');
    byAsset(/hotjar|heatmap|hotjar\.com/i,'Hotjar','Analytics');
    byAsset(/segment\.io|segment\.com|analytics\.js/i,'Segment','Analytics');

    // Hosting & Cloud
    byHtml(/cloudflare|cloudflareinsights|cloudflare-static/i,'Cloudflare','Hosting');
    byHtml(/amazonaws|cloudfront|s3\.amazonaws\.com|aws|amazon-web-services/i,'Amazon AWS','Hosting');
    byAsset(/vercel\.com|now\.sh|vercel\.app|vercel/i,'Vercel','Hosting');
    byAsset(/netlify\.com|netlify\.app|netlify/i,'Netlify','Hosting');
    byAsset(/heroku\.com|herokuapp/i,'Heroku','Hosting');
    byAsset(/firebase|firebaseapp/i,'Firebase','Hosting');

    return sig;
}

function shortSnippet(s, max = 120) {
    if (!s) return '';
    s = ('' + s).replace(/\s+/g, ' ').trim();
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function detectTechs(html) {
    const $ = cheerio.load(html);
    const assets = [];

    // Collect scripts
    $('script').each((i, el) => {
        const src = $(el).attr('src');
        if (src) assets.push(src);
        const content = $(el).html();
        if (content) assets.push(content.slice(0, 200));
    });

    // Collect links
    $('link[href]').each((i, el) => {
        assets.push($(el).attr('href'));
    });

    // Collect meta tags
    $('meta[name]').each((i, el) => {
        const name = $(el).attr('name') || '';
        const content = $(el).attr('content') || '';
        assets.push(name + ':' + content);
    });

    const signatures = buildSignatures();
    const grouped = {};

    signatures.forEach(sig => {
        try {
            const ev = sig.test(html.toLowerCase(), assets);
            if (ev) {
                if (!grouped[sig.category]) grouped[sig.category] = [];
                grouped[sig.category].push({ name: sig.name, evidence: shortSnippet(ev, 140) });
            }
        } catch (e) {
            // ignore
        }
    });

    // Extract meta generator
    const metaGenerator = $('meta[name="generator"]').attr('content');
    if (metaGenerator) {
        const cat = 'Meta';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].unshift({ name: 'meta generator — ' + metaGenerator, evidence: shortSnippet(metaGenerator, 140) });
    }

    return grouped;
}

// API endpoint for scanning
app.post('/api/scan', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        console.log(`Scanning: ${url}`);
        
        // Fetch the website
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000,
            maxRedirects: 5
        });

        const html = response.data;
        const results = detectTechs(html);

        // Create scan result object
        const scanResult = {
            url: url,
            timestamp: new Date().toISOString(),
            technologies: results,
            totalFound: Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
        };

        // Save to file
        const timestamp = new Date().getTime();
        const sanitizedUrl = url.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        const filename = `scan_${sanitizedUrl}_${timestamp}.json`;
        const filepath = path.join(scansDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(scanResult, null, 2));
        console.log(`Scan saved to: ${filename}`);

        // Return results
        res.json({
            success: true,
            results: results,
            totalFound: scanResult.totalFound,
            savedAs: filename
        });

    } catch (error) {
        console.error('Scan error:', error.message);
        res.status(500).json({ 
            error: 'Failed to scan website', 
            details: error.message 
        });
    }
});

// API endpoint to get all scans
app.get('/api/scans', (req, res) => {
    try {
        const files = fs.readdirSync(scansDir)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filepath = path.join(scansDir, file);
                const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                return {
                    filename: file,
                    url: content.url,
                    timestamp: content.timestamp,
                    totalFound: content.totalFound
                };
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({ scans: files });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve scans' });
    }
});

// API endpoint to get a specific scan
app.get('/api/scans/:filename', (req, res) => {
    try {
        const filepath = path.join(scansDir, req.params.filename);
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Scan not found' });
        }
        const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve scan' });
    }
});

app.listen(PORT, () => {
    console.log(`Web Reveal Scanner Server running on http://localhost:${PORT}`);
    console.log(`Scans will be saved to: ${scansDir}`);
});
