import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../../components/marketplace/ProductCard';
import { SearchX, Zap, Loader2 } from 'lucide-react';
import API from '../../api/axios';
import ProductSkeleton from '../../components/common/ProductSkeleton';
import { useInView } from 'react-intersection-observer'; // <-- NEW IMPORT

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination States
  const [nextCursor, setNextCursor] = useState(null);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  
  // The Intersection Observer Sensor
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1, // Trigger when 10% of the sensor is visible
  });

  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';

  // 1. Initial Load (Fires when URL changes)
  useEffect(() => {
    const fetchInitialItems = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/items?keyword=${keyword}&category=${category}`);
        setItems(data.items);
        setNextCursor(data.nextCursor);
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialItems();
  }, [keyword, category]); 

  // 2. Infinite Scroll Trigger (Fires when sensor enters view)
  useEffect(() => {
    if (inView && nextCursor && !isFetchingNextPage) {
      loadNextPage();
    }
  }, [inView, nextCursor]);

  const loadNextPage = async () => {
    setIsFetchingNextPage(true);
    try {
      const { data } = await API.get(`/items?keyword=${keyword}&category=${category}&cursor=${nextCursor}`);
      
      // Append the new items to the existing array
      setItems((prevItems) => [...prevItems, ...data.items]);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setIsFetchingNextPage(false);
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-8 font-sans">
      
      {(keyword || category) && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Results for {keyword ? `"${keyword}"` : ''} {category ? `in ${category}` : ''}
          </h2>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 px-4 bg-gray-50 rounded-3xl border border-gray-200 border-dashed max-w-2xl mx-auto mt-8">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-5">
            <SearchX className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto">
            It looks like nobody is selling this right now. Don't want to keep checking back? Let the system do the work for you.
          </p>
          <Link to="/profile" className="inline-flex items-center gap-2 bg-brand-dark hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg">
            <Zap className="w-4 h-4 text-brand-accent" />
            Set a Matchmaker Alert
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
            {items.map((item) => (
              <ProductCard key={item._id} item={item} />
            ))}
          </div>

          {/* --- THE INVISIBLE SENSOR --- */}
          {nextCursor && (
            <div ref={loadMoreRef} className="w-full flex justify-center py-10 mt-4">
              {isFetchingNextPage && <Loader2 className="w-8 h-8 animate-spin text-brand-link" />}
            </div>
          )}
        </>
      )}
    </div>
  );
}