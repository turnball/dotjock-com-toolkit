pub struct SeoReport {
    pub url: String,
    pub title: Option<String>,
    pub meta_description: Option<String>,
    pub canonical: Option<String>,
    pub missing_alt_count: usize,
    pub has_robots: bool,
    pub has_sitemap: bool,
}
