import React from "react";
import { Link } from "react-router-dom";
import { useCategory } from "../context/category";
import Layout from "../components/Layout";

const Categories = () => {
  const [categories] = useCategory();

  return (
    <Layout title={"All Categories"}>
      <div className="container">
        <div className="row">
          {categories.map((c) => (
            <div
              className="col-md-6 mt-5 mb-3 gx-3 gy-3"
              data-testid="category-link"
              key={c._id}
            >
              <Link to={`/category/${c.slug}`} className="btn btn-primary">
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
