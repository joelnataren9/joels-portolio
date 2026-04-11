export type PostPreview = {
  slug: string;
  title: string;
  summary?: string;
  publishedAt?: string;
  published_at?: string;
  tags?: string[];
};

export async function fetchPosts(): Promise<PostPreview[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    return [];
  }

  try {
    const res = await fetch(`${baseUrl}/posts`, { next: { revalidate: 60 } });
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as PostPreview[];
    const getDate = (p: PostPreview) => (p.publishedAt ?? p.published_at) ?? "";
    return [...data].sort((a, b) => {
      const aDate = getDate(a) ? new Date(getDate(a)).getTime() : 0;
      const bDate = getDate(b) ? new Date(getDate(b)).getTime() : 0;
      return bDate - aDate;
    });
  } catch {
    return [];
  }
}
