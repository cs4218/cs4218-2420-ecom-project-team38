import React from "react";
import Layout from "./../components/Layout";

const Policy = () => {
  return (
    <Layout title={"Privacy Policy"}>
      <div className='row contactus'>
        <div className='col-md-6 '>
          <img src='/images/contactus.jpeg' alt='Privacy Policy' style={{ width: "100%" }} />
        </div>
        <div className='col-md-4'>
          <h1 className='bg-dark p-2 text-white text-center'>PRIVACY POLICY</h1>
          <div data-testid='policy-content'>
          <p>
              We value your privacy and are committed to protecting your personal data. 
              This privacy policy outlines how we collect, use and safeguard your information when you use our website.
            </p>
            <h3>Information We Collect</h3>
            <ul>
              <li>Personal details (e.g. name, email, phone number) when you create your account. </li>
              <li>Usage data such as IP addresses, browser type and website interactions. </li>
            </ul>
            <h3>How We Use Your Information</h3>
            <ul>
              <li>To improve our services and user experience.</li>  
              <li>To communicate with you regarding updates, promotions, or support. </li>
            </ul>
            <h3>Data Protection</h3>
            <p>
              We implement security measures to protect your personal data from unauthorized access, disclosure or loss.
            </p>
            <h3>Third-Party Services</h3>
            <p>
              We may use third-party services (e.g. analytics, payment providers) that collect and process data in accordance with their own privacy policies.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Policy;
