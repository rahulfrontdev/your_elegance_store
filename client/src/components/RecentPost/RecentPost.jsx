import React from "react";
import { Calendar, User } from "lucide-react";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const posts = [
    {
        id: 1,
        title: "Stories of Satisfaction and Success",
        image:
            "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=600",
        author: "Demo Admin",
        date: "24 Feb, 2026",
    },
    {
        id: 2,
        title: "Hear What Our Customers Have to Say",
        image:
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600",
        author: "Demo Admin",
        date: "24 Feb, 2026",
    },
    {
        id: 3,
        title: "Real-Life Testimonials from Satisfied Buyers",
        image:
            "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600",
        author: "Demo Admin",
        date: "24 Feb, 2026",
    },
    {
        id: 4,
        title: "Key Trends Set to Dominate Ecommerce Landscape",
        image:
            "https://images.unsplash.com/photo-1520975922327-94b3c7b6c79b?w=600",
        author: "Demo Admin",
        date: "24 Feb, 2026",
    },
];

const RecentPost = () => {
    return (
        <div className="bg-gray-100 p-6">

            {/* heading */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold">Recent Posts</h2>
                    <div className="w-12 h-[3px] bg-teal-500 mt-1"></div>
                </div>

                <button className="text-gray-500 text-sm hover:text-black">
                    View All
                </button>
            </div>

            {/* cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {posts.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition"
                    >

                        {/* image */}
                        <img
                            src={item.image}
                            alt="blog"
                            className="h-44 w-full object-cover"
                        />

                        <div className="p-4">

                            {/* author + date */}
                            <div className="flex gap-4 text-gray-500 text-xs mb-2">
                                <span className="flex items-center gap-1">
                                    <User size={14} /> {item.author}
                                </span>

                                <span className="flex items-center gap-1">
                                    <Calendar size={14} /> {item.date}
                                </span>
                            </div>

                            {/* title */}
                            <h3 className="text-sm font-semibold mb-2">
                                {item.title}
                            </h3>

                            {/* read post */}
                            <button className="text-teal-500 text-sm font-medium">
                                Read Post
                            </button>

                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default RecentPost;