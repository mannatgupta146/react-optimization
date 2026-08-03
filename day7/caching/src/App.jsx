import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const App = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef(null);

  const fetchPosts = async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);

      const res = await axios.get(
        `https://jsonplaceholder.typicode.com/posts?_limit=12&_page=${page}`
      );

      if (res.data.length === 0) {
        setHasMore(false);
        return;
      }

      // Prevent duplicate posts
      setPosts((prev) => {
        const ids = new Set(prev.map((item) => item.id));
        const newPosts = res.data.filter((item) => !ids.has(item.id));
        return [...prev, ...newPosts];
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const lastPostRef = (node) => {
    if (loading) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prev) => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-8">
        Infinite Scroll Posts
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, index) => {
          if (index === posts.length - 1) {
            return (
              <div
                ref={lastPostRef}
                key={post.id}
                className="border rounded-lg p-5 shadow hover:shadow-lg transition"
              >
                <h2 className="text-xl font-bold">{post.title}</h2>
                <p className="mt-2 text-gray-600">{post.body}</p>
              </div>
            );
          }

          return (
            <div
              key={post.id}
              className="border rounded-lg p-5 shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-bold">{post.title}</h2>
              <p className="mt-2 text-gray-600">{post.body}</p>
            </div>
          );
        })}
      </div>

      {loading && (
        <h2 className="text-center text-xl font-semibold my-6">
          Loading...
        </h2>
      )}

      {!hasMore && (
        <h2 className="text-center text-xl font-semibold my-6">
          No More Posts
        </h2>
      )}
    </div>
  );
};

export default App;