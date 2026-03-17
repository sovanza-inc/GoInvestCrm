import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Zap, Search, ArrowRight, Clock, User, ChevronRight } from "lucide-react";
import { BLOG_POSTS, BLOG_CATEGORIES } from "@/data/blogData";

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchesCategory = activeCategory === "all" || post.category === activeCategory;
      const matchesSearch = !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const featuredPosts = BLOG_POSTS.filter(p => p.featured);
  const latestPost = BLOG_POSTS[0];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>GoSocial</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/#features" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Features</Link>
            <Link to="/#solutions" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Solutions</Link>
            <Link to="/#pricing" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Pricing</Link>
            <Link to="/blog" className="text-sm text-slate-900 font-semibold">Blog</Link>
          </div>
          <Link to="/login" className="text-white font-bold text-sm h-10 px-6 rounded-full shadow-lg inline-flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
            <ArrowRight className="w-4 h-4" /> Start for free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Blogs</h1>

          {/* Search */}
          <div className="max-w-md mx-auto relative mb-8" data-testid="blog-search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              data-testid="blog-search-input"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center justify-center gap-2 flex-wrap" data-testid="blog-categories">
            {BLOG_CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} data-testid={`blog-cat-${cat.key}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Latest/Featured Post - Full Width */}
      {activeCategory === "all" && !searchQuery && (
        <section className="px-6 pb-12">
          <div className="max-w-4xl mx-auto">
            <Link to={`/blog/${latestPost.slug}`} className="group block" data-testid="blog-featured-post">
              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs px-3 py-0.5 mb-3 font-medium">
                {BLOG_CATEGORIES.find(c => c.key === latestPost.category)?.label}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {latestPost.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                <span>{latestPost.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{latestPost.readTime}</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
                <img src={latestPost.image} alt={latestPost.title} className="w-full h-64 sm:h-80 object-cover group-hover:scale-[1.02] transition-transform duration-500" />
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Featured Blog Section */}
      {activeCategory === "all" && !searchQuery && featuredPosts.length > 1 && (
        <section className="px-6 pb-16">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 text-center mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>Featured Blog</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map(post => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="group" data-testid={`blog-featured-${post.slug}`}>
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-3">
                    <img src={post.image} alt={post.title} className="w-full h-48 object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-2.5 py-0.5 mb-2 font-medium">
                    {BLOG_CATEGORIES.find(c => c.key === post.category)?.label}
                  </Badge>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-1">{post.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Industry Section */}
      {activeCategory === "all" && !searchQuery && (
        <section className="py-16 px-6 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 text-center mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>GoSocial for Industries</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {BLOG_POSTS.filter(p => !p.featured).slice(0, 3).map(post => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="group" data-testid={`blog-industry-${post.slug}`}>
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white mb-3">
                    <img src={post.image} alt={post.title} className="w-full h-40 object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                  </div>
                  <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px] px-2.5 py-0.5 mb-2 font-medium">
                    {BLOG_CATEGORIES.find(c => c.key === post.category)?.label}
                  </Badge>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-1">{post.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Explore All Blogs / Filtered Results */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-slate-900 text-center mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {searchQuery ? `Search results for "${searchQuery}"` : activeCategory !== "all" ? BLOG_CATEGORIES.find(c => c.key === activeCategory)?.label : "Explore All Blogs"}
          </h3>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-12" data-testid="blog-no-results">
              <p className="text-slate-400 text-base">No articles found. Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="blog-grid">
              {filteredPosts.map(post => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="group" data-testid={`blog-card-${post.slug}`}>
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white mb-3">
                    <img src={post.image} alt={post.title} className="w-full h-40 object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                  </div>
                  <Badge className="bg-slate-100 text-slate-600 border-0 text-[10px] px-2.5 py-0.5 mb-2 font-medium">
                    {BLOG_CATEGORIES.find(c => c.key === post.category)?.label}
                  </Badge>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-1">{post.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-2">{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-[#020617] border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center"><Zap className="w-3 h-3 text-white" /></div>
            <span className="text-sm font-bold text-white">GoSocial</span>
          </Link>
          <p className="text-xs text-slate-600">AI-powered social selling platform for creators</p>
          <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} GoSocial. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
