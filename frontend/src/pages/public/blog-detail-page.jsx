import { Link, useParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ROUTE_PATHS } from '@/app/router/route-paths';
import { Container } from '@/components/common/container';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { StatePanel } from '@/components/common/state-panel';
import { Button } from '@/components/ui/button';
import { publicApi } from '@/lib/api/public-api';
import { useAppStore } from '@/stores/app-store';

export function BlogDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const notify = useAppStore((state) => state.notify);
  useEffect(() => {
    publicApi
      .getBlog(slug)
      .then((response) => setData(response.data))
      .catch((err) => setError(err.message));
  }, [slug]);
  const post = data?.post;
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: post.title, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        notify('Đã sao chép link bài viết.');
      }
    } catch {
      /* User can dismiss the native sheet. */
    }
  };
  if (error)
    return (
      <Container className="py-16">
        <StatePanel type="error" title="Không tìm thấy bài viết" description={error} />
      </Container>
    );
  if (!post)
    return (
      <Container className="py-16">
        <StatePanel type="loading" title="Đang mở bài viết" />
      </Container>
    );
  const publishedDate = post.publishedAt || post.createdAt;
  return (
    <div className="pb-24">
      <Container className="max-w-5xl pt-14 text-center sm:pt-20">
        <p className="midi-eyebrow">{post.category?.name || 'Tạp chí Midi'}</p>
        <h1 className="mx-auto mt-5 max-w-4xl font-display text-5xl font-normal leading-[.94] tracking-[-0.055em] sm:text-7xl">
          {post.title}
        </h1>
        <p className="mt-6 text-xs text-muted-foreground">
          {post.author?.fullName || 'Midi Cosmetics'} ·{' '}
          {publishedDate ? new Date(publishedDate).toLocaleDateString('vi-VN') : ''} ·{' '}
          {post.readingMinutes || 1} phút đọc · {post.viewCount || 0} lượt xem
        </p>
      </Container>
      {post.featuredImage?.secureUrl ? (
        <Container className="mt-10 max-w-6xl">
          <ImageWithFallback
            src={post.featuredImage.secureUrl}
            alt={post.title}
            className="aspect-[16/8] w-full object-cover"
          />
        </Container>
      ) : null}
      <Container className="max-w-3xl">
        <article
          className="prose prose-neutral mt-10 max-w-none break-words font-display text-lg leading-8 text-foreground sm:text-xl [&_h2]:mt-12 [&_h2]:text-4xl [&_h2]:font-normal [&_h3]:mt-9 [&_h3]:text-3xl [&_h3]:font-normal [&_p]:my-6 [&_img]:w-full"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <div className="mt-10 border-y border-border py-6">
          <Button variant="outline" onClick={share}>
            <Share2 /> Chia sẻ bài viết
          </Button>
        </div>
      </Container>
      {data.related?.length ? (
        <Container className="mt-20">
          <p className="midi-eyebrow">Đọc tiếp</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {data.related.slice(0, 4).map((item) => (
              <Link
                key={item.uuid}
                to={ROUTE_PATHS.blogDetail(item.slug)}
                className="border-t border-border pt-5"
              >
                <p className="midi-eyebrow text-muted-foreground">
                  {item.category?.name || 'Tạp chí Midi'}
                </p>
                <h2 className="mt-3 font-display text-2xl font-normal leading-tight">
                  {item.title}
                </h2>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {item.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      ) : null}
    </div>
  );
}
