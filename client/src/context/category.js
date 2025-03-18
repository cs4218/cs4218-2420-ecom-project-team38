import React from "react";
import { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const CategoryContext = createContext();

const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);

  //get cat
  const getCategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      setCategories(data?.category);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting categories");
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  return (
    <CategoryContext.Provider value={[categories, setCategories]}>
      {children}
    </CategoryContext.Provider>
  );
};

// custom hook
const useCategory = () => useContext(CategoryContext);

export { useCategory, CategoryProvider };
