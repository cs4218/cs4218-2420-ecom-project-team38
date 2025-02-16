import React from "react";
import Layout from "./../components/Layout";
// import { BiMailSend, BiPhoneCall, BiSupport } from "react-icons/bi";
import MailContact from "../components/Contact/mail";
import PhoneContact from "../components/Contact/phone";
import SupportContact from "../components/Contact/support";


const Contact = () => {
  return (
    <Layout title={"Contact us"}>
      <div className="row contactus ">
        <div className="col-md-6 ">
          <img
            src="/images/contactus.jpeg"
            alt="contactus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <h1 className="bg-dark p-2 text-white text-center">CONTACT US</h1>
          <p className="text-justify mt-2">
            For any query or info about product, feel free to call anytime. We are
            available 24X7.  
          </p>
          {/* <p className="mt-3">
            <BiMailSend /> : www.help@ecommerceapp.com
          </p>
          <p className="mt-3">
            <BiPhoneCall /> : 012-3456789
          </p>
          <p className="mt-3">
            <BiSupport /> : 1800-0000-0000 (toll free)
          </p> */}
          <MailContact />
          <PhoneContact />
          <SupportContact />
        </div>
      </div>
    </Layout>
  );
};

export default Contact;