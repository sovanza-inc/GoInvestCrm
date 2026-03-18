import { useParams, Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ArrowLeft, ArrowRight, Clock, User, ChevronRight } from "lucide-react";
import { BLOG_POSTS, BLOG_CATEGORIES } from "@/data/blogData";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The blog post you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/blog")} className="rounded-full" style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  const currentIndex = BLOG_POSTS.findIndex(p => p.slug === slug);
  const nextPost = BLOG_POSTS[currentIndex + 1] || BLOG_POSTS[0];
  const prevPost = BLOG_POSTS[currentIndex - 1] || BLOG_POSTS[BLOG_POSTS.length - 1];
  const relatedPosts = BLOG_POSTS.filter(p => p.slug !== slug && p.category === post.category).slice(0, 2);
  if (relatedPosts.length < 2) {
    const extras = BLOG_POSTS.filter(p => p.slug !== slug && !relatedPosts.find(r => r.slug === p.slug)).slice(0, 2 - relatedPosts.length);
    relatedPosts.push(...extras);
  }

  const categoryLabel = BLOG_CATEGORIES.find(c => c.key === post.category)?.label || post.category;

  return (
    <div className="min-h-screen bg-card" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><Zap className="w-4 h-4 text-foreground" /></div>
            <span className="text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>GoSocial</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Features</Link>
            <Link to="/#solutions" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Solutions</Link>
            <Link to="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Pricing</Link>
            <Link to="/blog" className="text-sm text-foreground font-semibold">Blog</Link>
          </div>
          <Link to="/login" className="text-foreground font-bold text-sm h-10 px-6 rounded-full shadow-lg inline-flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
            <ArrowRight className="w-4 h-4" /> Start for free
          </Link>
        </div>
      </nav>

      {/* Article */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex gap-12">

          {/* Sidebar - Table of Contents */}
          <aside className="hidden lg:block w-56 shrink-0 sticky top-24 self-start" data-testid="blog-toc">
            <div className="border border-border rounded-xl p-5">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Table of Content</h4>
              <ul className="space-y-2.5">
                {post.sections.map((section, i) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}
                      className="text-sm text-muted-foreground hover:text-blue-600 transition-colors leading-snug block"
                      data-testid={`toc-link-${section.id}`}>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <article className="flex-1 min-w-0" data-testid="blog-article">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-muted-foreground">{categoryLabel}</span>
            </div>

            {/* Category Badge */}
            <Badge className="bg-blue-100 text-blue-700 border-0 text-xs px-3 py-0.5 mb-4 font-medium" data-testid="blog-detail-category">
              {categoryLabel}
            </Badge>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="blog-detail-title">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8" data-testid="blog-detail-meta">
              <span className="flex items-center gap-1.5">{post.date}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{post.readTime}</span>
            </div>

            {/* Hero Image */}
            <div className="rounded-2xl overflow-hidden border border-border mb-10">
              <img src={post.image} alt={post.title} className="w-full h-64 sm:h-96 object-cover" data-testid="blog-detail-image" />
            </div>

            {/* Article Sections */}
            <div className="prose prose-slate max-w-none" data-testid="blog-detail-content">
              {post.sections.map((section, i) => (
                <div key={section.id} id={section.id} className="mb-10 scroll-mt-24">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {section.title}
                  </h2>
                  <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                    {section.content.split('\n\n').map((paragraph, pi) => {
                      // Handle bold text
                      const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
                      return (
                        <p key={pi} className="mb-4">
                          {parts.map((part, partIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={partIdx} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
                            }
                            return <span key={partIdx}>{part}</span>;
                          })}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Author Card */}
            <div className="border-t border-border pt-8 mt-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {post.author.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground" data-testid="blog-author">{post.author}</p>
                  <p className="text-xs text-muted-foreground">{post.authorRole} at GoSocial</p>
                </div>
              </div>
            </div>

            {/* Prev / Next Navigation */}
            <div className="grid grid-cols-2 gap-4 mt-10 pt-8 border-t border-border">
              <Link to={`/blog/${prevPost.slug}`} className="group p-4 rounded-xl border border-border hover:border-blue-300 transition-colors" data-testid="blog-prev-post">
                <span className="text-xs text-muted-foreground mb-1 block">Previous</span>
                <span className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors line-clamp-2">{prevPost.title}</span>
              </Link>
              <Link to={`/blog/${nextPost.slug}`} className="group p-4 rounded-xl border border-border hover:border-blue-300 transition-colors text-right" data-testid="blog-next-post">
                <span className="text-xs text-muted-foreground mb-1 block">Next</span>
                <span className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors line-clamp-2">{nextPost.title}</span>
              </Link>
            </div>
          </article>
        </div>
      </div>

      {/* Related Posts */}
      <section className="py-12 px-6 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-foreground text-center mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>Related Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="blog-related-posts">
            {relatedPosts.map(rp => (
              <Link key={rp.slug} to={`/blog/${rp.slug}`} className="group flex gap-4 items-start bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow" data-testid={`related-${rp.slug}`}>
                <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
                  <img src={rp.image} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge className="bg-muted text-muted-foreground border-0 text-[10px] px-2 py-0.5 mb-1.5 font-medium">
                    {BLOG_CATEGORIES.find(c => c.key === rp.category)?.label}
                  </Badge>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">{rp.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{rp.date}</span>
                    <span>{rp.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-6" style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(59,130,246,0.08) 0%, transparent 60%), #020617" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-foreground mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>Ready to grow your social sales?</h3>
          <p className="text-sm text-muted-foreground mb-6">Start your 7-day free trial. No credit card required.</p>
          <Link to="/login" className="text-foreground font-bold text-sm h-12 px-8 rounded-full shadow-xl inline-flex items-center gap-2 hover:-translate-y-0.5 transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}
            data-testid="blog-cta-btn">
            <ArrowRight className="w-4 h-4" /> Start free trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-[#020617] border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center"><Zap className="w-3 h-3 text-foreground" /></div>
            <span className="text-sm font-bold text-foreground">GoSocial</span>
          </Link>
          <p className="text-xs text-muted-foreground">AI-powered social selling platform for creators</p>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} GoSocial. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
