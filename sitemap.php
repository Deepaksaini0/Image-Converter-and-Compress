<?php
/**
 * Dynamic XML Sitemap Generator
 *
 * Accessible at: https://example.com/sitemap.xml  (via .htaccess rewrite)
 *
 * Auto-scans:
 *   /pages/     → static pages
 *   /blog/      → blog posts
 *   /category/  → category pages
 *
 * Also supports database-driven detection (see DB section below).
 * No URL limit. Fully SEO compliant.
 */

// ── Output headers ────────────────────────────────────────────────────────────
header('Content-Type: application/xml; charset=utf-8');
header('X-Robots-Tag: noindex');   // Sitemap itself should not be indexed

// ── Configuration ─────────────────────────────────────────────────────────────
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$base_url  = $protocol . '://' . rtrim($_SERVER['HTTP_HOST'], '/');
$root_dir  = rtrim(__DIR__, DIRECTORY_SEPARATOR);

// Directories to scan (relative to document root)
$scan_dirs = [
    'pages'    => $root_dir . DIRECTORY_SEPARATOR . 'pages',
    'blog'     => $root_dir . DIRECTORY_SEPARATOR . 'blog',
    'category' => $root_dir . DIRECTORY_SEPARATOR . 'category',
];

// File extensions to include when scanning
$scan_extensions = ['php', 'html', 'htm'];

// Files/paths to skip during directory scans
$skip_files = ['index', '404', '500', 'error', 'header', 'footer', 'config', 'functions'];

// ── Database (optional) ───────────────────────────────────────────────────────
// Uncomment and configure to also pull URLs from a database.
//
// $db = new PDO('mysql:host=localhost;dbname=your_db;charset=utf8', 'user', 'pass', [
//     PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
//     PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
// ]);

// ── Helper: Scan directory recursively ───────────────────────────────────────
/**
 * Recursively scans a directory and returns all matching files as URL paths.
 * No limit on the number of files returned.
 *
 * @param  string   $dir        Absolute path to the directory.
 * @param  string   $url_prefix URL prefix for this section (e.g. "/blog").
 * @param  string[] $extensions Allowed file extensions.
 * @param  string[] $skip       Base filenames (without extension) to exclude.
 * @return array    Each entry: ['url' => string, 'lastmod' => string]
 */
function scan_directory(string $dir, string $url_prefix, array $extensions, array $skip): array {
    if (!is_dir($dir)) {
        return [];
    }

    $results  = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($iterator as $file) {
        /** @var SplFileInfo $file */
        if (!$file->isFile()) {
            continue;
        }

        $ext = strtolower($file->getExtension());
        if (!in_array($ext, $extensions, true)) {
            continue;
        }

        $basename = strtolower($file->getBasename('.' . $ext));
        if (in_array($basename, $skip, true)) {
            continue;
        }

        // Build the URL path relative to the scanned directory
        $relative = str_replace($dir, '', $file->getRealPath());
        $relative = str_replace('\\', '/', $relative);           // Windows compat
        $relative = '/' . ltrim($relative, '/');

        // Remove extension
        $relative = preg_replace('/\.(php|html|htm)$/i', '', $relative);

        // Strip /index suffix (directory index files become the directory URL)
        $relative = preg_replace('#/index$#i', '', $relative);

        $url = rtrim($url_prefix, '/') . $relative;

        $results[] = [
            'url'     => $url,
            'lastmod' => date('Y-m-d', $file->getMTime()),
        ];
    }

    // Sort alphabetically for consistent output
    usort($results, fn($a, $b) => strcmp($a['url'], $b['url']));

    return $results;
}

// ── Helper: Build a <url> entry ───────────────────────────────────────────────
function url_entry(string $loc, string $lastmod, string $changefreq, string $priority): string {
    return sprintf(
        "  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>%s</changefreq>\n    <priority>%s</priority>\n  </url>\n",
        htmlspecialchars($loc, ENT_XML1 | ENT_COMPAT, 'UTF-8'),
        htmlspecialchars($lastmod, ENT_XML1, 'UTF-8'),
        htmlspecialchars($changefreq, ENT_XML1, 'UTF-8'),
        htmlspecialchars($priority, ENT_XML1, 'UTF-8')
    );
}

// ── Collect URLs ──────────────────────────────────────────────────────────────

// ── Step 1: Static Pages (/pages/) ───────────────────────────────────────────
$pages = [];

// Homepage always first
$pages[] = [
    'url'        => $base_url . '/',
    'lastmod'    => date('Y-m-d'),
    'changefreq' => 'daily',
    'priority'   => '1.0',
];

