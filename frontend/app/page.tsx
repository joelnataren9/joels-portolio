import HomePageClient from "./components/HomePageClient";
import { fetchPosts } from "./lib/posts";

export default async function HomePage() {
  const posts = await fetchPosts();
  const recentPosts = posts.slice(0, 3);

  return <HomePageClient recentPosts={recentPosts} />;
}
