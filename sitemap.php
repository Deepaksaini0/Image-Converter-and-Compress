<?php
/**
 * Dynamic XML Sitemap Generator
 * Automatically collects all pages, blog posts, and category pages.
 * No URL limit applied.
 */

header('Content-Type: application/xml; charset=utf-8');

// ── Configuration ────────────────────────────────────────────────────────────
$base_url    = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
               . '://' . $_SERVER['HTTP_HOST'];
$blog_dir    = __DIR__ . '/blog';        // Path to blog posts directory
$pages_dir   = __DIR__ . '/pages';      // Path to static pages directory (optional)

// Database connection (uncomment and configure if using a database)
// $db_host = 'localhost';
// $db_name = 'your_database';
// $db_user = 'your_username';
// $db_pass = 'your_password';
// try {
//     $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
//     $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
// } catch (PDOException $e) {
//     $pdo = null;
// }

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Scan a directory recursively for .php or .html files.
 * Returns an array of relative paths (no limit).
 */
function scan_files(string $dir, string $base_dir, array $extensions = ['php', 'html']): array {
    $results = [];
    if (!is_dir($dir)) return $results;
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($iterator as $file) {
        if ($file->isFile() && in_array(strtolower($file->getExtension()), $extensions)) {
            $relative = str_replace($base_dir, '', $file->getRealPath());
            $relative = str_replace(['\\', '/index.php', '/index.html'], ['/', '', ''], $relative);
            $relative = rtrim($relative, '/');
            if ($relative !== '') {
                $results[] = $relative;
            }
        }
    }
    return $results;
}

/**
 * Format a Unix timestamp (or file mtime) as W3C datetime for sitemap lastmod.
 */
function w3c_date(int $timestamp): string {
    return date('Y-m-d', $timestamp);
}

/**
 * XML-encode a URL safely.
 */
function xml_url(string $url): string {
    return htmlspecialchars($url, ENT_XML1 | ENT_COMPAT, 'UTF-8');
}

/**
 * Build a <url> block.
 */
function url_entry(string $loc, string $lastmod = '', string $changefreq = 'monthly', string $priority = '0.5'): string {
    $out  = "  <url>\n";
    $out .= "    <loc>" . xml_url($loc) . "</loc>\n";
    if ($lastmod) {
        $out .= "    <lastmod>" . htmlspecialchars($lastmod, ENT_XML1) . "</lastmod>\n";
    }
    $out .= "    <changefreq>" . htmlspecialchars($changefreq, ENT_XML1) . "</changefreq>\n";
    $out .= "    <priority>" . htmlspecialchars($priority, ENT_XML1) . "</priority>\n";
    $out .= "  </url>\n";
    return $out;
}

// ── Collect: Static Pages ────────────────────────────────────────────────────
$pages = [];

// Option A — hardcoded static pages (add as many as needed, no limit)
$static_pages = [
    ['path' => '/',           'changefreq' => 'weekly',  'priority' => '1.0'],
    ['path' => '/about',      'changefreq' => 'monthly', 'priority' => '0.8'],
    ['path' => '/contact',    'changefreq' => 'monthly', 'priority' => '0.7'],
    ['path' => '/services',   'changefreq' => 'weekly',  'priority' => '0.9'],
    ['path' => '/portfolio',  'changefreq' => 'weekly',  'priority' => '0.8'],
    ['path' => '/pricing',    'changefreq' => 'monthly', 'priority' => '0.7'],
    ['path' => '/faq',        'changefreq' => 'monthly', 'priority' => '0.6'],
    ['path' => '/privacy',    'changefreq' => 'yearly',  'priority' => '0.3'],
    ['path' => '/terms',      'changefreq' => 'yearly',  'priority' => '0.3'],
];

foreach ($static_pages as $page) {
    $pages[] = $page;
}

// Option B — auto-scan a /pages directory (no limit, all .php and .html files)
if (is_dir($pages_dir)) {
    $scanned = scan_files($pages_dir, __DIR__);
    foreach ($scanned as $rel) {
        // Skip if already added as a static page
        $already = false;
        foreach ($static_pages as $sp) {
            if (rtrim($sp['path'], '/') === rtrim($rel, '/')) { $already = true; break; }
        }
        if (!$already) {
            $full_path = $pages_dir . $rel . '.php';
            if (!file_exists($full_path)) $full_path = $pages_dir . $rel . '.html';
            $mtime = file_exists($full_path) ? w3c_date(filemtime($full_path)) : '';
            $pages[] = ['path' => $rel, 'changefreq' => 'monthly', 'priority' => '0.6', 'lastmod' => $mtime];
        }
    }
}

