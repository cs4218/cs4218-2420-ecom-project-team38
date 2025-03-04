import React from "react";
import Layout from "./../components/Layout";

const About = () => {
  return (
    <Layout title={"About Us"}>
      <div className="row aboutus">
        <div className="col-md-6">
          <img
            src="/images/about.jpeg"
            alt="About Us"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <h1 className="bg-dark p-2 text-white text-center">ABOUT US</h1>
          <p className="text-justify mt-2" data-testid="about-us-content">
            Welcome to Virtual Vault, an e-commerce website designed for
            seamless connectivity and user-friendly experiences.
            <br />
            <br />
            Start your shopping journey with us today!
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;
