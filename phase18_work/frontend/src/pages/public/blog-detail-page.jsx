import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { Container } from '@/components/common/container';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTE_PATHS } from '@/app/router/route-paths';
import { publicApi } from '@/lib/api/public-api';

export function BlogDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    publicApi.getBlog(slug)
      .then((res) => { if (mounted) { setData(res.data); setError(''); } })
      .catch((err) => { if (mounted) setError(err.message); });
    return () => { mounted = false; };
  }, [slug]);
  const post = data?.post;

  const share = async () => {
    if (navigator.share) await navigator.share({ title: post?.title, url: location.href });
    else await navigator.clipboard.writeText(location.href);
    setMessage('Đã copy link chia sẻ.');
  };

  if (error && !post) return <PageShell><Container><div className="rounded-2xl bg-destructive/10 p-4 text-destructive">{error}</div></Container></PageShell>;
  if (!post) return <PageShell><Container><div className="h-96 animate-pulse rounded-[2rem] bg-secondary/60" /></Container></PageShell>;

  return (
    <PageShell className="py-10 sm:py-14 lg:py-20">
      <Container className="max-w-5xl">
        <p className="text-xs uppercase tracking-[0.22em] text-primary sm:text-sm">{post.category?.name || 'Blog'}</p>
        <h1 className="mt-4 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">{post.title}</h1>
        <p className="mt-5 text-sm text-muted-foreground sm:text-base">{post.readingMinutes} phút đọc · {post.viewCount} lượt xem</p>
        {post.featuredImage?.secureUrl ? <ImageWithFallback src={post.featuredImage.secureUrl} alt={post.title} className="mt-8 aspect-[16/10] w-full rounded-[1.75rem] object-cover sm:aspect-[16/8] sm:rounded-[2rem]" /> : null}
        <article className="prose prose-neutral mt-8 max-w-none break-words text-base leading-8 text-foreground dark:prose-invert sm:mt-10 sm:text-lg [&_*]:max-w-full [&_*]:break-words [&_*]:[overflow-wrap:anywhere] [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_h3]:mt-8 [&_h3]:font-display [&_img]:h-auto [&_img]:rounded-2xl [&_img]:object-cover" dangerouslySetInnerHTML={{ __html: post.content }} />
        <div className="mt-8 flex flex-wrap gap-3"><Button variant="outline" onClick={share}><Share2 /> Chia sẻ</Button></div>
        {message ? <div className="mt-5 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</div> : null}
        {error ? <div className="mt-5 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
        {(data.related || []).length ? <section className="mt-14"><h2 className="font-display text-2xl font-semibold sm:text-3xl">Bài viết liên quan</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{(data.related || []).map((item) => <Card key={item.uuid} className="bg-card/80"><CardContent className="p-5"><Link to={ROUTE_PATHS.blogDetail(item.slug)} className="line-clamp-2 font-display text-xl font-semibold leading-tight">{item.title}</Link><p className="mt-2 line-clamp-3 text-sm leading-7 text-muted-foreground">{item.excerpt}</p></CardContent></Card>)}</div></section> : null}
      </Container>
    </PageShell>
  );
}