// Auto-scan /pages/ directory
$scanned_pages = scan_directory(
    $scan_dirs['pages'],
    '',               // URL prefix: /pages/about → /about (strip /pages)
    $scan_extensions,
    $skip_files
);

// Remap scanned paths: remove the /pages prefix so /pages/about → /about
foreach ($scanned_pages as $item) {
    $url = preg_replace('#^/pages#i', '', $item['url']);
    if ($url === '' || $url === '/') continue; // skip if it duplicates homepage
    $pages[] = [
        'url'        => $base_url . $url,
        'lastmod'    => $item['lastmod'],
        'changefreq' => 'monthly',
        'priority'   => '0.8',
    ];
}

// Database-driven pages (uncomment to use)
// if (!empty($db)) {
//     $stmt = $db->query("SELECT slug, updated_at FROM pages WHERE status = 'published' ORDER BY id ASC");
//     foreach ($stmt as $row) {
//         $pages[] = [
//             'url'        => $base_url . '/' . ltrim($row['slug'], '/'),
//             'lastmod'    => date('Y-m-d', strtotime($row['updated_at'])),
//             'changefreq' => 'monthly',
//             'priority'   => '0.8',
//         ];
//     }
// }

// ── Step 2: Blog Posts (/blog/) ──────────────────────────────────────────────
$blogs = [];

// Auto-scan /blog/ directory
$scanned_blogs = scan_directory(
    $scan_dirs['blog'],
    '/blog',
    $scan_extensions,
    $skip_files
);

foreach ($scanned_blogs as $item) {
    $blogs[] = [
        'url'        => $base_url . $item['url'],
        'lastmod'    => $item['lastmod'],
        'changefreq' => 'weekly',
        'priority'   => '0.7',
    ];
}

// Database-driven blog posts (uncomment to use)
// if (!empty($db)) {
//     $stmt = $db->query("SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY id ASC");
//     foreach ($stmt as $row) {
//         $blogs[] = [
//             'url'        => $base_url . '/blog/' . ltrim($row['slug'], '/'),
//             'lastmod'    => date('Y-m-d', strtotime($row['updated_at'])),
//             'changefreq' => 'weekly',
//             'priority'   => '0.7',
//         ];
//     }
// }

// ── Step 3: Category Pages (/category/) ──────────────────────────────────────
$categories = [];

// Auto-scan /category/ directory
$scanned_cats = scan_directory(
    $scan_dirs['category'],
    '/category',
    $scan_extensions,
    $skip_files
);

foreach ($scanned_cats as $item) {
    $categories[] = [
        'url'        => $base_url . $item['url'],
        'lastmod'    => $item['lastmod'],
        'changefreq' => 'weekly',
        'priority'   => '0.6',
    ];
}

// Database-driven categories (uncomment to use)
// if (!empty($db)) {
//     $stmt = $db->query("SELECT slug, updated_at FROM categories ORDER BY id ASC");
//     foreach ($stmt as $row) {
//         $categories[] = [
//             'url'        => $base_url . '/category/' . ltrim($row['slug'], '/'),
//             'lastmod'    => date('Y-m-d', strtotime($row['updated_at'])),
//             'changefreq' => 'weekly',
//             'priority'   => '0.6',
//         ];
//     }
// }

// ── Stream XML output ─────────────────────────────────────────────────────────
// Using output buffering + flush() allows serving thousands of URLs
// without hitting PHP memory limits.

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset' . "\n";
echo '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
echo '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' . "\n";
echo '  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9' . "\n";
echo '                      http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">' . "\n\n";

// ── Pages ──────────────────────────────────────────────────────────────────────
echo "<!-- Here are pages -->\n";
foreach ($pages as $entry) {
    echo url_entry($entry['url'], $entry['lastmod'], $entry['changefreq'], $entry['priority']);
    flush();
}

echo "\n";

// ── Blog Posts ────────────────────────────────────────────────────────────────
echo "<!-- Here are blog posts -->\n";
foreach ($blogs as $entry) {
    echo url_entry($entry['url'], $entry['lastmod'], $entry['changefreq'], $entry['priority']);
    flush();
}

echo "\n";

// ── Category Pages ────────────────────────────────────────────────────────────
echo "<!-- Here are category pages -->\n";
foreach ($categories as $entry) {
    echo url_entry($entry['url'], $entry['lastmod'], $entry['changefreq'], $entry['priority']);
    flush();
}

echo "\n</urlset>\n";