// Option C — pages from database (uncomment to use)
// if (!empty($pdo)) {
//     $stmt = $pdo->query("SELECT slug, updated_at FROM pages WHERE status = 'published' ORDER BY id ASC");
//     while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
//         $pages[] = [
//             'path'       => '/' . ltrim($row['slug'], '/'),
//             'lastmod'    => w3c_date(strtotime($row['updated_at'])),
//             'changefreq' => 'monthly',
//             'priority'   => '0.7',
//         ];
//     }
// }

// ── Collect: Blog Posts ──────────────────────────────────────────────────────
$blogs = [];

// Option A — auto-scan /blog directory (no limit, all .php and .html files)
if (is_dir($blog_dir)) {
    $scanned = scan_files($blog_dir, __DIR__);
    foreach ($scanned as $rel) {
        $full_path = $blog_dir . str_replace('/blog', '', $rel) . '.php';
        if (!file_exists($full_path)) $full_path = $blog_dir . str_replace('/blog', '', $rel) . '.html';
        $mtime = file_exists($full_path) ? w3c_date(filemtime($full_path)) : '';
        $blogs[] = ['path' => $rel, 'lastmod' => $mtime, 'changefreq' => 'weekly', 'priority' => '0.8'];
    }
}

// Option B — blog posts from database (uncomment to use)
// if (!empty($pdo)) {
//     $stmt = $pdo->query("SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY id ASC");
//     while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
//         $blogs[] = [
//             'path'       => '/blog/' . ltrim($row['slug'], '/'),
//             'lastmod'    => w3c_date(strtotime($row['updated_at'])),
//             'changefreq' => 'weekly',
//             'priority'   => '0.8',
//         ];
//     }
// }

// ── Collect: Category Pages ──────────────────────────────────────────────────
$categories = [];

// Option A — hardcoded category pages (add as many as needed, no limit)
$static_categories = [
    '/category/seo',
    '/category/ai',
    '/category/marketing',
    '/category/web-development',
    '/category/tutorials',
];

foreach ($static_categories as $slug) {
    $categories[] = ['path' => $slug, 'changefreq' => 'weekly', 'priority' => '0.6'];
}

// Option B — categories from database (uncomment to use)
// if (!empty($pdo)) {
//     $stmt = $pdo->query("SELECT slug, updated_at FROM categories ORDER BY id ASC");
//     while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
//         $categories[] = [
//             'path'       => '/category/' . ltrim($row['slug'], '/'),
//             'lastmod'    => w3c_date(strtotime($row['updated_at'])),
//             'changefreq' => 'weekly',
//             'priority'   => '0.6',
//         ];
//     }
// }

// ── Output XML ───────────────────────────────────────────────────────────────
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
echo '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' . "\n";
echo '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9' . "\n";
echo '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">' . "\n\n";

// ── Step 1: Pages ────────────────────────────────────────────────────────────
echo "<!-- Here are pages -->\n";
foreach ($pages as $page) {
    $loc        = $base_url . $page['path'];
    $lastmod    = $page['lastmod']    ?? '';
    $changefreq = $page['changefreq'] ?? 'monthly';
    $priority   = $page['priority']   ?? '0.5';
    echo url_entry($loc, $lastmod, $changefreq, $priority);
}

echo "\n";

// ── Step 2: Blog Posts ───────────────────────────────────────────────────────
echo "<!-- Here are blog posts -->\n";
foreach ($blogs as $blog) {
    $loc        = $base_url . $blog['path'];
    $lastmod    = $blog['lastmod']    ?? '';
    $changefreq = $blog['changefreq'] ?? 'weekly';
    $priority   = $blog['priority']   ?? '0.8';
    echo url_entry($loc, $lastmod, $changefreq, $priority);
}

echo "\n";

// ── Step 3: Category Pages ───────────────────────────────────────────────────
echo "<!-- Here are category pages -->\n";
foreach ($categories as $cat) {
    $loc        = $base_url . $cat['path'];
    $lastmod    = $cat['lastmod']    ?? '';
    $changefreq = $cat['changefreq'] ?? 'weekly';
    $priority   = $cat['priority']   ?? '0.6';
    echo url_entry($loc, $lastmod, $changefreq, $priority);
}

echo "\n</urlset>\n";
