import React, { useEffect, useState } from "react";
import axios from "axios";
import PageButton from "./components/PageButton";

const App = () => {
  const [productData, setProductData] = useState([]);
  const [currentPage, setCurrentPage] = useState(3);
  const [postPerPage, setPostPerPage] = useState(6);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await axios.get("https://dummyjson.com/products");
      setProductData(res.data.products);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <h1 className="text-center mt-10">Loading...</h1>;

  const lastPostIndex = currentPage * postPerPage
  const firstPostIndex = lastPostIndex - postPerPage
  const currentPost = productData.slice(firstPostIndex, lastPostIndex)

  return (
    <div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentPost.map((product) => (
          <div
            key={product.id}
            className="border rounded-lg p-4 shadow-md hover:shadow-lg transition"
          >
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-48 object-cover rounded"
            />

            <h2 className="text-xl font-bold mt-3">{product.title}</h2>

            <p className="text-gray-600 mt-2 line-clamp-3">
              {product.description}
            </p>

            <p className="text-lg font-semibold text-green-600 mt-3">
              ${product.price}
            </p>
          </div>
        ))}
      </div>

      <PageButton
        totalPosts={productData.length}
        postPerPage={postPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

    </div>
  );
};

export default App;