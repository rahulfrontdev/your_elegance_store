import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const ACCOUNT_LINKS = [
    { label: "My Orders", to: "/account/orders" },
    { label: "Wishlist", to: "/wishlist" },
    { label: "My Profile", to: "/account/profile" },
];

const SOCIAL_LINKS = {
    facebook: "https://www.facebook.com/share/1DhyNCZAmU/?mibextid=wwXIfr",
    instagram: "https://www.instagram.com/yourelegancestore_?igsh=aXo1aHlka2RtaXV6",
};

function FacebookIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

function InstagramIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
    );
}

function AccountFooterLink({ to, children }) {
    const { isAuthenticated } = useAuth();

    return (
        <Link
            to={isAuthenticated ? to : "/login"}
            state={isAuthenticated ? undefined : { from: { pathname: to } }}
            className="hover:text-black"
        >
            {children}
        </Link>
    );
}

const Footer = () => {
    return (
        <footer className="bg-gray-100 mt-4 px-2 pb-4 pt-6 sm:mt-5 sm:px-3 sm:pb-5 sm:pt-7 lg:px-4">

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-left">

                    {/* CONTACT */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-4">Contact Us</h3>

                        <div className="space-y-2 text-sm text-gray-600">
                            <p>
                                <a href="tel:+919009488488" className="hover:text-black">
                                    +91 9009488488
                                </a>
                            </p>
                            <p>
                                <a href="mailto:info@yes.com" className="hover:text-black">
                                    info@yes.com
                                </a>
                            </p>
                            <p>Hyderabad, India</p>
                        </div>

                        <div className="mt-4">
                            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                                Follow us
                            </p>
                            <div className="flex justify-start gap-3">
                                <a
                                    href={SOCIAL_LINKS.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Your Elegance Store on Facebook"
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-[#1877F2] transition hover:scale-105 hover:border-gray-400 hover:shadow-sm"
                                >
                                    <FacebookIcon />
                                </a>
                                <a
                                    href={SOCIAL_LINKS.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Your Elegance Store on Instagram"
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-[#E4405F] transition hover:scale-105 hover:border-gray-400 hover:shadow-sm"
                                >
                                    <InstagramIcon />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* MY ACCOUNT */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-4">My Account</h3>

                        <ul className="space-y-2 text-sm text-gray-600">
                            {ACCOUNT_LINKS.map((item) => (
                                <li key={item.to}>
                                    <AccountFooterLink to={item.to}>{item.label}</AccountFooterLink>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* OUR SERVICES */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-4">Our Services</h3>

                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <Link to="/return-policy" className="hover:text-black">
                                    Return Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/shipping-policy" className="hover:text-black">
                                    Shipping Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="hover:text-black">
                                    Terms &amp; Conditions
                                </Link>
                            </li>
                            {/* <li>
                                <Link to="/terms#product" className="hover:text-black">
                                    Product
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms#services" className="hover:text-black">
                                    Services
                                </Link>
                            </li> */}
                            {/* <li>
                                <Link to="/terms#pricing-information" className="hover:text-black">
                                    Pricing Information
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms#credit-card-details" className="hover:text-black">
                                    Credit Card Details
                                </Link>
                            </li> */}
                            {/* <li>
                                <Link to="/terms#delivery-of-product" className="hover:text-black">
                                    Delivery of the Product
                                </Link>
                            </li> */}
                            {/* <li>
                                <Link to="/terms#warranties-and-claims" className="hover:text-black">
                                    Warranties and Claims
                                </Link>
                            </li> */}
                            <li>
                                <Link to="/privacy-policy" className="hover:text-black">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* INFORMATION */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-4">Information</h3>

                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <Link to="/about" className="hover:text-black">
                                    About Us
                                </Link>
                            </li>
                            {/* <li className="hover:text-black cursor-pointer">New Arrivals</li>
                            <li className="hover:text-black cursor-pointer">Special Offers</li>
                            <li className="hover:text-black cursor-pointer">Hot Deals</li> */}
                        </ul>
                    </div>
                </div>
            </div>

            {/* bottom */}
            <div className="border-t mt-8 sm:mt-10 pt-4 text-center text-xs sm:text-sm text-gray-500">
                © 2026 Your Elegance Store. All rights reserved.
            </div>

        </footer>
    );
};

export default Footer;