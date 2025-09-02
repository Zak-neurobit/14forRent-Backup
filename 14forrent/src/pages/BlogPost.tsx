import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Calendar } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  image_url?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchBlogPost();
    }
  }, [slug]);

  const fetchBlogPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          throw error;
        }
      } else {
        setBlogPost(data);
      }
    } catch (error) {
      console.error("Error fetching blog post:", error);
      toast.error("Failed to load blog post");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const convertUrlsToLinks = (text: string) => {
    // Regex to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return text.replace(urlRegex, (url) => {
      // Remove trailing punctuation that might not be part of the URL
      const cleanUrl = url.replace(/[.,;!?]+$/, '');
      const punctuation = url.slice(cleanUrl.length);
      
      // Determine appropriate link text based on URL content
      let linkText = "click here";
      if (cleanUrl.includes("zillow") || cleanUrl.includes("realtor") || cleanUrl.includes("apartments")) {
        linkText = "view listings";
      } else if (cleanUrl.includes("learn") || cleanUrl.includes("guide") || cleanUrl.includes("tips")) {
        linkText = "learn more";
      } else if (cleanUrl.includes("contact") || cleanUrl.includes("apply")) {
        linkText = "get started";
      }
      
      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-medium">${linkText}</a>${punctuation}`;
    });
  };

  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((paragraph, index) => {
        // Check if it's a heading (starts with # or ##)
        if (paragraph.startsWith('##')) {
          return (
            <h3 key={index} className="text-xl font-bold mt-6 mb-3 text-forrent-navy">
              {paragraph.replace('##', '').trim()}
            </h3>
          );
        }
        if (paragraph.startsWith('#')) {
          return (
            <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-forrent-navy">
              {paragraph.replace('#', '').trim()}
            </h2>
          );
        }
        
        // Check if it's a standalone URL (entire paragraph is just a URL)
        if (paragraph.trim().match(/^https?:\/\/[^\s]+$/)) {
          const url = paragraph.trim();
          let linkText = "Visit Link";
          if (url.includes("zillow") || url.includes("realtor") || url.includes("apartments")) {
            linkText = "View Listings";
          } else if (url.includes("learn") || url.includes("guide") || url.includes("tips")) {
            linkText = "Learn More";
          }
          
          return (
            <div key={index} className="my-4">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-forrent-navy text-white rounded-md hover:bg-forrent-lightNavy transition-colors text-sm font-medium"
              >
                {linkText}
              </a>
            </div>
          );
        }
        
        // Regular paragraph - convert inline URLs to links
        if (paragraph.trim()) {
          const formattedText = convertUrlsToLinks(paragraph);
          return (
            <p 
              key={index} 
              className="mb-4 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formattedText }}
            />
          );
        }
        
        return null;
      })
      .filter(Boolean);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="forrent-container py-8 md:py-16">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forrent-navy"></div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (notFound || !blogPost) {
    return (
      <>
        <Navbar />
        <div className="forrent-container py-8 md:py-16">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
            <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
            <Link to="/blog">
              <Button className="flex items-center gap-2">
                <ArrowLeft size={16} />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Generate blog post meta data
  const blogTitle = `${blogPost.title} | 14ForRent Blog`;
  const blogDescription = blogPost.content.replace(/<[^>]*>/g, '').substring(0, 160) + '...';
  const blogUrl = `https://14forrent.com/blog/${blogPost.slug}`;
  const blogImage = blogPost.image_url || 'https://14forrent.com/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png';

  // Generate breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Blog", href: "/blog" },
    { label: blogPost.title, current: true }
  ];

  // Generate structured data for blog post
  const blogStructuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blogPost.title,
    "description": blogDescription,
    "image": blogImage,
    "url": blogUrl,
    "datePublished": blogPost.created_at,
    "dateModified": blogPost.updated_at,
    "author": {
      "@type": "Organization",
      "name": "14ForRent",
      "url": "https://14forrent.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "14ForRent",
      "logo": {
        "@type": "ImageObject",
        "url": "https://14forrent.com/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": blogUrl
    }
  };

  return (
    <>
      <SEOMeta
        title={blogTitle}
        description={blogDescription}
        keywords={`real estate blog, ${blogPost.title}, property insights, rental tips, 14ForRent blog`}
        image={blogImage}
        url={blogUrl}
        type="article"
        structuredData={blogStructuredData}
        canonical={blogUrl}
      />
      <Navbar />
      
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="forrent-container py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>
      
      <div className="forrent-container py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          <Link to="/blog">
            <Button variant="ghost" className="mb-6 flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Blog
            </Button>
          </Link>

          <Card className="overflow-hidden">
            {blogPost.image_url && (
              <div className="w-full overflow-hidden">
                <img
                  src={blogPost.image_url}
                  alt={blogPost.title}
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default">Published</Badge>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar size={14} />
                  <span className="text-sm">{formatDate(blogPost.created_at)}</span>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-forrent-navy mb-6">
                {blogPost.title}
              </h1>
              
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-700">
                  {formatContent(blogPost.content)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BlogPost;
