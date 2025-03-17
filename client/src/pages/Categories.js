import React from "react";
import { Link } from "react-router-dom";
import { useCategory } from "../context/category";
import Layout from "../components/Layout";

const Categories = () => {
  const [categories] = useCategory();

  return (
    <Layout title={"All Categories"}>
      <div className="container">
        <div
          className="py-3"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {categories.map((c) => (
            <div
              className="text-truncate"
              data-testid="category-link"
              key={c._id}
            >
              <Link
                to={`/category/${c.slug}`}
                className="btn btn-primary text-truncate"
                style={{ display: "block" }}
              >
                {c.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Categories;
