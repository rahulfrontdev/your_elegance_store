import React from "react";

const NewsLetter = () => {
    return (
        <div className="bg-teal-500 py-10 px-6 mt-4">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">

                {/* LEFT TEXT */}
                <div className="text-white">
                    <h2 className="text-3xl font-semibold">
                        Subscribe to Our Newsletter
                    </h2>

                    <p className="mt-2 text-sm opacity-90">
                        Subscribe to our newsletter & get notification about discounts.
                    </p>
                </div>

                {/* RIGHT INPUT */}
                <div className="flex w-full lg:w-auto bg-white rounded-full overflow-hidden shadow">

                    <input
                        type="email"
                        placeholder="Email address"
                        className="px-5 py-3 outline-none w-full lg:w-72 text-sm"
                    />

                    <button className="bg-teal-600 text-white px-6 text-sm font-medium">
                        Subscribe
                    </button>

                </div>

            </div>
        </div>
    );
};

export default NewsLetter;