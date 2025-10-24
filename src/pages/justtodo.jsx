import { React, useState, useEffect } from 'react'
import { useStore } from '../contexts/StoreContext'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import axios from 'axios'
import { MdDescription } from 'react-icons/md'


const SingleProductFullScreen = () => {
    const store = useStore();
    const {
        product = [],
        error = null,
    } = store || {};
    const [toastVisible, setToastVisible] = useState(false);
    const { id } = useParams();

    const navigation = useNavigate();

    const addToCart = async () => {
        const token = localStorage.getItem("AuthToken");
        if (!token) {
            console.error("User not authenticated");
            return;
        }
        loading(true);
        try {
            await axios.post(
                `${api}/cart/add`,
                { product },
                { headers: { Authorazation: `Bearer ${token}` } }
            )

            setToastVisible(true);
            window.setTimeout(() => setToastVisible(false), 2500)
        } catch (err) {
            console.error("Error adding to cart:", err);
        } finally {
            loading(false);
        }
    };

    UseEffect(() => {
        return () => window.clearTimeout();
    }, []);


    return (
        <>
            <article
                className='bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-full
                           transition-transform durration-200 hover:-translate-y-1 hover:shadow-xl'
                aria-labelledby={`product-${id}-title`}
            >
                <Link t0={`/product/${id}`} className="flex-1 flex flex-col">
                    <div className='bg-gray-50 p-4 flex itmes-center justify-center'>
                        <img
                            src={produc.imag}
                            alt={product.title}
                            className="max-h-48 w-full object-contain"
                            loading="lazy" />
                    </div>
                    <div className='p-4 flex-1 flex flex-col'>
                        <h3
                            id={`product-${id}-title`}
                            className='text-base font-semibold text-gray-800 truncate'
                            title={product.title}
                        >
                            {title}
                        </h3>

                        <p
                            className='text-sm text-gray-500 mt-2 line-clamp-2'>
                            {description}
                        </p>
                    </div>
                </Link>

                <div className='p-4 border-t border-gray-100 flex items-center justify-between gap-4'>
                    <div className='flex items-baseline gap-2'>
                        <span className='text-xl font-bold text-black'>
                            ${Number(price).toFixed(2)}
                        </span>
                    </div>
                    <button
                        onClick={addToCart}
                        disabled={toastVisible}
                        className={`inline-flex items-center - gap-2 px-4 py-2 text-sm font-medium text-white
                    rounded-lg transitioon-colors  focus:outline-none focus:ring-2 focus:ring-indigo-300
                ${loading ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                                : "bg-black text-white hover:bg-black"
                            }`
                        } aria-pressed={loading}
                    >
                        {loading ? "Adding..." : "Add to Cart"}
                    </button>
                </div>
            </article>
            <div
                aria-live="polite"
                aria-atomic="true"
                className={`fixed left-1/2 bottom-6 z-50 transform -translate--x-1/2 transition-all duration-300 ${toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translae-y-6 pointer-events-none"}`} >

                <div className='bg-gray-900 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3'>
                    <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879A1 1 0 003.293 9.293l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Added to cart</span>
                </div>

            </div>
        </>
    )
}

export default SingleProductFullScreen